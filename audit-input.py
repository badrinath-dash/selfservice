import datetime
from datetime import timezone
import json
import logging
from typing import Optional
import os


from Splunk_TA_Apigee_utils import get_account_details, get_proxy_settings, set_logger

from datetime import datetime,timedelta
import time
import requests
from solnlib import conf_manager, log
from solnlib.modular_input import checkpointer
from splunklib import modularinput as smi
from requests.auth import HTTPBasicAuth


ADDON_NAME = "splunk_TA_Apigee"

def logger_for_input(input_name: str) -> logging.Logger:
    return log.Logs().get_logger(f"{ADDON_NAME.lower()}_{input_name}")


# def get_account_api_key(session_key: str, account_name: str):
#     cfm = conf_manager.ConfManager(
#         session_key,
#         ADDON_NAME,
#         realm=f"__REST_CREDENTIAL__#{ADDON_NAME}#configs/conf-splunk_ta_apigee_account",
#     )
#     account_conf_file = cfm.get_conf("splunk_ta_apigee_account")
#     return account_conf_file.get(account_name)


def get_data_from_api(
    logger,account_name: str, apigee_url_endpoint :str ,auth : str,apigee_ssl_client_cert : str,apigee_ssl_key : str,api_start_time :str,api_end_time: str,proxy_settings
):
    logger.info("Getting data from an external API == ", apigee_url_endpoint)
    
    
    if apigee_ssl_key:
                current_location=os.path.dirname(os.path.abspath(__file__))
                client_cert_key = current_location+'/custom_cert/ssl_cafile_'+account_name+'.key'
                outfile = open(client_cert_key, 'w')
                outfile.write(apigee_ssl_key)
                outfile.close()
    if apigee_ssl_client_cert:
                current_location=os.path.dirname(os.path.abspath(__file__))
                client_cert_filename = current_location+'/custom_cert/ssl_clientcert_file_'+account_name+'.pem'
                outfile = open(client_cert_filename, 'w')
                outfile.write(apigee_ssl_client_cert)
                outfile.close()

    if apigee_ssl_client_cert:
       cert = (client_cert_filename, client_cert_key)
    else:
       cert = None
        
    parameters =  {"expand": "true","startTime":api_start_time,"EndTime":api_end_time}
    headers = {"Content-Type":"application/octet-stream"}
    response = requests.get(
            url=apigee_url_endpoint,
            proxies=proxy_settings,
            cert=cert,
            verify=False, 
            auth=auth, 
            headers=headers,
            params=parameters
    )
    response.raise_for_status()
    return response.json()

    for _ in range(3):
        try:
            return _call_api(page_number)
        except requests.exceptions.HTTPError:
            logger.warning("Failed to get data from the API, retrying...")
    raise Exception("Failed to get data from the API")


def validate_input(definition: smi.ValidationDefinition):
    return

def GetStartTime( logger: logging.Logger, start_from: str):
    if start_from:
        startfrom=start_from
        format = '%Y-%m-%d'
        epoch_time = datetime.time.mktime(datetime.time.strptime(startfrom, format))
        epoch_time = int(epoch_time)*1000
    else:
        startfrom = datetime.now() + timedelta(-7)
        startfrom = startfrom.strftime("%Y-%m-%dT%H:%M:%S")
        format = '%Y-%m-%dT%H:%M:%S'
        epoch_time = time.mktime(time.strptime(startfrom, format))
        epoch_time = int(epoch_time)*1000
    return epoch_time


def stream_events(inputs: smi.InputDefinition, event_writer: smi.EventWriter):
    # inputs.inputs is a Python dictionary object like:
    # {
    #   "apigee_audit_input://<input_name>": {
    #     "account": "<account_name>",
    #     "disabled": "0",
    #     "host": "$decideOnStartup",
    #     "index": "<index_name>",
    #     "interval": "<interval_value>",
    #     "python.version": "python3",
    #   },
    # }
    for input_name, input_item in inputs.inputs.items():
        normalized_input_name = input_name.split("/")[-1]
        logger = logger_for_input(normalized_input_name)
        try:
            session_key = inputs.metadata["session_key"]
            log_level = conf_manager.get_log_level(
                logger=logger,
                session_key=session_key,
                app_name=ADDON_NAME,
                conf_name="splunk_ta_apigee_settings",
            )
            logger.setLevel(log_level)
            log.modular_input_start(logger, normalized_input_name)
            account_name = input_item.get("account")
            account_details = get_account_details(
                logger, session_key, account_name
            )
            apigee_username = account_details["apigee_username"]
            apigee_password = account_details["apigee_password"]
            apigee_org_name = input_item.get("apigee_org_name")
            apigee_url_endpoint = input_item.get("apigee_url")
            audit_resource_uri = input_item.get("audit_resource_uri")
            interval = input_item.get("interval")
            start_from = input_item.get("start_from")
            apigee_ssl_client_cert = account_details["apigee_ssl_client_cert"]
            apigee_ssl_key = account_details["apigee_ssl_key"]
            


            


            auth = HTTPBasicAuth(str(apigee_username), str(apigee_password))

            proxy_settings=get_proxy_settings(logger, session_key)

            #response = requests.get(url=url, proxies=proxies, cert=cert, verify=False, auth=auth, headers=headers,params=params)

            api_start_time = GetStartTime(logger,start_from)
            api_end_time = int(time.time())*1000 - int(interval)
            log.modular_input_start(logger, normalized_input_name)
            data = get_data_from_api(logger, account_name, apigee_url_endpoint,auth,apigee_ssl_client_cert,apigee_ssl_key,api_start_time,api_end_time,proxy_settings)
            sourcetype = "dummy-data"
            for line in data:
                event_writer.write_event(
                    smi.Event(
                        data=json.dumps(line, ensure_ascii=False, default=str),
                        index=input_item.get("index"),
                        sourcetype=sourcetype,
                    )
                )
            log.events_ingested(
                logger,
                input_name,
                sourcetype,
                len(data),
                input_item.get("index"),
                account=input_item.get("account"),
            )
            log.modular_input_end(logger, normalized_input_name)
        except Exception as e:
            log.log_exception(logger, e, "my custom error type", msg_before="Exception raised while ingesting data for demo_input: ")
