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
from splunktaucclib.rest_handler.endpoint.validator import Validator
from splunktaucclib.rest_handler.error import RestError
import datetime
import Splunk_TA_github_consts as constants
from Splunk_TA_github_consts import DATE_TIME_FORMAT
from solnlib import log

APP_NAME = __file__.split(op.sep)[-3]

_LOGGER = log.Logs().get_logger("Splunk_TA_github_utils")

CHECKPOINTER = "Splunk_TA_Apigee_checkpointer"


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
            realm="__REST_CREDENTIAL__#{}#configs/conf-splunk_ta_apigee_settings".format(
                APP_NAME
            ),
        )
        splunk_ta_github_settings_conf = settings_cfm.get_conf(
            "splunk_ta_apigee_settings"
        ).get_all()

        proxy_settings = None
        proxy_stanza = {}
        for key, value in splunk_ta_github_settings_conf["proxy"].items():
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
        logger (Logger): Logger instance for logging messages.
        session_key (str): Splunk session key.
        account_name (str): Name of the configured account.

    Returns:
        dict: Dictionary containing account details.

    Raises:
        SystemExit: If account details cannot be retrieved.
    """
    try:
        # Initialize ConfManager with the correct realm
        cfm = conf_manager.ConfManager(
            session_key,
            APP_NAME,
            realm=f"__REST_CREDENTIAL__#{APP_NAME}#configs/conf-splunk_ta_apigee_account"
        )

        # Retrieve the account configuration
        account_conf = cfm.get_conf("conf-splunk_ta_apigee_account")
        logger.debug(f"Fetching account details for: {account_name}")

        account_data = account_conf.get(account_name)
        if not account_data:
            raise KeyError(f"Account '{account_name}' not found in configuration.")

        # Extract all available fields (example: security_token, client_id, etc.)
        return {account_data.items()}

    except Exception as e:
        log.log_configuration_error(
            logger,
            e,
            full_msg=False,
            msg_before=f"Failed to fetch account details from conf-splunk_ta_apigee_account.conf for account: {account_name}"
        )
        sys.exit("Error while fetching account details. Terminating modular input.")



def write_event(logger, event_writer, raw_event, sourcetype, input_params):
    """
    This function ingests data into splunk
    :param event_writer: Event Writer object
    :param raw_event: Raw event to be ingested into splunk
    :param sourcetype: Sourcetype of the data
    :param input_params: Input parameters configured by user
    :param manager_url: URL which is getting used to fetch events
    :return: boolean value indicating if the event is successfully ingested
    """

    try:
        event = smi.Event(
            data=json.dumps(raw_event),
            sourcetype=sourcetype,
            source=input_params["name"].replace("://", ":")
            + ":"
            + input_params["account"],
            index=input_params["index"],
        )
        event_writer.write_event(event)
        return True
    except Exception as e:
        log.log_exception(
            logger,
            e,
            exc_label=constants.UCC_EXECPTION_EXE_LABEL,
            msg_before="Error writing event to Splunk",
        )
        return False



def is_valid_date_format(value):
    try:
        datetime.datetime.strptime(value, DATE_TIME_FORMAT)
        return True
    except ValueError:
        return False


def is_future_date(value):
    return value > datetime.datetime.utcnow().strftime(DATE_TIME_FORMAT)


class GetSessionKey(admin.MConfigHandler):
    def __init__(self):
        self.session_key = self.getSessionKey()


# jscpd:ignore-start
class ValidateAuditInput(Validator):
    """
    Check if the Organization/Enterprise name provided is correct or not.
    """

    def __init__(self, *args, **kwargs):
        super(ValidateAuditInput, self).__init__(*args, **kwargs)

    def validate(self, value, data):
        session_key = GetSessionKey().session_key
        account_details = get_account_details(_LOGGER, session_key, data.get("account"))
        proxy_settings = get_proxy_settings(_LOGGER, session_key)
        headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer {}".format(account_details["security_token"]),
        }
        if data.get("org_name"):
            try:
                api_url = "https://api.github.com/orgs/{}".format(str(value))
                resp = requests.get(
                    url=api_url, proxies=proxy_settings, headers=headers
                )
                if resp.status_code in (200, 201):
                    new_api_url = "https://api.github.com/orgs/{}/audit-log".format(
                        str(value)
                    )
                    _LOGGER.debug(
                        f"Validating Audit Log Input for Organization URL = {new_api_url}"
                    )
                    new_resp = requests.get(
                        url=new_api_url, proxies=proxy_settings, headers=headers
                    )
                    if new_resp.status_code in (200, 201):
                        return True
                    else:
                        log.log_exception(
                            _LOGGER,
                            Exception(
                                "ERROR [{}] while validating Audit Log Input for Organization. - Response = {}".format(
                                    new_resp.status_code, new_resp.json()
                                )
                            ),
                            exc_label=constants.UCC_EXECPTION_EXE_LABEL.format(
                                "ValidateAuditInput_ERROR"
                            ),
                        )
                        if new_resp.status_code in (403, 401):
                            self.put_msg(new_resp.json()["message"])
                        elif new_resp.status_code == 404:
                            self.put_msg(
                                "Provided organization does not have access to collect audit data."
                            )
                        else:
                            self.put_msg(
                                "Unable to configure the input. Check logs for more details."
                            )
                        return False
                else:
                    log.log_exception(
                        _LOGGER,
                        Exception(
                            "ERROR [{}] while validating Audit Log Input for Organization. - Response = {}".format(
                                resp.status_code, resp.json()
                            )
                        ),
                        exc_label=constants.UCC_EXECPTION_EXE_LABEL.format(
                            "ValidateAuditInput_ERROR"
                        ),
                    )
                    if resp.status_code in (403, 401):
                        self.put_msg(resp.json()["message"])
                    elif resp.status_code == 404:
                        self.put_msg("Invalid Organization Name")
                    else:
                        self.put_msg(
                            "Unable to configure the input. Check logs for more details."
                        )
                    return False
            except Exception as e:
                msg = "Could not connect to GitHub. Check configuration and network settings"
                log.log_connection_error(
                    _LOGGER,
                    e,
                    msg_before=msg,
                )
                self.put_msg(msg)
        if data.get("enterprises_name"):
            try:
                api_url = "https://api.github.com/enterprises/{}/audit-log".format(
                    str(value)
                )
                _LOGGER.debug(
                    f"Validating Audit Log Input for Enterprise URL = {api_url}"
                )
                resp = requests.get(
                    url=api_url, proxies=proxy_settings, headers=headers
                )
                if resp.status_code in (200, 201):
                    return True
                else:
                    log.log_exception(
                        _LOGGER,
                        Exception(
                            "ERROR [{}] while validating Audit Log Input for Enterprise. - Response = {}".format(
                                resp.status_code, resp.json()
                            )
                        ),
                        exc_label=constants.UCC_EXECPTION_EXE_LABEL.format(
                            "ValidateAuditInput_ERROR"
                        ),
                    )
                    if resp.status_code in (403, 401, 404):
                        self.put_msg(
                            "Enterprise doesn't exist or Enterprise does not have access to collect audit data."
                        )
                    else:
                        self.put_msg(
                            "Unable to configure the input. Check logs for more details."
                        )
                    return False
            except Exception as e:
                msg = "Could not connect to GitHub. Check configuration and network settings"
                log.log_connection_error(
                    _LOGGER,
                    e,
                    msg_before=msg,
                )
                self.put_msg(msg)
        return False


class ValidateUserInput(Validator):
    """
    Check if the Organization name provided is correct or not.
    """

    def __init__(self, *args, **kwargs):
        super(ValidateUserInput, self).__init__(*args, **kwargs)

    def validate(self, value, data):
        session_key = GetSessionKey().session_key
        account_details = get_account_details(_LOGGER, session_key, data.get("account"))
        proxy_settings = get_proxy_settings(_LOGGER, session_key)
        if data.get("org_name"):
            try:
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer {}".format(
                        account_details["security_token"]
                    ),
                }
                api_url = "https://api.github.com/orgs/{}".format(str(value))
                _LOGGER.debug(f"Validating User Input for Organization URL = {api_url}")
                resp = requests.get(
                    url=api_url, proxies=proxy_settings, headers=headers
                )
                if resp.status_code in (200, 201):
                    return True
                else:
                    log.log_exception(
                        _LOGGER,
                        Exception(
                            "ERROR [{}] while validating User Input for Organization. - Response = {}".format(
                                resp.status_code, resp.json()
                            )
                        ),
                        exc_label=constants.UCC_EXECPTION_EXE_LABEL.format(
                            "ValidateUserInput_ERROR"
                        ),
                    )
                    if resp.status_code in (401, 403):
                        self.put_msg(resp.json()["message"])
                    elif resp.status_code == 404:
                        self.put_msg("Invalid Organization Name")
                    else:
                        self.put_msg(
                            "Unable to configure the input. Check logs for more details."
                        )
                    return False
            except Exception as e:
                msg = "Could not connect to GitHub. Check configuration and network settings"
                log.log_connection_error(
                    _LOGGER,
                    e,
                    msg_before=msg,
                )
                self.put_msg(msg)
        return False





# jscpd:ignore-end


def checkpoint_handler(logger, session_key, check_point_value, check_point_key):
    """
    Handles checkpoint
    """
    try:
        checkpoint_collection = checkpointer.KVStoreCheckpointer(
            CHECKPOINTER, session_key, APP_NAME
        )
        logger.info("Updating {} as checkpoint value".format(check_point_value))
        checkpoint_collection.update(check_point_key, check_point_value)
    except Exception as e:
        log.log_exception(
            logger,
            e,
            exc_label=constants.UCC_EXECPTION_EXE_LABEL.format("checkpoint_handler"),
            msg_before="Updating checkpoint failed. Exception occurred",
        )


def delete_checkpoint(logger, session_key, checkpoint_key):
    try:
        checkpoint_collection = checkpointer.KVStoreCheckpointer(
            CHECKPOINTER, session_key, APP_NAME
        )
        logger.debug(f"Deleting checkpoint - {checkpoint_key}")
        checkpoint_collection.delete(checkpoint_key)
        return True
    except Exception as e:
        log.log_exception(
            logger,
            e,
            exc_label=constants.UCC_EXECPTION_EXE_LABEL.format("delete_checkpoint"),
            msg_before="Error occured while deleting checkpoint",
        )
        return False
