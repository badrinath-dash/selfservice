# -*- coding: utf-8 -*-
"""
Utilities for Splunk TA for Apigee

Contains:
- Logging setup and log-level discovery
- Proxy configuration reader
- Account details reader
- Date/time helpers and timestamp extraction
- HTTP helpers (cert handling + retries)
- KVStore checkpoint helpers

AppInspect-friendly, no sys.exit in helpers (raise instead).
"""
from __future__ import annotations

import json
import logging
import os
import re
import tempfile
import time
from datetime import datetime
from typing import Any, Dict, Iterable, List, Optional, Tuple

import requests
from requests.auth import HTTPBasicAuth

from solnlib import conf_manager, log
from solnlib.modular_input import checkpointer

ADDON_NAME = "splunk_TA_Apigee"
CHECKPOINTER_COLLECTION = "splunk_ta_apigee_checkpointer"

# Module-level logger for utilities
_LOGGER = log.Logs().get_logger(f"{ADDON_NAME.lower()}_utils")


# ------------------------- Logging -------------------------

def get_log_level(session_key: str) -> str:
    """Fetch addon log level from settings conf. Fallback to DEBUG."""
    try:
        cfm = conf_manager.ConfManager(
            session_key,
            ADDON_NAME,
            realm=f"__REST_CREDENTIAL__#{ADDON_NAME}#configs/conf-splunk_ta_apigee_settings",
        )
        conf = cfm.get_conf("splunk_ta_apigee_settings")
        logging_details = conf.get("logging")
        return logging_details.get("loglevel", "DEBUG")
    except Exception as e:  # noqa: F841 - best-effort only
        return "DEBUG"


def set_logger(session_key: str, filename: str) -> logging.Logger:
    """Create a named logger and apply configured level."""
    logger = log.Logs().get_logger(filename)
    logger.setLevel(get_log_level(session_key))
    return logger


# ------------------------- Proxy -------------------------

def get_proxy_settings(logger: logging.Logger, session_key: str) -> Optional[Dict[str, str]]:
    """Read proxy settings from splunk_ta_apigee_settings.conf [proxy]."""
    try:
        cfm = conf_manager.ConfManager(
            session_key,
            ADDON_NAME,
            realm=f"__REST_CREDENTIAL__#{ADDON_NAME}#configs/conf-splunk_ta_apigee_settings",
        )
        conf_all = cfm.get_conf("splunk_ta_apigee_settings").get_all()
        stanza = dict(conf_all.get("proxy", {}))

        if int(str(stanza.get("proxy_enabled", 0))) == 0:
            logger.info("Proxy disabled; returning None")
            return None

        proxy_type = stanza.get("proxy_type", "http")
        proxy_url = stanza.get("proxy_url", "")
        proxy_port = stanza.get("proxy_port", "")
        proxy_username = stanza.get("proxy_username", "")
        proxy_password = stanza.get("proxy_password", "")

        if proxy_type == "socks5":
            proxy_type += "h"  # requests requires socks5h

        if proxy_username and proxy_password:
            proxy_username = requests.compat.quote_plus(proxy_username)
            proxy_password = requests.compat.quote_plus(proxy_password)
            proxy_uri = f"{proxy_type}://{proxy_username}:{proxy_password}@{proxy_url}:{proxy_port}"
        else:
            proxy_uri = f"{proxy_type}://{proxy_url}:{proxy_port}"

        return {"http": proxy_uri, "https": proxy_uri}

    except Exception as e:
        log.log_configuration_error(
            logger,
            e,
            full_msg=False,
            msg_before="Failed to fetch proxy settings",
        )
        return None


# ------------------------- Accounts -------------------------

def get_account_details(logger: logging.Logger, session_key: str, account_name: str) -> Dict[str, Any]:
    """Return account stanza as a dict from splunk_ta_apigee_account.conf.

    Expected fields (depending on MASSL config):
      - apigee_username, apigee_password
      - apigee_ssl_client_cert (PEM text), apigee_ssl_key (PEM text)
      - apigee_ssl_client_cert_path, apigee_ssl_key_path (optional file paths)
    """
    try:
        cfm = conf_manager.ConfManager(
            session_key,
            ADDON_NAME,
            realm=f"__REST_CREDENTIAL__#{ADDON_NAME}#configs/conf-splunk_ta_apigee_account",
        )
        account_conf = cfm.get_conf("splunk_ta_apigee_account")
        account_data = account_conf.get(account_name)
        if not account_data:
            raise KeyError(f"Account '{account_name}' not found")
        return dict(account_data)
    except Exception as e:
        log.log_configuration_error(
            logger,
            e,
            full_msg=False,
            msg_before=(
                f"Failed to fetch account details from splunk_ta_apigee_account.conf for account: {account_name}"
            ),
        )
        raise


