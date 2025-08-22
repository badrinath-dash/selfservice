# -*- coding: utf-8 -*-
"""
Apigee Audit Modular Input with checkpointing and validation.

Reads input + account settings via solnlib ConfManager, supports proxy, MASSL
client certs, and KVStore checkpointing based on event timestamps.
"""
from __future__ import annotations

import json
import logging
import time
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from requests.auth import HTTPBasicAuth

from solnlib import conf_manager, log
from splunklib import modularinput as smi

from Splunk_TA_Apigee_utils import (
    ADDON_NAME,
    build_cert_files,
    cleanup_temp_files,
    default_start_ms,
    extract_timestamp_from_event,
    get_account_details,
    get_checkpoint_manager,
    get_last_checkpoint_time,
    get_proxy_settings,
    http_get_with_retry,
    now_ms,
    set_logger,
    to_epoch_ms_from_datestr,
    update_checkpoint,
    validate_start_date,
)


# ------------------------- Local helpers -------------------------

def logger_for_input(input_name: str) -> logging.Logger:
    return log.Logs().get_logger(f"{ADDON_NAME.lower()}_{input_name}")


def _parse_timestamp_fields(fields_str: str) -> List[str]:
    fields = [f.strip() for f in (fields_str or "").split(",")]
    return [f for f in fields if f]


def _load_settings_conf(session_key: str, logger: logging.Logger) -> Dict[str, Any]:
    cm = conf_manager.ConfManager(session_key, ADDON_NAME)
    try:
        conf = cm.get_conf("splunk_ta_apigee_settings")
    except Exception:
        logger.debug("settings conf not found; using defaults")
        return {}

    try:
        return dict(conf.get("general"))
    except Exception:
        return {}


# ------------------------- Validation -------------------------

def validate_input_config(input_item: Dict[str, Any], logger: logging.Logger) -> None:
    name = input_item.get("name", "unknown")

    # Required fields aligned with ucc.json
    required_fields = {
        "account": "Account to use",
        "apigee_url": "Apigee Base Endpoint",
        "apigee_org_name": "Apigee Organization Name",
        "timestamp_fields": "TimeStamp Field",
        "api_params": "API Parameter",
        "audit_resource_uri": "Audit EndPoint",
    }
    for key, label in required_fields.items():
        if not input_item.get(key):
            raise ValueError(f"Input '{name}': Required field '{label}' ({key}) is missing or empty")

    # Optional: start_from
    start_from = input_item.get("start_from")
    if start_from:
        validate_start_date(start_from, logger)

    # Interval (10..3601 per UCC)
    interval = input_item.get("interval")
    if interval is not None:
        try:
            ival = int(interval)
        except Exception:
            raise ValueError(f"Input '{name}': interval must be an integer")
        if ival < 10 or ival > 3601:
            raise ValueError(f"Input '{name}': interval must be between 10 and 3601 seconds")
        if ival < 60:
            logger.warning("Input '%s': very short interval (%s)s", name, ival)

    # URL must be https
    apigee_url = (input_item.get("apigee_url") or "").strip()
    if not apigee_url.startswith("https://"):
        raise ValueError(f"Input '{name}': Apigee Base Endpoint must use HTTPS, got: {apigee_url}")

    # timestamp_fields content sanity
    bad_fields: List[str] = []
    for f in _parse_timestamp_fields(input_item.get("timestamp_fields", "")):
        if not all(c.isalnum() or c in "._-" for c in f):
            bad_fields.append(f)
    if bad_fields:
        raise ValueError(
            f"Input '{name}': Invalid characters in TimeStamp Field(s): {bad_fields}. "
            "Allowed: letters, numbers, dot, underscore, hyphen."
        )

    # api_params must be JSON object
    api_params_str = (input_item.get("api_params") or "").strip()
    try:
        parsed = json.loads(api_params_str)
        if not isinstance(parsed, dict):
            raise ValueError("API Parameter must be a JSON object (dictionary)")
        if "limit" in parsed:
            try:
                limit_val = int(parsed["limit"])
                if limit_val <= 0 or limit_val > 10000:
                    raise ValueError("API 'limit' should be between 1 and 10000")
            except Exception:
                raise ValueError("API 'limit' must be an integer")
    except json.JSONDecodeError as e:
        raise ValueError(f"Input '{name}': API Parameter must be valid JSON. Error: {e}")


# ------------------------- Modular input validate -------------------------

def validate_input(definition: smi.ValidationDefinition):
    """Validate the input stanza before saving in SPLUNK Web."""
    params = definition.parameters
    interval = int(params.get("interval",300))
    if interval <10 or interval > 3600:
        raise ValueError("Interval must be between 10 and 3600 seconds.")
    
    url = params.get("apigee_url")
    if not url or not url.startswith("https://"):
        raise ValueError("apigee_url must be a validhttps:// endpoint.")
    return


