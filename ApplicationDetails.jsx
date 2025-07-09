import React, { useEffect, useState, useCallback } from 'react';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import ColumnLayout from '@splunk/react-ui/ColumnLayout';
import Text from '@splunk/react-ui/Text';
import TextArea from '@splunk/react-ui/TextArea';
import Select from '@splunk/react-ui/Select';
import useFetchOptions, { isApplicationOption } from './ApplicationFetch';
import getUserRoleDetails from '../../common/GetUserDetails';

export default function ApplicationDetailsForm({ applicationFormData, setApplicationFormData, errors = {} }) {
  const [applicationOptions, setApplicationOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { fetch, getFullCount, getOption, stop } = useFetchOptions();

  const handleFetch = useCallback((keyword = '') => {
    setIsLoading(true);
    fetch(keyword)
      .then((newOptions) => {
        setApplicationOptions(newOptions);
        setIsLoading(false);
      })
      .catch((error) => {
        if (!error.isCanceled) {
          console.error('Fetch error:', error);
          setIsLoading(false);
        }
      });
  }, [fetch]);

  useEffect(() => {
    handleFetch('');
    return () => stop();
  }, [handleFetch, stop]);

  useEffect(() => {
    const defaultErrorMsg = "Error in getting the user context from SPLUNK, Please refresh the Page";
    getUserRoleDetails(defaultErrorMsg)
      .then((response) => {
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
  }, [setApplicationFormData]);

  const handleChange = (field) => (e, { value }) => {
    setApplicationFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectChange = (e, { value }) => {
    const selected = applicationOptions.find(app => app.id === value);
    setApplicationFormData((prev) => ({
      ...prev,
      appID: selected?.id || '',
      dataOwner: selected?.id || '',
    }));
  };

  const handleFilterChange = (e, { keyword }) => {
    handleFetch(keyword);
  };

  const createOption = (app, isSelected = false) => (
    <Select.Option
      hidden={!!isSelected}
      key={isSelected ? `selected-${app.id}` : app.id}
      label={app.title}
      matchRanges={isApplicationOption(app) ? app.matchRanges : undefined}
      value={app.id}
    />
  );

  const generateOptions = () => {
    const list = applicationOptions.map((app) => createOption(app));
    if (applicationFormData.appID) {
      const selectedApp = getOption(applicationFormData.appID);
      if (selectedApp) {
        list.push(createOption(selectedApp, true));
      }
    }
    return list;
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <ColumnLayout columns={2}>
        <ColumnLayout.Row>
          <ColumnLayout.Column span={2}>
            <ControlGroup
              label="Application Name"
              tooltip="Provide Application Name"
              error={!!errors.appID}
              help={errors.appID}
            >
              <Select
                filter="controlled"
                placeholder="Select an Application..."
                menuStyle={{ width: 300 }}
                onChange={handleSelectChange}
                onFilterChange={handleFilterChange}
                isLoadingOptions={isLoading}
                value={applicationFormData.appID}
              >
                {generateOptions()}
              </Select>
            </ControlGroup>
          </ColumnLayout.Column>
        </ColumnLayout.Row>

        <ColumnLayout.Row>
          <ColumnLayout.Column span={2}>
            <ControlGroup label="Email Address of Requestor" tooltip="Email Address">
              <Text name="EmailAddress" value={applicationFormData.currentUser || ''} disabled />
            </ControlGroup>
          </ColumnLayout.Column>
        </ColumnLayout.Row>

        <ColumnLayout.Row>
          <ColumnLayout.Column span={2}>
            <ControlGroup
              label="Business Justification"
              tooltip="Provide a Brief Business Justification"
              error={!!errors.businessJustification}
              help={errors.businessJustification}
            >
              <TextArea
                name="BusinessJustification"
                value={applicationFormData.businessJustification || ''}
                onChange={handleChange('businessJustification')}
              />
            </ControlGroup>
          </ColumnLayout.Column>
        </ColumnLayout.Row>

        <ColumnLayout.Row>
          <ColumnLayout.Column span={1}>
            <ControlGroup label="Ability AppID" tooltip="Enter Ability AppID">
              <Text name="AbilityAppID" value={applicationFormData.appID || ''} disabled />
            </ControlGroup>
          </ColumnLayout.Column>

          <ColumnLayout.Column span={1}>
            <ControlGroup label="Data Owner" tooltip="DataOwner">
              <Text name="DataOwner" value={applicationFormData.dataOwner || ''} disabled />
            </ControlGroup>
          </ColumnLayout.Column>
        </ColumnLayout.Row>

        <ColumnLayout.Row>
          <ColumnLayout.Column span={1}>
            <ControlGroup
              label="Technical Contact Email"
              tooltip="Technical Contact of your team"
              error={!!errors.techContact}
              help={errors.techContact}
            >
              <Text
                name="TechnicalContact"
                value={applicationFormData.techContact || ''}
                onChange={handleChange('techContact')}
              />
            </ControlGroup>
          </ColumnLayout.Column>

          <ColumnLayout.Column span={1}>
            <ControlGroup
              label="Support Contact Email"
              tooltip="Support Contact Details"
              error={!!errors.supportContact}
              help={errors.supportContact}
            >
              <Text
                name="SupportContactEmail"
                value={applicationFormData.supportContact || ''}
                onChange={handleChange('supportContact')}
              />
            </ControlGroup>
          </ColumnLayout.Column>
        </ColumnLayout.Row>
      </ColumnLayout>
    </div>
  );
}