# ------------------------- Time helpers -------------------------

def to_epoch_ms_from_datestr(date_str: str) -> int:
    """Accepts 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:MM:SS' and returns epoch ms."""
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
        try:
            return int(time.mktime(time.strptime(date_str, fmt)) * 1000)
        except ValueError:
            continue
    raise ValueError(f"Unsupported date format for start_from: {date_str!r}")


def default_start_ms(days: int = 7) -> int:
    return int((time.time() - days * 24 * 3600) * 1000)


def now_ms() -> int:
    return int(time.time() * 1000)


def validate_start_date(start_from: str, logger: logging.Logger) -> bool:
    """Validate YYYY-MM-DD not in the future."""
    if not start_from or not start_from.strip():
        return True

    s = start_from.strip()
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", s):
        logger.warning("Invalid date format for start_from: %s", s)
        raise ValueError("Date must be in YYYY-MM-DD format.")

    try:
        start_date = datetime.strptime(s, "%Y-%m-%d")
    except ValueError as e:
        logger.warning("Date parsing failed for start_from: %s", s)
        raise ValueError(f"Invalid date: {e}")

    if start_date > datetime.now():
        logger.warning("start_from date is in the future: %s", s)
        raise ValueError("Start date cannot be in the future.")

    return True


# ------------------------- Timestamp extraction -------------------------

def extract_timestamp_from_event(
    event: Dict[str, Any], timestamp_fields: List[str], logger: logging.Logger
) -> Optional[int]:
    """Extract event time (ms) using provided field paths (dot-notation supported)."""
    for field_path in timestamp_fields:
        try:
            value: Any = event
            for part in field_path.split('.'):
                if isinstance(value, dict):
                    value = value.get(part)
                else:
                    value = None
                if value is None:
                    break

            if value is None:
                continue

            if isinstance(value, (int, float)):
                return int(value if value > 946684800000 else value * 1000)

            if isinstance(value, str):
                try:
                    # Try ISO first
                    if 'T' in value and ('Z' in value or '+' in value):
                        dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
                        return int(dt.timestamp() * 1000)
                    # Try numeric string
                    num = float(value)
                    return int(num if num > 946684800000 else num * 1000)
                except Exception:
                    for fmt in (
                        "%Y-%m-%dT%H:%M:%S.%fZ",
                        "%Y-%m-%dT%H:%M:%SZ",
                        "%Y-%m-%dT%H:%M:%S",
                        "%Y-%m-%d %H:%M:%S",
                        "%Y-%m-%d",
                    ):
                        try:
                            dt = datetime.strptime(value, fmt)
                            return int(dt.timestamp() * 1000)
                        except Exception:
                            pass
            logger.debug("Found timestamp field '%s' but could not parse: %s", field_path, value)
        except Exception as ex:
            logger.debug("Error extracting timestamp from '%s': %s", field_path, ex)
    return None


# ------------------------- HTTP helpers -------------------------

def build_cert_files(
    logger: logging.Logger,
    account_name: str,
    client_cert_pem: Optional[str],
    client_key_pem: Optional[str],
    client_cert_path: Optional[str] = None,
    client_key_path: Optional[str] = None,
) -> Tuple[Optional[Tuple[str, str]], List[str]]:
    """Return (cert_tuple, temp_files) usable by requests."""
    temps: List[str] = []

    if client_cert_path and client_key_path and os.path.isfile(client_cert_path) and os.path.isfile(client_key_path):
        logger.debug("Using provided client cert/key file paths.")
        return (client_cert_path, client_key_path), temps

    if client_cert_pem and client_key_pem:
        cert_tmp = tempfile.NamedTemporaryFile(prefix=f"{ADDON_NAME}_{account_name}_cert_", suffix=".pem", delete=False)
        key_tmp = tempfile.NamedTemporaryFile(prefix=f"{ADDON_NAME}_{account_name}_key_", suffix=".key", delete=False)
        try:
            cert_tmp.write(client_cert_pem.encode("utf-8"))
            cert_tmp.flush()
            key_tmp.write(client_key_pem.encode("utf-8"))
            key_tmp.flush()
        finally:
            cert_tmp.close()
            key_tmp.close()
        os.chmod(cert_tmp.name, 0o600)
        os.chmod(key_tmp.name, 0o600)
        temps.extend([cert_tmp.name, key_tmp.name])
        return (cert_tmp.name, key_tmp.name), temps

    return None, temps