# ------------------------- API call -------------------------
def build_apigee_audit_url(base_url: str, org: str, audit_path: str) -> str:
    """
    Constructs the full Apigee API URL.

    Args:
        base_url (str): Base endpoint, e.g., https://api.enterprise.apigee.com/v1
        organization (str): Apigee organization name
        resource_uri (str): Audit resource URI, e.g., /developers

    Returns:
        str: Full URL to call the Apigee API
    """
    base = base_url.rstrip("/")
    path = audit_path.lstrip("/") if audit_path and audit_path != "/" else ""
    if path:
        return f"{base}/audits/organizations/{org}/{path}"
    return f"{base}/audits/organizations/{org}/"





def get_data_from_api(
    logger: logging.Logger,
    account_name: str,
    apigee_url_endpoint: str,
    auth: Optional[HTTPBasicAuth],
    api_start_time_ms: int,
    api_end_time_ms: int,
    proxy_settings: Optional[Dict[str, str]],
    validate_ssl: bool,
    api_params: Dict[str, Any],
    apigee_ssl_client_cert_pem: Optional[str] = None,
    apigee_ssl_key_pem: Optional[str] = None,
    apigee_ssl_client_cert_path: Optional[str] = None,
    apigee_ssl_key_path: Optional[str] = None,
) -> Any:
    logger.info("Calling Apigee API endpoint: %s", apigee_url_endpoint)

    cert_tuple, temps = build_cert_files(
        logger=logger,
        account_name=account_name,
        client_cert_pem=apigee_ssl_client_cert_pem,
        client_key_pem=apigee_ssl_key_pem,
        client_cert_path=apigee_ssl_client_cert_path,
        client_key_path=apigee_ssl_key_path,
    )

    params = {
        "startTime": str(api_start_time_ms),
        "endTime": str(api_end_time_ms),
        **api_params,
    }

    logger.info("Calling Apigee API endpoint with params: %s", params)

    headers = {"Accept": "application/json"}

    try:
        response = http_get_with_retry(
            logger=logger,
            url=apigee_url_endpoint,
            params=params,
            headers=headers,
            auth=auth,
            proxies=proxy_settings,
            cert=cert_tuple,
            verify_ssl=validate_ssl,
        )
        logger.info("response  code from the APIGEE API is : %s", response.status_code)
        logger.debug("Actual response from the APIGEE API is : %s", response.json())
        return response.json()
       
    finally:
        cleanup_temp_files(logger, temps)


# ------------------------- Event processing -------------------------

def process_events_with_checkpoint(
    events: List[Dict[str, Any]],
    event_writer: smi.EventWriter,
    input_item: Dict[str, Any],
    sourcetype: str,
    timestamp_fields: List[str],
    ckpt_mgr,
    input_key: str,
    logger: logging.Logger,
) -> int:
    processed = 0
    latest_ts: Optional[int] = None

    with_ts: List[Tuple[Dict[str, Any], int]] = []
    without_ts: List[Dict[str, Any]] = []

    for ev in events:
        audit_records = ev.get("auditRecord", [])
        logger.debug("audit_records is : %s", audit_records)
        for record in audit_records:
            ts = extract_timestamp_from_event(record, timestamp_fields, logger)
            if ts:
                logger.debug("ts is : %s", ts)
                with_ts.append((record, ts))
            else:
                logger.debug("ts is : %s", ts)
                without_ts.append(record)

    with_ts.sort(key=lambda x: x[1])

    for ev, ts in with_ts:
        try:
            event_writer.write_event(
                smi.Event(
                    data=json.dumps(ev, ensure_ascii=False, default=str),
                    index=input_item.get("index"),
                    sourcetype=sourcetype,
                    time=ts // 1000,
                )
            )
            processed += 1
            latest_ts = ts
            if processed % 100 == 0:
                update_checkpoint(ckpt_mgr, input_key, latest_ts, processed, logger)
        except Exception as ex:
            logger.error("Failed to write event: %s", ex)

    fallback_now = now_ms()
    for ev in without_ts:
        try:
            event_writer.write_event(
                smi.Event(
                    data=json.dumps(ev, ensure_ascii=False, default=str),
                    index=input_item.get("index"),
                    sourcetype=sourcetype,
                )
            )
            processed += 1
            if latest_ts is None:
                latest_ts = fallback_now
        except Exception as ex:
            logger.error("Failed to write event: %s", ex)

    if latest_ts:
        update_checkpoint(ckpt_mgr, input_key, latest_ts, processed, logger)

    return processed


