import React, { useState } from 'react';
import { includes, without } from 'lodash';
import moment from 'moment';

import Button from '@splunk/react-ui/Button';
import Text from '@splunk/react-ui/Text';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import ColumnLayout, { Column } from '@splunk/react-ui/ColumnLayout';
import Select from '@splunk/react-ui/Select';
import Switch from '@splunk/react-ui/Switch';
import styled from 'styled-components';
import Card from '@splunk/react-ui/Card';
import DollarMark from '@splunk/react-icons/DollarMark';
import Icon from '../Icon';
import Date from '@splunk/react-ui/Date';
import CardLayout from '@splunk/react-ui/CardLayout';
import CollapsiblePanel from '@splunk/react-ui/CollapsiblePanel';

const StyledCardContainer = styled.div`
    display: flex;
    justify-content: right;
    height: 350px;
    background: linear-gradient(to right bottom, rgba(11, 14, 20, 0.2) 25%, rgba(51, 60, 77, 0.2) 100%);
    box-shadow: rgb(0, 0, 0) 0px 4px 8px;
    width: 600px;
`;


const SmallText = styled(Text)`
  width: 300px;
`;


const CardWrapper = styled.div`
  border-radius: 4px;
  transition: all 0.3s ease;
  margin-bottom: 16px;
  height: 350px;
  width: 600px;
  min-width: 600px;
`;

export default function FinanceDetailsForm({ applicationFormData, setApplicationFormData, applicationFormErrors = {} }) {
    const [selectedValue, setSelectedValue] = useState(1);
    const [values, setValues] = useState([]);

    const handleChange = (e, { value }) => {
        setSelectedValue(value);
    };

    const handleCheckBoxClick = (e, { value }) => {
        if (includes(values, value)) {
            setValues(without(values, value));
        } else {
            setValues([...values, value]);
        }
    };

    const today = moment().format('YYYY-MM-DD');
    const lastDayOfMonth = moment().endOf('month').format('YYYY-MM-DD');
    const firstDayOfMonth = moment().startOf('month').format('YYYY-MM-DD');
    const tomorrow = moment().add(1, 'day').format('YYYY-MM-DD');

    const selectedDay = today === lastDayOfMonth ? firstDayOfMonth : tomorrow;

    const [value, setValue] = useState(selectedDay);


    const renderLaborNWASection = () => (
  <ColumnLayout.Row>
    <ColumnLayout.Column span={2}>
      <ControlGroup
        label="Labor NWA Code"
        tooltip="Provide a NWA code with the amount displayed against Labor NWA Code"
        required
      >
        <Text
          style={{ width: '200px' }}
          name="laborNWACode"
          defaultValue="Provide NWA Code against Cost Center DATA20"
          value={applicationFormData?.laborNWACode || ''}
          onChange={(e, { value }) =>
            setApplicationFormData((prev) => ({
              ...prev,
              laborNWACode: value,
            }))
          }
        />
      </ControlGroup>
    </ColumnLayout.Column>
    <ColumnLayout.Column span={1}>
      <ControlGroup
        label="Expiry Date"
        tooltip="NWA Code should be valid for at least 3 months from project start"
        required
      >
        <Date
          name="laborNWAExpiryDate"
          highlightToday
          value={applicationFormData?.laborNWAExpiryDate || ''}
          onChange={(e, { value }) =>
            setApplicationFormData((prev) => ({
              ...prev,
              laborNWAExpiryDate: value,
            }))
          }
        />
      </ControlGroup>
    </ColumnLayout.Column>
  </ColumnLayout.Row>
);


    return (
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <ColumnLayout>
                <ColumnLayout.Row>
                    <ColumnLayout.Column span={1}>
                        <CardLayout cardWidth={600} >
                            <Card key={1}>
                                <Icon
                                    icon="DollarMark"
                                    props={{ width: '64px', height: '64px' }}
                                />
                                <Card.Header title="Finance" />
                                <Card.Body>
                                    <ColumnLayout>
                                        <ColumnLayout.Row>
                                            <ColumnLayout.Column span={2}>
                                                <ControlGroup
                                                    label="Infrastructure NWA Code"
                                                    tooltip="Provide a NWA code with the amount displayed against Infrastructure Cost"
                                                    required
                                                >
                                                    <Text style={{ width: '200px' }}  // Directly control width here
                                                        name="NWA Code"
                                                        defaultValue="Provide NWA Code against Cost Center DATA20"
                                                        value={applicationFormData?.infrastructureNWACode || ''}
                                                        onChange={(e, { value }) =>
                                                            setApplicationFormData((prev) => ({
                                                                ...prev,
                                                                infrastructureNWACode: value,
                                                            }))
                                                        }
                                                    />
                                                </ControlGroup>
                                            </ColumnLayout.Column>
                                            <ColumnLayout.Column span={1}>
                                                <ControlGroup
                                                    label="Expiry Date"
                                                    tooltip="NWA Code should be valid for at least 3 months from project start"
                                                    required
                                                >
                                                    <Date
                                                        name="expiryDate"
                                                        highlightToday
                                                        value={applicationFormData?.infraNWAExpiryDate || ''}
                                                        onChange={(e, { value }) =>
                                                            setApplicationFormData((prev) => ({
                                                                ...prev,
                                                                infraNWAExpiryDate: value,
                                                            }))
                                                        }
                                                    />
                                                </ControlGroup>
                                            </ColumnLayout.Column>
                                        </ColumnLayout.Row>
                                       {applicationFormData?.standardAPIRequestType === 'Yes' && renderLaborNWASection()}
                                    </ColumnLayout>
                                </Card.Body>
                            </Card>
                        </CardLayout>
                    </ColumnLayout.Column>
                </ColumnLayout.Row>
            </ColumnLayout>
        </div>
    );
}
