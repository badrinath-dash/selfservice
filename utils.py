#
# SPDX-FileCopyrightText: 2024 Splunk, Inc.
# SPDX-License-Identifier: LicenseRef-Splunk-8-2021
#
#

"""
This module has utility functions for fectching account details, checkpointing,
writng events to splunk, setting loggers, input validations etc.
"""
import json
import os  # noqa: F401
import os.path as op
import sys
import traceback

import requests

# isort: off
import splunk.admin as admin
import import_declare_test  # noqa: F401
from solnlib import conf_manager, log
from solnlib.modular_input import checkpointer
from splunklib import modularinput as smi
import datetime
from solnlib import log

APP_NAME = __file__.split(op.sep)[-3]

_LOGGER = log.Logs().get_logger("Splunk_TA_Apigee_utils")
ADDON_NAME = "Splunk_TA_Apigee"
CHECKPOINTER = "splunk_ta_apigee_checkpointer"


def get_log_level(session_key):
    """
    This function returns the log level for the addon from configuration file
    :return: The log level configured for the addon
    """

    try:
        cfm = conf_manager.ConfManager(
            session_key,
            APP_NAME,
            realm="__REST_CREDENTIAL__#{}#configs/conf-splunk_ta_apigee_settings".format(
                APP_NAME
            ),
        )
        conf = cfm.get_conf("splunk_ta_apigee_settings")
        logging_details = conf.get("logging")
        return logging_details["loglevel"]
    except Exception as e:
        return "DEBUG"


def set_logger(session_key, filename):
    """
    This function sets up a logger with configured log level.
    :param filename: Name of the log file
    :return logger: logger object
    """

    log_level = get_log_level(session_key)
    logger = log.Logs().get_logger(filename)
    logger.setLevel(log_level)
    return logger


def get_proxy_settings(logger, session_key):
    """
    This function reads proxy settings if any, otherwise returns None
    :param session_key: Session key for the particular modular input
    :return: A dictionary proxy having settings
    """

    try:
        settings_cfm = conf_manager.ConfManager(
            session_key,
            APP_NAME,
            realm="__REST_CREDENTIAL__#{}#configs/splunk_ta_apigee_settings".format(
                APP_NAME
            ),
        )
        splunk_ta_apigee_settings_conf = settings_cfm.get_conf(
            "splunk_ta_apigee_settings"
        ).get_all()

        proxy_settings = None
        proxy_stanza = {}
        for key, value in splunk_ta_apigee_settings_conf["proxy"].items():
            proxy_stanza[key] = value

        if int(proxy_stanza.get("proxy_enabled", 0)) == 0:
            logger.info("Proxy is disabled. Returning None")
            return proxy_settings
        proxy_port = proxy_stanza.get("proxy_port")
        proxy_url = proxy_stanza.get("proxy_url")
        proxy_type = proxy_stanza.get("proxy_type")
        proxy_username = proxy_stanza.get("proxy_username", "")
        proxy_password = proxy_stanza.get("proxy_password", "")

        if proxy_type == "socks5":
            proxy_type += "h"
        if proxy_username and proxy_password:
            proxy_username = requests.compat.quote_plus(proxy_username)
            proxy_password = requests.compat.quote_plus(proxy_password)
            proxy_uri = "%s://%s:%s@%s:%s" % (
                proxy_type,
                proxy_username,
                proxy_password,
                proxy_url,
                proxy_port,
            )
        else:
            proxy_uri = "%s://%s:%s" % (proxy_type, proxy_url, proxy_port)

        proxy_settings = {"http": proxy_uri, "https": proxy_uri}
        logger.info("Successfully fetched configured proxy details.")
        return proxy_settings

    except Exception as e:
        log.log_configuration_error(
            logger,
            e,
            full_msg=False,
            msg_before="Failed to fetch proxy details from configuration",
        )
        sys.exit(1)



def get_account_details(logger, session_key, account_name):
    """
    Retrieves account details from the Splunk add-on configuration.

    Args:
        logger (Logger): Logger instance.
        session_key (str): Splunk session key.
        account_name (str): Name of the configured account.

    Returns:
        dict: Dictionary containing relevant account credentials.
    """
    realm = f"{ADDON_NAME}_account"
    try:
        cfm = conf_manager.ConfManager(
            session_key,
            APP_NAME,
            realm=f"__REST_CREDENTIAL__#{APP_NAME}#configs/conf-splunk_ta_apigee_account"
        )
        account_conf_file = cfm.get_conf("splunk_ta_apigee_account")
        logger.debug(f"Fetching account details for: {account_name}")

        account_data = account_conf_file.get(account_name)
        if not account_data:
            raise KeyError(f"Account '{account_name}' not found.")

        auth_type = account_data.get("auth_type", "basic").lower()

        if auth_type == "basic":
            return {
                "auth_type": "basic",
                "apigee_username": account_data.get("apigee_username"),
                "apigee_password": account_data.get("apigee_password"),
                "apigee_ssl_client_cert": account_data.get("apigee_ssl_client_cert"),
                "apigee_ssl_key": account_data.get("apigee_ssl_key")
            }
        elif auth_type == "oauth":
            return {
                "auth_type": "oauth",
                "client_id": account_data.get("client_id"),
                "client_secret": account_data.get("client_secret"),
                "apigee_ssl_client_cert": account_data.get("apigee_ssl_client_cert"),
                "apigee_ssl_key": account_data.get("apigee_ssl_key")
            }
        else:
            raise ValueError(f"Unsupported auth_type: {auth_type}")

    except Exception as e:
        log.log_configuration_error(
            logger,
            e,
            full_msg=False,
            msg_before=f"Failed to fetch account details for account: {account_name}"
        )
        sys.exit("Error while fetching account details. Terminating modular input.")


def checkpoint_handler(check_point_key: str, check_point_value: Any, session_key: str) -> None:
    """Store checkpoint in KVStore safely."""
    try:
        _LOGGER.debug("Updating checkpoint key=%s, value=%s",
                      check_point_key, str(check_point_value))
        kv_checkpointer = checkpointer.KVStoreCheckpointer(CHECKPOINTER, session_key)
        kv_checkpointer.update(check_point_key, check_point_value)
    except Exception as e:
        _LOGGER.exception("Error while updating checkpoint: %s", e)
