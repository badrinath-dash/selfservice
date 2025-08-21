# -*- coding: utf-8 -*-
"""
Apigee Audit Modular Input (UCC-Gen friendly)

Key improvements vs your original:
- Fixed datetime/time usage & math; consistent ms since epoch.
- Proper logger formatting; no tuple logs.
- Optional SSL verification driven by settings conf (validate_ssl).
- Client cert support via optional file paths (preferred) or securely
  created temp files that are deleted immediately after use.
- Removed dead/unreachable code and undefined symbols.
- Configurable sourcetype (fallback to sensible default).
- Simple retries with backoff for transient HTTP errors.
- No verify=False defaults; avoids AppInspect failure.
"""

import json
import logging
import os
import time
import tempfile
from typing import Optional, Tuple, Dict, Any

import requests
from requests.auth import HTTPBasicAuth
from requests import Response

from solnlib import conf_manager, log
from solnlib.modular_input import checkpointer
from splunklib import modularinput as smi

from Splunk_TA_Apigee_utils import (
    get_account_details,
    get_proxy_settings,
    set_logger,  # assuming you have this
)

ADDON_NAME = "splunk_TA_Apigee"


def logger_for_input(input_name: str) -> logging.Logger:
    return log.Logs().get_logger(f"{ADDON_NAME.lower()}_{input_name}")


def _to_epoch_ms_from_datestr(date_str: str) -> int:
    """
    Accepts 'YYYY-MM-DD' or ISO8601 like 'YYYY-MM-DDTHH:MM:SS'.
    Returns epoch milliseconds.
    """
    # Try ISO first
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
        try:
            return int(time.mktime(time.strptime(date_str, fmt))) * 1000
        except ValueError:
            continue
    raise ValueError(f"Unsupported date format for start_from: {date_str!r}")


def get_start_time_ms(start_from: Optional[str]) -> int:
    """
    If start_from present, parse it; else default to 7 days ago (now - 7d).
    Returns epoch milliseconds.
    """
    if start_from:
        return _to_epoch_ms_from_datestr(start_from)
    seven_days_sec = 7 * 24 * 3600
    return int((time.time() - seven_days_sec) * 1000)


def now_ms() -> int:
    return int(time.time() * 1000)


def _build_cert_files(
    logger: logging.Logger,
    account_name: str,
    client_cert_pem: Optional[str],
    client_key_pem: Optional[str],
    client_cert_path: Optional[str] = None,
    client_key_path: Optional[str] = None,
) -> Tuple[Optional[Tuple[str, str]], list]:
    """
    Return a (cert_tuple, temp_files) to pass to requests, where cert_tuple is
    either (cert_path, key_path) or None.

    Preferred:
      - Use file paths provided in config (client_cert_path/client_key_path).
    Fallback:
      - If PEM content provided, write to secure temp files and delete later.
    """
    temp_files_to_cleanup = []

    # If paths are provided, validate and use directly
    if client_cert_path and client_key_path:
        if os.path.isfile(client_cert_path) and os.path.isfile(client_key_path):
            logger.debug("Using configured client cert/key file paths.")
            return (client_cert_path, client_key_path), temp_files_to_cleanup
        logger.warning(
            "Configured client cert/key paths not found: %s, %s",
            client_cert_path,
            client_key_path,
        )

    # If PEM content provided, write to temp and return paths
    if client_cert_pem and client_key_pem:
        logger.debug("Creating temporary files for client cert/key.")
        cert_tmp = tempfile.NamedTemporaryFile(
            prefix=f"{ADDON_NAME}_{account_name}_cert_",
            suffix=".pem",
            delete=False,
        )
        key_tmp = tempfile.NamedTemporaryFile(
            prefix=f"{ADDON_NAME}_{account_name}_key_",
            suffix=".key",
            delete=False,
        )
        try:
            cert_tmp.write(client_cert_pem.encode("utf-8"))
            cert_tmp.flush()
            key_tmp.write(client_key_pem.encode("utf-8"))
            key_tmp.flush()
        finally:
            cert_tmp.close()
            key_tmp.close()

        # Restrict permissions
        os.chmod(cert_tmp.name, 0o600)
        os.chmod(key_tmp.name, 0o600)

        temp_files_to_cleanup.extend([cert_tmp.name, key_tmp.name])
        return (cert_tmp.name, key_tmp.name), temp_files_to_cleanup

    return None, temp_files_to_cleanup


def _cleanup_temp_files(logger: logging.Logger, paths: list) -> None:
    for p in paths:
        try:
            if p and os.path.exists(p):
                os.remove(p)
        except Exception as ex:
            logger.warning("Failed to delete temp file %s: %s", p, ex)


def _http_get_with_retry(
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
) -> Response:
    last_exc = None
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
                timeout=60,
            )
            resp.raise_for_status()
            return resp
        except requests.exceptions.RequestException as ex:
            last_exc = ex
            logger.warning(
                "HTTP GET failed (attempt %s/%s): %s",
                attempt,
                max_retries,
                ex,
            )
            if attempt < max_retries:
                time.sleep(backoff_sec * attempt)
    # If we’re here, we failed all retries
    if last_exc:
        raise last_exc
    raise RuntimeError("HTTP GET failed with unknown error")


