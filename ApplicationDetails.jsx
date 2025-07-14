import React, { useEffect, useState, useCallback } from 'react';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Button from '@splunk/react-ui/Button';

import Text from '@splunk/react-ui/Text';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import ColumnLayout from '@splunk/react-ui/ColumnLayout';
import TextArea from '@splunk/react-ui/TextArea';
import Select from '@splunk/react-ui/Select';
import Typography from '@splunk/react-ui/Typography';
import WaitSpinner from '@splunk/react-ui/WaitSpinner';
import useFetchOptions, { isApplicationOption } from '../../common/ApplicationFetch';
import getUserRoleDetails from '../../common/GetUserDetails'



export default function ApplicationDetailsForm({ applicationFormData, setApplicationFormData, applicationFormErrors }) {

  const [applicationOptions, setApplicationOptions] = useState([]);
  const [fullCount, setFullCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  // const [selectedApp, setSelectedApp] = useState(null);

  // const [selectedValue, setSelectedValue] = useState('');
  const { fetch, getFullCount,fetchByAppID, getOption, stop } = useFetchOptions();


  // Replace with your real API

  const handleFetch = useCallback(
    (keyword = '') => {
      setIsLoading(true);
      fetch(keyword)
        .then((newOptions) => {
          setIsLoading(false);
          setApplicationOptions(newOptions);
          setFullCount(getFullCount());
        })
        .catch((error) => {
          if (!error.isCanceled) {
            throw error;
          }
        });
    },
    [fetch, getFullCount]
  );


  // Load data for Aplication 
  useEffect(() => {
    setIsLoading(false);
    handleFetch('');
    return () => stop()
  }, [handleFetch, stop]);

  // Load the function during page load
  useEffect(() => {
    getUserContext();
  }, []);

  /** when appID Changes, make sure selected app is loaded **/
  useEffect(() => {
    if (applicationFormData?.appID){
      const existInList = applicationOptions.find(opt => opt.id === applicationFormData.appID);
      if (!existInList){
        fetchByAppID(applicationFormData.appID).then((selected) => {
          if (selected) {
            setApplicationOptions((prev) => [...prev,selected]);
          }
        })
      } 
    }
  }, [applicationFormData.appID,applicationOptions,fetchByAppID])


  const getUserContext = () => {
    const defaultErrorMsg = "Error in getting the user context from SPLUNK, Please refresh the Page"
    getUserRoleDetails(defaultErrorMsg).then((response) => {
      if (response.ok) {
        response.json().then((data) => {
          setApplicationFormData((prev) => ({
            ...prev,
            currentUser: data.entry[0].content.email,
          }));
        });
      }
    })
      .catch((err) => {
        console.error("User Context Error:", err);
      });
  };


  const handleChange = useCallback((e, { value: newValue }) => {
    // setSelectedValue(newValue);
    // setApplicationFormData((prev) => ({ ...prev, appID: newValue }));
    const selected = applicationOptions.find(app => app.id === newValue);
    setApplicationFormData((prev) => ({
      ...prev,
      appID: selected?.id || '',
      dataOwner: selected?.product_owner || '',
    }));
  }, [applicationOptions, setApplicationFormData]);

  // const handleChange = (field) => (e,{value}) => {
  //   setApplicationFormData((prev) => ({...prev, [field]: value}));
  // };

  const handleFilterChange = useCallback(
    (e, { keyword }) => {
      handleFetch(keyword);
    },
    [handleFetch]
  );


  const createOption = (app, isSelected = false) => (
    /**
     * Filtering is done server-side and the `matchRanges` prop would be either
     * be provided by the server, deduced based on the match algorithm, or omitted.
     * To simplify this example, the search value only matches the beginning of the title.
     */
    <Select.Option
      hidden={!!isSelected}
      key={isSelected ? `selected-${app.id}` : app.id}
      label={app.title}
      matchRanges={isApplicationOption(app) ? app.matchRanges : undefined}
      value={app.id}
    />
  );

  const generateOptions = useCallback(() => {
    const list = applicationOptions.map((app) => createOption(app));
    if (applicationFormData.appID) {
      const selectedApp = getOption(applicationFormData.appID);
      if (selectedApp) {
        list.push(createOption(selectedApp, true));
      }
    }
    return list;
  }, [applicationOptions, applicationFormData, getOption]);


  const footerMessage = () => {
    const fullCount = getFullCount();
    if (fullCount > applicationOptions.length && !isLoading) {
      return `${applicationOptions.length} of ${fullCount} applications`;
    }
    return null;
  }

  return (

    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <ColumnLayout >
        <ColumnLayout.Row>
          <ColumnLayout.Column span={1}>
            <ControlGroup 
            label="Application Name" 
            tooltip="Provide Application Name"
            error={!!applicationFormErrors.appID}
            help={!applicationFormErrors.appID}
            >
            <Select
                filter="controlled"
                placeholder="Select an Application..."
                menuStyle={{ width: 300 }}
                onChange={handleChange}
                onFilterChange={handleFilterChange}
                isLoadingOptions={isLoading}
                footerMessage={footerMessage()}
                value={applicationFormData?.appID || ''}
              >
                {generateOptions()}
              </Select>
            </ControlGroup>
          </ColumnLayout.Column>
        </ColumnLayout.Row>
        <ColumnLayout.Row>
          <ColumnLayout.Column span={1}>
            <ControlGroup label="Email Address of Requestor" tooltip="Email Address">
              <Text
                name="EmailAddress"
                value={applicationFormData?.currentUser || ''}
                disabled
              />
            </ControlGroup>
          </ColumnLayout.Column>
        </ColumnLayout.Row>

        <ColumnLayout.Row>
          <ColumnLayout.Column span={2}>
            <ControlGroup label="Business Justification" tooltip="Provide a Brief Business Justification">
              <TextArea name="businessJustification" 
              value={applicationFormData?.businessJustification || ''}
              onChange={(e, { value }) =>
                  setApplicationFormData((prev) => ({ ...prev, businessJustification: value }))}/>
            </ControlGroup>
          </ColumnLayout.Column>
        </ColumnLayout.Row>

        <ColumnLayout.Row>
          <ColumnLayout.Column span={1}>
            <ControlGroup label="Ability AppID" tooltip="Enter Ability AppID">
              <Text name="appID"
                value={applicationFormData?.appID || ''}
                disabled
              />
            </ControlGroup>
          </ColumnLayout.Column>

          <ColumnLayout.Column span={1}>
            <ControlGroup label="Data Owner" tooltip="DataOwner">
              <Text name="dataOwner"
                value={applicationFormData?.dataOwner || ''}
                disabled
              />
            </ControlGroup>
          </ColumnLayout.Column>
        </ColumnLayout.Row>

        <ColumnLayout.Row>
          <ColumnLayout.Column span={1}>
            <ControlGroup label="Technical Contact Email" tooltip="Technical Contact of your team">
              <Text name="techContact"
                value={applicationFormData?.techContact || ''}
                onChange={(e, { value }) =>
                  setApplicationFormData((prev) => ({ ...prev, techContact: value }))}
              />
            </ControlGroup>
          </ColumnLayout.Column>
        </ColumnLayout.Row>
        <ColumnLayout.Row>
          <ColumnLayout.Column span={1}>
            <ControlGroup 
            label="Support Contact Email" 
            tooltip="Support Contact Details"
            error={!!applicationFormErrors.supportContact}
            help={!applicationFormErrors.supportContact}
            >
              <Text name="supportContact"
                value={applicationFormData?.supportContact || ''}
                onChange={(e, { value }) =>
                  setApplicationFormData((prev) => ({ ...prev, supportContact: value }))}
              />
            </ControlGroup>
          </ColumnLayout.Column>
        </ColumnLayout.Row>
      </ColumnLayout>
    </div>
  );
}
