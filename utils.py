import os
import sys
import logging
import requests
import validators

from os import path as op
from typing import Dict, Any, Optional

from solnlib import conf_manager, log, utils as soln_utils
from solnlib.modular_input import checkpointer
from splunktaucclib.rest_handler.admin_external import AdminExternalValidator

# App / Add-on metadata
APP_NAME = os.path.basename(os.path.dirname(os.path.dirname(__file__)))
ADDON_NAME = "Splunk_TA_github"
CHECKPOINTER = "Splunk_TA_github_checkpointer"

# Logger setup
_LOGGER = log.Logs().get_logger(ADDON_NAME)


def get_log_level() -> str:
    """Get Splunk root log level, fallback to DEBUG."""
    try:
        return log.get_level(log.Logs().get_logger("splunk"))
    except Exception as e:
        _LOGGER.warning("Failed to get root log level, defaulting to DEBUG: %s", e)
        return "DEBUG"


def get_account_details(session_key: str, account_name: str) -> Dict[str, Any]:
    """Fetch account details securely from Splunk conf manager."""
    realm = f"{ADDON_NAME}_account"
    try:
        cfm = conf_manager.ConfManager(
            session_key,
            APP_NAME,
            realm=realm
        )
        conf = cfm.get_conf(f"{ADDON_NAME}_account", decrypt=True)
        if account_name not in conf:
            raise ValueError(f"Account '{account_name}' not found")
        return dict(conf[account_name].items())
    except Exception as e:
        _LOGGER.exception("Failed to retrieve account details: %s", e)
        raise


def get_proxy_settings(session_key: str) -> Dict[str, Any]:
    """Retrieve Splunk proxy settings securely."""
    try:
        cfm = conf_manager.ConfManager(
            session_key,
            APP_NAME,
            realm=f"{ADDON_NAME}_settings"
        )
        conf = cfm.get_conf("settings", decrypt=True)
        proxy_conf = conf.get("proxy", {})
        return dict(proxy_conf)
    except Exception as e:
        _LOGGER.exception("Failed to fetch proxy settings: %s", e)
        raise RuntimeError("Could not fetch proxy configuration") from e


def mask_secret(secret: Optional[str]) -> str:
    """Mask sensitive values for logging."""
    if not secret:
        return ""
    return secret[:4] + "****" + secret[-2:]


def checkpoint_handler(check_point_key: str, check_point_value: Any, session_key: str) -> None:
    """Store checkpoint in KVStore safely."""
    try:
        _LOGGER.debug("Updating checkpoint key=%s, value(masked)=%s",
                      check_point_key, mask_secret(str(check_point_value)))
        kv_checkpointer = checkpointer.KVStoreCheckpointer(CHECKPOINTER, session_key)
        kv_checkpointer.update(check_point_key, check_point_value)
    except Exception as e:
        _LOGGER.exception("Error while updating checkpoint: %s", e)


class ValidateBaseInput(AdminExternalValidator):
    """Base validator for modular input configs."""

    def _validate_api(self, url: str, headers: Dict[str, str], error_msg: str) -> None:
        try:
            resp = requests.get(url, headers=headers, timeout=30, verify=True)
            if resp.status_code != 200:
                try:
                    msg = resp.json().get("message", str(resp.text))
                except Exception:
                    msg = resp.text
                self.put_msg(f"{error_msg}: {msg}")
                self.put_msg(f"HTTP {resp.status_code}: {resp.reason}")
        except Exception as e:
            self.put_msg(f"Validation failed: {str(e)}")

    def validate(self, name: str, value: Any, data: Dict[str, Any]) -> None:
        raise NotImplementedError("Subclasses must implement validate()")


class ValidateAuditInput(ValidateBaseInput):
    """Validator for audit inputs."""

    def validate(self, name, value, data):
        org = data.get("org") or data.get("enterprise")
        token = data.get("token")
        if not org or not token:
            self.put_msg("Missing required fields: org/enterprise or token")
            return

        url = f"https://api.github.com/orgs/{org}/audit-log"
        headers = {"Authorization": f"Bearer {token}"}
        self._validate_api(url, headers, "Audit input validation failed")


class ValidateUserInput(ValidateBaseInput):
    """Validator for user inputs."""

    def validate(self, name, value, data):
        org = data.get("org") or data.get("enterprise")
        token = data.get("token")
        if not org or not token:
            self.put_msg("Missing required fields: org/enterprise or token")
            return

        url = f"https://api.github.com/orgs/{org}/members"
        headers = {"Authorization": f"Bearer {token}"}
        self._validate_api(url, headers, "User input validation failed")
