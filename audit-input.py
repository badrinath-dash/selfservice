# -*- coding: utf-8 -*-
"""
Apigee Audit Modular Input with Checkpointing Support

Enhanced version with:
- Checkpoint management based on JSON response timestamps
- Configurable checkpoint field extraction
- Robust error handling for checkpoint operations
- Fallback mechanisms for missing timestamp fields
"""

import json
import logging
import os
import time
import tempfile
from typing import Optional, Tuple, Dict, Any, List, Union
from datetime import datetime

import requests
from requests.auth import HTTPBasicAuth
from requests import Response

from solnlib import conf_manager, log
from solnlib.modular_input import checkpointer
from splunklib import modularinput as smi

from Splunk_TA_Apigee_utils import (
    get_account_details,
    get_proxy_settings,
    set_logger,
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
    """
    temp_files_to_cleanup = []

    if client_cert_path and client_key_path:
        if os.path.isfile(client_cert_path) and os.path.isfile(client_key_path):
            logger.debug("Using configured client cert/key file paths.")
            return (client_cert_path, client_key_path), temp_files_to_cleanup
        logger.warning(
            "Configured client cert/key paths not found: %s, %s",
            client_cert_path,
            client_key_path,
        )

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
    if last_exc:
        raise last_exc
    raise RuntimeError("HTTP GET failed with unknown error")


def extract_timestamp_from_event(
    event: Dict[str, Any],
    timestamp_fields: List[str],
    logger: logging.Logger
) -> Optional[int]:
    """
    Extract timestamp from event JSON based on configured field paths.
    
    Args:
        event: JSON event object
        timestamp_fields: List of field paths to check (e.g., ['timestamp', 'timeStamp', 'created'])
        logger: Logger instance
    
    Returns:
        Timestamp in milliseconds since epoch, or None if not found
    """
    for field_path in timestamp_fields:
        try:
            # Support nested fields with dot notation (e.g., 'metadata.timestamp')
            value = event
            for field_part in field_path.split('.'):
                value = value.get(field_part)
                if value is None:
                    break
            
            if value is not None:
                # Handle different timestamp formats
                if isinstance(value, (int, float)):
                    # Assume milliseconds if > year 2000 in seconds
                    if value > 946684800000:  # Year 2000 in ms
                        return int(value)
                    else:
                        return int(value * 1000)  # Convert seconds to ms
                
                elif isinstance(value, str):
                    # Try to parse string timestamps
                    try:
                        # ISO format with timezone
                        if 'T' in value and ('Z' in value or '+' in value or value.endswith('00')):
                            dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
                            return int(dt.timestamp() * 1000)
                        
                        # Try epoch string
                        timestamp_val = float(value)
                        if timestamp_val > 946684800000:
                            return int(timestamp_val)
                        else:
                            return int(timestamp_val * 1000)
                            
                    except (ValueError, TypeError):
                        # Try standard date formats
                        for fmt in [
                            "%Y-%m-%dT%H:%M:%S.%fZ",
                            "%Y-%m-%dT%H:%M:%SZ", 
                            "%Y-%m-%dT%H:%M:%S",
                            "%Y-%m-%d %H:%M:%S",
                            "%Y-%m-%d"
                        ]:
                            try:
                                dt = datetime.strptime(value, fmt)
                                return int(dt.timestamp() * 1000)
                            except ValueError:
                                continue
                
                logger.debug(f"Found timestamp field '{field_path}' but couldn't parse value: {value}")
                
        except Exception as ex:
            logger.debug(f"Error extracting timestamp from field '{field_path}': {ex}")
    
    return None


def get_checkpoint_manager(session_key: str, input_name: str) -> checkpointer.CheckpointerInterface:
    """Initialize and return checkpoint manager."""
    return checkpointer.KVStoreCheckpointer(
        collection_name="apigee_audit_checkpoints",
        session_key=session_key,
        app=ADDON_NAME
    )


def get_last_checkpoint_time(
    ckpt_mgr: checkpointer.CheckpointerInterface,
    input_name: str,
    default_start_time: int,
    logger: logging.Logger
) -> int:
    """
    Get the last checkpoint time for this input.
    
    Returns:
        Last checkpoint time in milliseconds, or default_start_time if no checkpoint exists
    """
    try:
        checkpoint_data = ckpt_mgr.get(input_name)
        if checkpoint_data and isinstance(checkpoint_data, dict):
            last_time = checkpoint_data.get("last_event_time")
            if last_time:
                logger.info(f"Resuming from checkpoint: {last_time} ({datetime.fromtimestamp(last_time/1000)})")
                return int(last_time)
    except Exception as ex:
        logger.warning(f"Failed to read checkpoint: {ex}")
    
    logger.info(f"No valid checkpoint found, starting from: {default_start_time}")
    return default_start_time


def update_checkpoint(
    ckpt_mgr: checkpointer.CheckpointerInterface,
    input_name: str,
    last_event_time: int,
    events_processed: int,
    logger: logging.Logger
) -> None:
    """Update checkpoint with latest processed event time."""
    try:
        checkpoint_data = {
            "last_event_time": last_event_time,
            "events_processed": events_processed,
            "last_updated": now_ms(),
            "last_updated_human": datetime.fromtimestamp(time.time()).isoformat()
        }
        ckpt_mgr.update(input_name, checkpoint_data)
        logger.debug(f"Checkpoint updated: last_event_time={last_event_time}")
    except Exception as ex:
        logger.error(f"Failed to update checkpoint: {ex}")


def get_data_from_api(
    logger: logging.Logger,
    account_name: str,
    apigee_url_endpoint: str,
    auth: Optional[HTTPBasicAuth],
    api_start_time_ms: int,
    api_end_time_ms: int,
    proxy_settings: Optional[Dict[str, str]],
    validate_ssl: bool,
    api_params: Dict[str, str],
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

    # Merge time parameters with custom API parameters
    params = {
        "startTime": str(api_start_time_ms),
        "endTime": str(api_end_time_ms),
        **api_params  # Custom parameters override defaults
    }

    headers = {
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
        return response.json()
    finally:
        _cleanup_temp_files(logger, temps)


def process_events_with_checkpoint(
    events: List[Dict[str, Any]],
    event_writer: smi.EventWriter,
    input_item: Dict[str, Any],
    sourcetype: str,
    timestamp_fields: List[str],
    ckpt_mgr: checkpointer.CheckpointerInterface,
    input_name: str,
    logger: logging.Logger
) -> int:
    """
    Process events and update checkpoint based on event timestamps.
    
    Returns:
        Number of events processed
    """
    events_processed = 0
    latest_event_time = None
    
    # Sort events by timestamp if possible for better checkpointing
    events_with_timestamps = []
    events_without_timestamps = []
    
    for event in events:
        event_timestamp = extract_timestamp_from_event(event, timestamp_fields, logger)
        if event_timestamp:
            events_with_timestamps.append((event, event_timestamp))
        else:
            events_without_timestamps.append(event)
    
    # Sort events with timestamps
    events_with_timestamps.sort(key=lambda x: x[1])
    
    # Process events with timestamps first
    for event, event_timestamp in events_with_timestamps:
        try:
            event_writer.write_event(
                smi.Event(
                    data=json.dumps(event, ensure_ascii=False, default=str),
                    index=input_item.get("index"),
                    sourcetype=sourcetype,
                    time=event_timestamp // 1000  # Splunk expects seconds
                )
            )
            events_processed += 1
            latest_event_time = event_timestamp
            
            # Update checkpoint every 100 events to avoid too frequent updates
            if events_processed % 100 == 0:
                update_checkpoint(ckpt_mgr, input_name, latest_event_time, events_processed, logger)
                
        except Exception as ex:
            logger.error(f"Failed to write event: {ex}")
    
    # Process events without timestamps
    current_time = now_ms()
    for event in events_without_timestamps:
        try:
            event_writer.write_event(
                smi.Event(
                    data=json.dumps(event, ensure_ascii=False, default=str),
                    index=input_item.get("index"),
                    sourcetype=sourcetype,
                )
            )
            events_processed += 1
            # Use current time as fallback for events without timestamps
            if not latest_event_time:
                latest_event_time = current_time
                
        except Exception as ex:
            logger.error(f"Failed to write event: {ex}")
    
    # Final checkpoint update
    if latest_event_time:
        update_checkpoint(ckpt_mgr, input_name, latest_event_time, events_processed, logger)
    
    return events_processed


def validate_start_date(start_from: str, logger: logging.Logger) -> bool:
    """
    Validate start_from date to ensure it's not in the future and is properly formatted.
    
    Args:
        start_from: Date string to validate
        logger: Logger instance for warnings
        
    Returns:
        True if valid, False if invalid
        
    Raises:
        ValueError: With descriptive message if validation fails
    """
    if not start_from or not start_from.strip():
        return True  # Empty/None is valid (will use default)
    
    start_from = start_from.strip()
    current_time = time.time()
    
    try:
        # Parse the date string
        parsed_time_ms = _to_epoch_ms_from_datestr(start_from)
        parsed_time_sec = parsed_time_ms / 1000
        
        # Check if date is in the future (with 1 minute tolerance for clock skew)
        tolerance_sec = 60  # 1 minute
        if parsed_time_sec > (current_time + tolerance_sec):
            future_date = datetime.fromtimestamp(parsed_time_sec).strftime("%Y-%m-%d %H:%M:%S")
            current_date = datetime.fromtimestamp(current_time).strftime("%Y-%m-%d %H:%M:%S")
            raise ValueError(
                f"start_from date '{start_from}' ({future_date}) cannot be in the future. "
                f"Current time: {current_date}"
            )
        
        # Check if date is too far in the past (optional - prevents accidental large data pulls)
        max_days_back = 365 * 2  # 2 years
        earliest_allowed = current_time - (max_days_back * 24 * 3600)
        if parsed_time_sec < earliest_allowed:
            earliest_date = datetime.fromtimestamp(earliest_allowed).strftime("%Y-%m-%d")
            raise ValueError(
                f"start_from date '{start_from}' is too far in the past. "
                f"Maximum allowed: {max_days_back} days back ({earliest_date})"
            )
        
        logger.debug(f"start_from validation passed: {start_from} -> {datetime.fromtimestamp(parsed_time_sec)}")
        return True
        
    except ValueError as e:
        # Re-raise validation errors with more context
        if "start_from date" in str(e):
            raise e
        else:
            # This is a parsing error
            raise ValueError(
                f"Invalid date format for start_from: '{start_from}'. "
                f"Supported formats: YYYY-MM-DD, YYYY-MM-DDTHH:MM:SS. "
                f"Examples: '2024-01-15', '2024-01-15T10:30:00'"
            )


def validate_input_config(input_item: Dict[str, Any], logger: logging.Logger) -> None:
    """
    Validate all input configuration parameters.
    
    Args:
        input_item: Input configuration dictionary
        logger: Logger instance
        
    Raises:
        ValueError: If any validation fails
    """
    input_name = input_item.get("name", "unknown")
    
    # Validate required fields
    required_fields = ["account", "apigee_url"]
    for field in required_fields:
        if not input_item.get(field):
            raise ValueError(f"Input '{input_name}': Required field '{field}' is missing or empty")
    
    # Validate start_from date
    start_from = input_item.get("start_from")
    if start_from:
        validate_start_date(start_from, logger)
    
    # Validate interval (should be positive integer)
    interval = input_item.get("interval")
    if interval:
        try:
            interval_int = int(interval)
            if interval_int <= 0:
                raise ValueError(f"Input '{input_name}': interval must be a positive integer, got: {interval}")
            if interval_int < 60:
                logger.warning(f"Input '{input_name}': interval '{interval}' seconds is very short, consider using 60+ seconds")
        except (ValueError, TypeError):
            raise ValueError(f"Input '{input_name}': interval must be a valid integer, got: {interval}")
    
    # Validate URL format
    apigee_url = input_item.get("apigee_url", "")
    if not apigee_url.startswith(("http://", "https://")):
        raise ValueError(f"Input '{input_name}': apigee_url must start with http:// or https://, got: {apigee_url}")
    
    # Validate timestamp_fields format
    timestamp_fields = input_item.get("timestamp_fields", "")
    if timestamp_fields:
        # Check for valid field names (no special characters except dots and underscores)
        fields = [f.strip() for f in timestamp_fields.split(",")]
        invalid_fields = []
        for field in fields:
            if not field:
                continue
            # Allow alphanumeric, dots, and underscores
            if not all(c.isalnum() or c in "._" for c in field):
                invalid_fields.append(field)
        
        if invalid_fields:
            raise ValueError(
                f"Input '{input_name}': Invalid characters in timestamp_fields. "
                f"Only letters, numbers, dots, and underscores allowed. "
                f"Invalid fields: {invalid_fields}"
            )
    
    # Validate api_params JSON format
    api_params = input_item.get("api_params", "{}")
    if api_params and api_params.strip():
        try:
            json.loads(api_params)
        except json.JSONDecodeError as e:
            raise ValueError(
                f"Input '{input_name}': api_params must be valid JSON. "
                f"Error: {e}. Got: {api_params}"
            )


def validate_input(definition: smi.ValidationDefinition):
    """
    Splunk modular input validation function.
    Called by Splunk before saving input configuration.
    """
    try:
        # Get the input configuration from the definition
        for input_name, params in definition.inputs.items():
            logger = logger_for_input(input_name.split("/")[-1])
            
            # Convert parameters to dictionary format
            input_dict = {param.name: param.value for param in params}
            input_dict["name"] = input_name
            
            # Validate the configuration
            validate_input_config(input_dict, logger)
            
            logger.info(f"Input validation passed for: {input_name}")
            
    except ValueError as e:
        # Splunk expects ValidationError to be raised
        raise ValueError(str(e))
    except Exception as e:
        # Catch any unexpected errors
        raise ValueError(f"Validation failed with unexpected error: {e}")


def stream_events(inputs: smi.InputDefinition, event_writer: smi.EventWriter):
    """
    Enhanced stream_events with checkpoint support.
    
    New configuration options:
    - timestamp_fields: Comma-separated list of JSON fields to use for timestamps
    - api_expand: Custom expand parameter (defaults to "true")
    - api_params: Additional API parameters as JSON string
    """
    for input_name, input_item in inputs.inputs.items():
        normalized_input_name = input_name.split("/")[-1]
        logger = logger_for_input(normalized_input_name)
        
        # Initialize checkpoint manager
        ckpt_mgr = None

        try:
            session_key = inputs.metadata["session_key"]

            # Set up logging
            log_level = conf_manager.get_log_level(
                logger=logger,
                session_key=session_key,
                app_name=ADDON_NAME,
                conf_name="splunk_ta_apigee_settings",
            )
            logger.setLevel(log_level)

            log.modular_input_start(logger, normalized_input_name)

            # Initialize checkpoint manager
            ckpt_mgr = get_checkpoint_manager(session_key, normalized_input_name)

            # Read input & account configuration
            account_name = input_item.get("account")
            account_details = get_account_details(logger, session_key, account_name)

            apigee_username = account_details.get("apigee_username")
            apigee_password = account_details.get("apigee_password")

            # Certificate configuration
            apigee_ssl_client_cert_path = account_details.get("apigee_ssl_client_cert_path")
            apigee_ssl_key_path = account_details.get("apigee_ssl_key_path")
            apigee_ssl_client_cert_pem = account_details.get("apigee_ssl_client_cert")
            apigee_ssl_key_pem = account_details.get("apigee_ssl_key")

            # Input configuration with validation
            apigee_url_endpoint = input_item.get("apigee_url")
            start_from = input_item.get("start_from")
            interval = input_item.get("interval")
            sourcetype = input_item.get("sourcetype") or "apigee:audit"

            # Validate input configuration
            try:
                validate_input_config(input_item, logger)
            except ValueError as ve:
                logger.error(f"Input configuration validation failed: {ve}")
                raise ve

            # NEW: Checkpoint configuration
            timestamp_fields_str = input_item.get("timestamp_fields", "timestamp,timeStamp,created,createdAt")
            timestamp_fields = [field.strip() for field in timestamp_fields_str.split(",")]
            
            # NEW: API parameter configuration
            api_expand = input_item.get("api_expand", "true")
            api_params_str = input_item.get("api_params", "{}")
            
            try:
                custom_api_params = json.loads(api_params_str)
            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON in api_params: {api_params_str}, using defaults")
                custom_api_params = {}
            
            # Build final API parameters
            api_params = {"expand": api_expand, **custom_api_params}

            # Settings configuration
            cm = conf_manager.ConfManager(session_key, ADDON_NAME)
            settings_conf = cm.get_conf("splunk_ta_apigee_settings")
            settings = {}
            try:
                settings = settings_conf.get("general")
            except Exception:
                logger.debug("No [general] stanza in splunk_ta_apigee_settings; using defaults.")

            validate_ssl = str(settings.get("validate_ssl", "true")).lower() != "false"

            # Authentication and proxy setup
            auth = HTTPBasicAuth(str(apigee_username), str(apigee_password)) if apigee_username and apigee_password else None
            proxy_settings = get_proxy_settings(logger, session_key)

            # Time window calculation with checkpoint support
            default_start_time = get_start_time_ms(start_from)
            checkpoint_start_time = get_last_checkpoint_time(
                ckpt_mgr, normalized_input_name, default_start_time, logger
            )
            
            # Use checkpoint time if it's more recent than configured start_from
            api_start_time = max(checkpoint_start_time, default_start_time)
            api_end_time = now_ms()

            logger.info(f"Fetching data from {datetime.fromtimestamp(api_start_time/1000)} to {datetime.fromtimestamp(api_end_time/1000)}")

            # Fetch data from API
            data = get_data_from_api(
                logger=logger,
                account_name=account_name,
                apigee_url_endpoint=apigee_url_endpoint,
                auth=auth,
                api_start_time_ms=api_start_time,
                api_end_time_ms=api_end_time,
                proxy_settings=proxy_settings,
                validate_ssl=validate_ssl,
                api_params=api_params,
                apigee_ssl_client_cert_pem=apigee_ssl_client_cert_pem,
                apigee_ssl_key_pem=apigee_ssl_key_pem,
                apigee_ssl_client_cert_path=apigee_ssl_client_cert_path,
                apigee_ssl_key_path=apigee_ssl_key_path,
            )

            # Process events with checkpoint management
            events = data if isinstance(data, list) else [data]
            
            events_count = process_events_with_checkpoint(
                events=events,
                event_writer=event_writer,
                input_item=input_item,
                sourcetype=sourcetype,
                timestamp_fields=timestamp_fields,
                ckpt_mgr=ckpt_mgr,
                input_name=normalized_input_name,
                logger=logger
            )

            log.events_ingested(
                logger,
                input_name,
                sourcetype,
                events_count,
                input_item.get("index"),
                account=input_item.get("account"),
            )

            log.modular_input_end(logger, normalized_input_name)

        except Exception as e:
            log.log_exception(
                logger,
                e,
                "apigee_ingest_error",
                msg_before=f"Exception while ingesting data for input={normalized_input_name}: ",
            )
