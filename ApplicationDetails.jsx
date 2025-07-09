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
import useFetchOptions, { isApplicationOption } from './ApplicationFetch';
import getUserRoleDetails from '../../common/GetUserDetails'



export default function ApplicationDetailsForm() {

  const [applicationOptions, setApplicationOptions] = useState([]);
  const [fullCount, setFullCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState();

  const [selectedValue, setSelectedValue] = useState('');
  const { fetch, getFullCount, getOption, stop } = useFetchOptions();

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



  useEffect(() => {
    setIsLoading(false);
    fetch('')
      .then((newOptions) => {
        setApplicationOptions(newOptions);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('fetch error', error);
        setIsLoading(false);
      })
    return () => stop()
  }, [fetch, stop]);

  // Load the function during page load
  useEffect(() => {
    getUserContext();
    //  checkRoleForAdmin();
  }, []);


  const getUserContext = () => {
     const defaultErrorMsg ="Error in getting the user context from SPLUNK, Please refresh the Page"
     getUserRoleDetails(defaultErrorMsg).then((response) => {
      if (response.ok) {
         response.json().then((data) => {
          setCurrentUserEmail(data.entry[0].content.email);
         })
      }
     })
  };

  
  const handleChange = useCallback((e, { value: newValue }) => {
    setSelectedValue(newValue);
  }, []);

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
    if (selectedValue) {
      const selectedApp = getOption(selectedValue);
      if (selectedApp) {
        list.push(createOption(selectedApp, true));
      }
    }
    return list;
  }, [applicationOptions, selectedValue, getOption]);


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
            <ControlGroup label="Application Name" tooltip="Provide Application Name">
              <Select
                filter="controlled"
                placeholder="Select an Application..."
                menuStyle={{ width: 300 }}
                onChange={handleChange}
                onFilterChange={handleFilterChange}
                isLoadingOptions={isLoading}
                footerMessage={footerMessage()}
                value={selectedValue}
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
              value={currentUserEmail}
              disabled
              />
            </ControlGroup>
          </ColumnLayout.Column>
        </ColumnLayout.Row>

        <ColumnLayout.Row>
          <ColumnLayout.Column span={2}>
            <ControlGroup label="Business Justification" tooltip="Provide a Brief Business Justification">
              <TextArea name="BusinessJustification" />
            </ControlGroup>
          </ColumnLayout.Column>
        </ColumnLayout.Row>

        <ColumnLayout.Row>
          <ColumnLayout.Column span={1}>
            <ControlGroup label="Ability AppID" tooltip="Enter Ability AppID">
              <Text name="AbilityAppID" />
            </ControlGroup>
          </ColumnLayout.Column>

          <ColumnLayout.Column span={1}>
            <ControlGroup label="Data Owner" tooltip="DataOwner">
              <Text name="DataOwner" />
            </ControlGroup>
          </ColumnLayout.Column>
        </ColumnLayout.Row>

        <ColumnLayout.Row>
          <ColumnLayout.Column span={1}>
            <ControlGroup label="Technical Contact Email" tooltip="Technical Contact of your team">
              <Text name="TechnicalContact" />
            </ControlGroup>
          </ColumnLayout.Column>

          <ColumnLayout.Column span={1}>
            <ControlGroup label="Support Contact Email" tooltip="Support Contact Details">
              <Text name="SupportContactEmail" />
            </ControlGroup>
          </ColumnLayout.Column>
        </ColumnLayout.Row>
      </ColumnLayout>
    </div>
  );
}