def cleanup_temp_files(logger: logging.Logger, paths: Iterable[str]) -> None:
    for p in paths or []:
        try:
            if p and os.path.exists(p):
                os.remove(p)
        except Exception as ex:
            logger.warning("Failed to delete temp file %s: %s", p, ex)


def http_get_with_retry(
    logger: logging.Logger,
    url: str,
    params: Dict[str, Any],
    headers: Dict[str, str],
    auth: Optional[HTTPBasicAuth],
    proxies: Optional[Dict[str, str]],
    cert: Optional[Tuple[str, str]],
    verify_ssl: bool,
    max_retries: int = 3,
    backoff_sec: float = 2.0,
    timeout: int = 60,
) -> requests.Response:
    last_exc: Optional[Exception] = None
    for attempt in range(1, max_retries + 1):
        try:
            resp = requests.get(
                url=url,
                params=params,
                headers=headers,
                auth=auth,
                proxies=proxies,
                cert=cert,
                verify=verify_ssl,
                timeout=timeout,
            )
            resp.raise_for_status()
            return resp
        except requests.exceptions.RequestException as ex:
            last_exc = ex
            logger.warning("HTTP GET failed (attempt %s/%s): %s", attempt, max_retries, ex)
            if attempt < max_retries:
                time.sleep(backoff_sec * attempt)
    if last_exc:
        raise last_exc
    raise RuntimeError("HTTP GET failed with unknown error")


# ------------------------- KV Checkpoint -------------------------

def get_checkpoint_manager(session_key: str) -> checkpointer.CheckpointerInterface:
    return checkpointer.KVStoreCheckpointer(
        collection_name=CHECKPOINTER_COLLECTION,
        session_key=session_key,
        app=ADDON_NAME,
    )


def get_last_checkpoint_time(
    ckpt_mgr: checkpointer.CheckpointerInterface,
    key: str,
    default_start_time: int,
    logger: logging.Logger,
) -> int:
    try:
        data = ckpt_mgr.get(key)
        if isinstance(data, dict) and data.get("last_event_time"):
            last_time = int(data["last_event_time"])
            logger.info(
                "Resuming from checkpoint: %s (%s)",
                last_time,
                datetime.fromtimestamp(last_time / 1000.0),
            )
            return last_time
    except Exception as ex:
        logger.warning("Failed to read checkpoint: %s", ex)
    logger.info("No valid checkpoint found, starting from: %s", default_start_time)
    return default_start_time


def update_checkpoint(
    ckpt_mgr: checkpointer.CheckpointerInterface,
    key: str,
    last_event_time: int,
    events_processed: int,
    logger: logging.Logger,
) -> None:
    try:
        ckpt_mgr.update(
            key,
            {
                "last_event_time": int(last_event_time),
                "events_processed": int(events_processed),
                "last_updated": now_ms(),
                "last_updated_human": datetime.fromtimestamp(time.time()).isoformat(),
            },
        )
        logger.debug("Checkpoint updated: last_event_time=%s", last_event_time)
    except Exception as ex:
        logger.error("Failed to update checkpoint: %s", ex)


__all__ = [
    "ADDON_NAME",
    "CHECKPOINTER_COLLECTION",
    "get_log_level",
    "set_logger",
    "get_proxy_settings",
    "get_account_details",
    "to_epoch_ms_from_datestr",
    "default_start_ms",
    "now_ms",
    "validate_start_date",
    "extract_timestamp_from_event",
    "build_cert_files",
    "cleanup_temp_files",
    "http_get_with_retry",
    "get_checkpoint_manager",
    "get_last_checkpoint_time",
    "update_checkpoint",
]