# ------------------------- stream_events -------------------------

def stream_events(inputs: smi.InputDefinition, event_writer: smi.EventWriter):
    for input_name, input_item in inputs.inputs.items():
        norm_name = input_name.split("/")[-1]
        logger = logger_for_input(norm_name)
        ckpt_mgr = None

        try:
            session_key = inputs.metadata["session_key"]

            # log level
            log_level = conf_manager.get_log_level(
                logger=logger,
                session_key=session_key,
                app_name=ADDON_NAME,
                conf_name="splunk_ta_apigee_settings",
            )
            logger.setLevel(log_level)

            log.modular_input_start(logger, norm_name)

            # checkpoint
            ckpt_mgr = get_checkpoint_manager(session_key)

            # account
            account_name = input_item.get("account")
            acct = get_account_details(logger, session_key, account_name)
            apigee_username = acct.get("apigee_username")
            apigee_password = acct.get("apigee_password")
            apigee_ssl_client_cert_path = acct.get("apigee_ssl_client_cert_path")
            apigee_ssl_key_path = acct.get("apigee_ssl_key_path")
            apigee_ssl_client_cert_pem = acct.get("apigee_ssl_client_cert")
            apigee_ssl_key_pem = acct.get("apigee_ssl_key")

            # input config
            apigee_url_base = input_item.get("apigee_url")
            apigee_org_name = input_item.get("apigee_org_name")
            audit_resource_uri = input_item.get("audit_resource_uri", "/")
            start_from = input_item.get("start_from")
            sourcetype = input_item.get("sourcetype") or "apigee:audit"

            # validate
            validate_input_config(input_item, logger)

            # timestamp fields
            timestamp_fields = _parse_timestamp_fields(
                input_item.get("timestamp_fields", "timeStamp")
            )

            # api params
            api_params_raw = input_item.get("api_params", '{"rows":"1000","expand":"true"}')
            try:
                api_params = json.loads(api_params_raw.replace("'", '"'))
            except json.JSONDecodeError:
                logger.warning("Invalid JSON in API Parameter: %s; using defaults", api_params_raw)
                api_params = {"limit": "1000", "sortOrder": "asc"}

            # settings
            settings = _load_settings_conf(session_key, logger)
            validate_ssl = str(settings.get("validate_ssl", "true")).lower() != "false"

            # auth + proxy
            auth = (
                HTTPBasicAuth(str(apigee_username), str(apigee_password))
                if apigee_username and apigee_password
                else None
            )
            proxies = get_proxy_settings(logger, session_key)

            # time window
            default_start = (
                to_epoch_ms_from_datestr(start_from) if start_from else default_start_ms(7)
            )
            ck_start = get_last_checkpoint_time(ckpt_mgr, norm_name, default_start, logger)
            api_start_time = max(ck_start, default_start)
            api_end_time = now_ms()
            logger.info(
                "Fetching data from %s to %s",
                datetime.fromtimestamp(api_start_time / 1000),
                datetime.fromtimestamp(api_end_time / 1000),
            )

            # endpoint
            full_url = build_apigee_audit_url(apigee_url_base, apigee_org_name, audit_resource_uri)
            logger.info("Complete Apigee URL that will be queried without param is: %s", full_url)

            # call
            data = get_data_from_api(
                logger=logger,
                account_name=account_name,
                apigee_url_endpoint=full_url,
                auth=auth,
                api_start_time_ms=api_start_time,
                api_end_time_ms=api_end_time,
                proxy_settings=proxies,
                validate_ssl=validate_ssl,
                api_params=api_params,
                apigee_ssl_client_cert_pem=apigee_ssl_client_cert_pem,
                apigee_ssl_key_pem=apigee_ssl_key_pem,
                apigee_ssl_client_cert_path=apigee_ssl_client_cert_path,
                apigee_ssl_key_path=apigee_ssl_key_path,
            )


            logger.debug("data is: %s", data)
            events = data if isinstance(data, list) else [data]
            count = process_events_with_checkpoint(
                    events=events,
                    event_writer=event_writer,
                    input_item=input_item,
                    sourcetype=sourcetype,
                    timestamp_fields=timestamp_fields,
                    ckpt_mgr=ckpt_mgr,
                    input_key=norm_name,
                    logger=logger,
            )

            log.events_ingested(
                    logger,
                    input_name,
                    sourcetype,
                    count,
                    input_item.get("index"),
                    account=input_item.get("account"),
            )
            log.modular_input_end(logger, norm_name)

        except Exception as e:
            log.log_exception(
                logger,
                e,
                "apigee_ingest_error",
                msg_before=f"Exception while ingesting data for input={norm_name}: ",
            )
