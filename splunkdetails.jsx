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




  const [selectedValue, setSelectedValue] = useState(1);

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
            <ControlGroup label="How complex is your query"
              tooltip="Complexity of SPLUNK Query and other Params"
            >
              
              <CardWrapper selected={selectedValue === 1}>

                <Card
                  // aria-checked={cardSelected}
                  key={1}
                  onClick={() => {
                    setSelectedValue(1);
                    setApplicationFormData((prev) => ({ ...prev, standardAPIRequestType: "Yes", nonStandardAPIRequestType: "",}));
                  }}

                  role="radio"
                  value={applicationFormData.standardAPIRequestType}
                >
                  <Card.Header title="Splunk Standard Query" >
                    <StyledIconContainer>
                      <CheckRadioIcon
                        variant={selectedValue === 1 ? 'filled' : 'default'}
                        height="20px"
                        width="20px"
                      />
                    </StyledIconContainer>
                  </Card.Header>
                  <Card.Body>
                    <Paragraph style={{ width: 200 }}>
                      <List ordered>
                        <List.Item>Run time &lt; 10 sec</List.Item>
                        <List.Item>Frequency of API call &gt; 5 mins</List.Item>
                        <List.Item>SPLUNK query has index="IndexName"</List.Item>
                        <List.Item>Splunk Query does not fields* or table * command</List.Item>
                      </List>

                    </Paragraph>
                  </Card.Body>
                </Card>
              </CardWrapper>
              <CardWrapper selected={selectedValue === 0}>

                <Card
                  // aria-checked={cardSelected}
                  key={2}

                  onClick={() => {
                    setSelectedValue(0);
                    setApplicationFormData((prev) => ({ ...prev, nonStandardAPIRequestType: "Yes",standardAPIRequestType: "", }));
                  }}


                  role="radio"
                  // value="0"
                  value={applicationFormData.nonStandardAPIRequestType}
                >
                  <Card.Header title="Splunk Non-Standard Query" >
                    <StyledIconContainer>
                      <CheckRadioIcon
                        variant={selectedValue === 0 ? 'filled' : 'default'}
                        height="20px"
                        width="20px"
                      />
                    </StyledIconContainer>
                  </Card.Header>
                  <Card.Body>
                    <Paragraph style={{ width: 200 }}>
                      <List ordered>
                        <List.Item>Run time &gt; 10 sec</List.Item>
                        <List.Item>Frequency of API call &lt; 5 mins</List.Item>
                        <List.Item>Contains Multiple index and join between them</List.Item>
                        <List.Item>Query Require SPLUNK Team to review it</List.Item>
                      </List>
                    </Paragraph>
                  </Card.Body>
                </Card>

              </CardWrapper>

            </ControlGroup>
          </ColumnLayout.Column>
        </ColumnLayout.Row>
        <ColumnLayout.Row>
          <ColumnLayout.Column span={4}>
            <ControlGroup label="Robot Account to be used to query data"
              tooltip="Provide n-user Robot account that will be used to query the data in SPLUNK"
              required
              error={applicationFormErrors.restRobotAccountUsed}
            >
              <Text
                name="SplunkRobotAccount"
                value={applicationFormData?.restRobotAccountUsed || ''}
                onChange={(e, { value }) => setApplicationFormData((prev) => ({ ...prev, restRobotAccountUsed: value }))}
              >
              </Text>
            </ControlGroup>
          </ColumnLayout.Column>
        </ColumnLayout.Row>
        <ColumnLayout.Row>
          <ColumnLayout.Column span={4}>
            <ControlGroup label="Search Frequency Interval"
              tooltip="Provide the details as how frequently the data will be queried"
              required
              error={applicationFormErrors.restQueryFrequency}
            >
              <Select
                value={applicationFormData.restQueryFrequency}
                onChange={(e, { value }) => setApplicationFormData((prev) => ({ ...prev, restQueryFrequency: value }))}
              >
                <Select.Option label="5 Min" value="5" />
                <Select.Option label="10 Min" value="10" />
                <Select.Option label="15 Min" value="15" />
                <Select.Option label="30 Min" value="30" />
                <Select.Option label="1 Hour" value="60" />
                <Select.Option label="2 Hour" value="120" />
                <Select.Option label="4 Hour" value="240" />
                <Select.Option label="12 Hour" value="720" />
                <Select.Option label="24 Hour" value="1440" />
              </Select>

            </ControlGroup>
          </ColumnLayout.Column>
        </ColumnLayout.Row>
        <ColumnLayout.Row>
          <ColumnLayout.Column span={1}>
            <ControlGroup label="Splunk Search Query to be used to query Data"
              tooltip="Provide the SPLUNK Search Query that will be used to query SPLUNK Rest API"
              required
              error={applicationFormErrors.splunkSearchQuery}
            >
              <TextArea
                value={applicationFormData.splunkSearchQuery}
                onChange={(e, { value }) => setApplicationFormData((prev) => ({ ...prev, splunkSearchQuery: value }))}
              >
              
              </TextArea>

            </ControlGroup>
          </ColumnLayout.Column>
        </ColumnLayout.Row>
      </ColumnLayout>
    </div>
  );
}
