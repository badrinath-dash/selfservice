import React, { useEffect, useState, useCallback } from 'react';

import Button from '@splunk/react-ui/Button';
import Text from '@splunk/react-ui/Text';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import ColumnLayout from '@splunk/react-ui/ColumnLayout';
import Select from '@splunk/react-ui/Select';
import Switch from '@splunk/react-ui/Switch';
import styled from 'styled-components';
import Card from '@splunk/react-ui/Card';
import CheckRadioIcon from '@splunk/react-icons/CheckRadio';
import Paragraph from '@splunk/react-ui/Paragraph';
import List from '@splunk/react-ui/List';
import ApplicationDetailsForm from './ApplicationDetailsForm';
import TextArea from '@splunk/react-ui/TextArea';

import RadioList from '@splunk/react-ui/RadioList';


const StyledIconContainer = styled.div`
    display: flex;
    justify-content: right;
`;



const CardWrapper = styled.div`
  border: 2px solid ${({ selected }) => (selected ? '#0073e6' : '#ccc')};
  border-radius: 4px;
  box-shadow: ${({ selected }) => (selected ? '0 0 10px rgba(0, 115, 230, 0.5)' : 'none')};
  transition: all 0.3s ease;
  margin-bottom: 16px;
`;


export default function SplunkDetailsForm({ applicationFormData, setApplicationFormData, applicationFormErrors = {} }) {
  // const [selectedValue, setSelectedValue] = useState(1);
  const selectedValue = applicationFormData.standardAPIRequestType === 'Yes'
  const [values, setValues] = useState([]);
  const handleChange = (e, { value: clickValue }) => {
    setSelectedValue(clickValue);
  };


  const handleCheckBoxClick = (e, { value }) => {
    if (includes(values, value)) {
      setValues(without(values, value));
    } else {
      setValues([...values, value]);
    }
  };

  useEffect(() => {

  });


  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <ColumnLayout >
        <ColumnLayout.Row>
          <ColumnLayout.Column span={1}>
            <ControlGroup label="Select the Index Cluster where data will be hosted"
              tooltip="Provide the SPLUNK Search Query that will be used to query SPLUNK Rest API"
              required
              error={applicationFormErrors.splunkIndexCluster}
            >               
            <RadioList direction="row" value={applicationFormData.splunkIndexCluster}  
                onChange={(e, { value }) => setApplicationFormData((prev) => ({ ...prev, splunkIndexCluster: value }))}>
            <RadioList.Option value={1}>OneSplunk Cluster</RadioList.Option>
            <RadioList.Option value={2}>ES OnPrem Cluster</RadioList.Option>
            <RadioList.Option value={3}>ES AWS Cluster</RadioList.Option>
            <RadioList.Option value={4}>Mobile Cluster</RadioList.Option>
        </RadioList>

            </ControlGroup>
          </ColumnLayout.Column>
        </ColumnLayout.Row>
          <ColumnLayout.Row>
          <ColumnLayout.Column span={1}>
            <ControlGroup label="Origin Data Domain"
              tooltip="Data Domain of the data"
              required
              error={applicationFormErrors.splunkDataDomain}
            >
              
               
            <RadioList  value={applicationFormData.splunkDataDomain}  
                onChange={(e, { value }) => setApplicationFormData((prev) => ({ ...prev, splunkDataDomain: value }))}>
            <RadioList.Option value={1}>Network</RadioList.Option>
            <RadioList.Option value={2}>Application</RadioList.Option>
            <RadioList.Option value={3}>Operating System</RadioList.Option>
            <RadioList.Option value={4}>Non Production</RadioList.Option>
            <RadioList.Option value={4}>Summary</RadioList.Option>
            <RadioList.Option value={4}>Metrics</RadioList.Option>
            <RadioList.Option value={4}>Platform</RadioList.Option>
        </RadioList>

            </ControlGroup>
          </ColumnLayout.Column>
        </ColumnLayout.Row>
        <ColumnLayout.Row>
          <ColumnLayout.Column span={4}>
            <ControlGroup label="Splunk Engagement Request Number"
              tooltip="Splunk Engagement Request Number"
              required
              error={applicationFormErrors.splunkEngagementRequestNumber}
            >
              <Text
                value={applicationFormData.splunkEngagementRequestNumber}
                onChange={(e, { value }) => setApplicationFormData((prev) => ({ ...prev, splunkEngagementRequestNumber: value }))}
              >
               
              </Text>

            </ControlGroup>
          </ColumnLayout.Column>
        </ColumnLayout.Row>
        <ColumnLayout.Row>
          <ColumnLayout.Column span={4}>
            <ControlGroup label="Data Ingestion per day in MB"
              tooltip="Provide the details as how frequently the data will be queried"
              required
              error={applicationFormErrors.restQueryFrequency}
            >
              <Text
                value={applicationFormData.restQueryFrequency}
                onChange={(e, { value }) => setApplicationFormData((prev) => ({ ...prev, restQueryFrequency: value }))}
              >
               
              </Text>

            </ControlGroup>
          </ColumnLayout.Column>
        </ColumnLayout.Row>
        <ColumnLayout.Row>
          <ColumnLayout.Column span={1}>
            <ControlGroup label="Splunk Data Retentions"
              tooltip="Splunk Data Retentions"
              required
              error={applicationFormErrors.splunkSearchQuery}
            >
              <Select
                value={applicationFormData.splunkSearchQuery}
                onChange={(e, { value }) => setApplicationFormData((prev) => ({ ...prev, splunkSearchQuery: value }))}
              >
               <Select.Option label="1 Day" value="1" />
               <Select.Option label="7 Days" value="7" />
               <Select.Option label="14 Days" value="14" />
               <Select.Option label="21 Days" value="21" />
               <Select.Option label="1 Mon" value="30" />
               <Select.Option label="2 Mon" value="60" />
               <Select.Option label="3 Mon" value="90" />
               <Select.Option label="6 Mon" value="180" />
               <Select.Option label="12 Mon" value="365" />
               <Select.Option label="18 Mon" value="547" />
               <Select.Option label="24 Mon" value="730" />
               <Select.Option label="36 Mon" value="1095" />
               <Select.Option label="72 Mon" value="2190" />
              </Select>

            </ControlGroup>
          </ColumnLayout.Column>
        </ColumnLayout.Row>
      </ColumnLayout>
    </div>
  );
}