def get_data_from_api(
    logger: logging.Logger,
    account_name: str,
    apigee_url_endpoint: str,
    auth: Optional[HTTPBasicAuth],
    api_start_time_ms: int,
    api_end_time_ms: int,
    proxy_settings: Optional[Dict[str, str]],
    validate_ssl: bool,
    apigee_ssl_client_cert_pem: Optional[str] = None,
    apigee_ssl_key_pem: Optional[str] = None,
    apigee_ssl_client_cert_path: Optional[str] = None,
    apigee_ssl_key_path: Optional[str] = None,
) -> Any:
    logger.info("Calling Apigee API endpoint: %s", apigee_url_endpoint)

    cert_tuple, temps = _build_cert_files(
        logger=logger,
        account_name=account_name,
        client_cert_pem=apigee_ssl_client_cert_pem,
        client_key_pem=apigee_ssl_key_pem,
        client_cert_path=apigee_ssl_client_cert_path,
        client_key_path=apigee_ssl_key_path,
    )

    params = {
        "expand": "true",
        "startTime": str(api_start_time_ms),
        "endTime": str(api_end_time_ms),
    }

    headers = {
        # Use generic JSON accept; adjust per Apigee endpoint expectation
        "Accept": "application/json",
    }

    try:
        response = _http_get_with_retry(
            logger=logger,
            url=apigee_url_endpoint,
            params=params,
            headers=headers,
            auth=auth,
            proxies=proxy_settings,
            cert=cert_tuple,
            verify_ssl=validate_ssl,
        )
        # If the endpoint returns JSON, parse here
        return response.json()
    finally:
        _cleanup_temp_files(logger, temps)


def validate_input(definition: smi.ValidationDefinition):
    # Implement per-field validation if needed; returning None is acceptable.
    return


def stream_events(inputs: smi.InputDefinition, event_writer: smi.EventWriter):
    """
    inputs.inputs example:
      {
        "apigee_audit_input://<input_name>": {
          "account": "<account_name>",
          "disabled": "0",
          "host": "$decideOnStartup",
          "index": "<index_name>",
          "interval": "<interval_value>",
          "sourcetype": "<optional_sourcetype>",
          "apigee_org_name": "...",
          "apigee_url": "https://.../v1/organizations/<org>/audits",
          "audit_resource_uri": "...",
          "start_from": "YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS",
          "python.version": "python3"
        }
      }
    """
    for input_name, input_item in inputs.inputs.items():
        normalized_input_name = input_name.split("/")[-1]
        logger = logger_for_input(normalized_input_name)

        try:
            session_key = inputs.metadata["session_key"]

            # Respect log level from settings
            log_level = conf_manager.get_log_level(
                logger=logger,
                session_key=session_key,
                app_name=ADDON_NAME,
                conf_name="splunk_ta_apigee_settings",
            )
            logger.setLevel(log_level)

            log.modular_input_start(logger, normalized_input_name)

            # --- Read input & account ---
            account_name = input_item.get("account")
            account_details = get_account_details(logger, session_key, account_name)

            apigee_username = account_details.get("apigee_username")
            apigee_password = account_details.get("apigee_password")

            # Optional: prefer file paths over raw PEM (AppInspect friendlier)
            apigee_ssl_client_cert_path = account_details.get("apigee_ssl_client_cert_path")
            apigee_ssl_key_path = account_details.get("apigee_ssl_key_path")

            # Backward-compat if you previously stored PEMs:
            apigee_ssl_client_cert_pem = account_details.get("apigee_ssl_client_cert")
            apigee_ssl_key_pem = account_details.get("apigee_ssl_key")

            apigee_url_endpoint = input_item.get("apigee_url")
            start_from = input_item.get("start_from")
            interval = input_item.get("interval")  # seconds as string
            sourcetype = input_item.get("sourcetype") or "apigee:audit"

            # --- Settings: SSL validation toggle (default True) ---
            cm = conf_manager.ConfManager(session_key, ADDON_NAME)
            settings_conf = cm.get_conf("splunk_ta_apigee_settings")
            # Expect a stanza like [general] validate_ssl = true/false
            settings = {}
            try:
                settings = settings_conf.get("general")
            except Exception:
                logger.debug("No [general] stanza in splunk_ta_apigee_settings; using defaults.")

            validate_ssl = str(settings.get("validate_ssl", "true")).lower() != "false"

            # --- Auth, proxy ---
            auth = HTTPBasicAuth(str(apigee_username), str(apigee_password)) if apigee_username and apigee_password else None
            proxy_settings = get_proxy_settings(logger, session_key)

            # --- Time window ---
            api_start_time = get_start_time_ms(start_from)
            # Use now for end time; do not subtract interval (that mixes units)
            api_end_time = now_ms()

            # Optional: if you want to use interval to narrow window from now:
            # if interval:
            #     try:
                #         window_ms = int(float(interval)) * 1000
                #         api_start_time = max(api_start_time, api_end_time - window_ms)
            #     except Exception:
            #         logger.warning("Invalid interval value; ignoring for window calculation.")

            # --- Fetch data ---
            data = get_data_from_api(
                logger=logger,
                account_name=account_name,
                apigee_url_endpoint=apigee_url_endpoint,
                auth=auth,
                api_start_time_ms=api_start_time,
                api_end_time_ms=api_end_time,
