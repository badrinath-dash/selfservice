import React, { useState, useCallback } from 'react';
import ColumnLayout from '@splunk/react-ui/ColumnLayout';
import Button from '@splunk/react-ui/Button';
import StepBar from '@splunk/react-ui/StepBar';
import ChevronLeft from '@splunk/react-icons/ChevronLeft';
import ChevronRight from '@splunk/react-icons/ChevronRight';

import ApplicationDetailsForm from '../components/ApiAccessPage/ApplicationDetailsForm';
import DataClassificationForm from '../components/ApiAccessPage/DataClassificationForm';
import SplunkDetailsForm from '../components/ApiAccessPage/SplunkDetailsForm';
import TermsAndConditionForm from '../components/ApiAccessPage/TermsAndConditionForm';
import Info from '../components/ApiAccessPage/CostInfo';
import Icon from '../components/Icon';

const steps = [
  'Application Details',
  'Data Classification',
  'Splunk Details',
  'Terms & Conditions'
];

export default function SplunkRestAPIAccess() {
  const [activeStepId, setActiveStepId] = useState(0);
  const numSteps = steps.length;

  const [applicationFormData, setApplicationFormData] = useState({
    businessJustification: '',
    appID: '',
    dataOwner: '',
    techContact: '',
    supportContact: '',
    currentUser: ''
  });

  const [applicationFormErrors, setApplicationFormErrors] = useState({});

  const handlePrevious = useCallback(() => {
    setActiveStepId((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleNext = useCallback(() => {
    if (activeStepId === 0) {
      if (validateApplicationDetailsStep()) {
        setActiveStepId((prev) => Math.min(prev + 1, numSteps - 1));
      }
    } else {
      setActiveStepId((prev) => Math.min(prev + 1, numSteps - 1));
    }
  }, [activeStepId, numSteps, validateApplicationDetailsStep]);

  const validateApplicationDetailsStep = () => {
    const newErrors = {};
    if (!applicationFormData.appID) newErrors.appID = 'Application is required';
    if (!applicationFormData.businessJustification) newErrors.businessJustification = 'Business justification is required';
    if (!applicationFormData.techContact) newErrors.techContact = 'Technical contact is required';
    if (!applicationFormData.supportContact) newErrors.supportContact = 'Support contact is required';
    setApplicationFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const LeftColumnStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: '128px',
    paddingLeft: '80px',
    gap: '16px',
    borderRadius: '8px'
  };

  const RightColumnStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: '128px',
    paddingLeft: '80px',
    gap: '16px',
    borderRadius: '8px'
  };

  function getStepContent(step) {
    switch (step) {
      case 0:
        return (
          <ApplicationDetailsForm
            applicationFormData={applicationFormData}
            setApplicationFormData={setApplicationFormData}
            errors={applicationFormErrors}
          />
        );
      case 1:
        return (
          <DataClassificationForm
            applicationFormData={applicationFormData}
            setApplicationFormData={setApplicationFormData}
          />
        );
      case 2:
        return (
          <SplunkDetailsForm
            applicationFormData={applicationFormData}
            setApplicationFormData={setApplicationFormData}
          />
        );
      case 3:
        return (
          <TermsAndConditionForm
            applicationFormData={applicationFormData}
            setApplicationFormData={setApplicationFormData}
          />
        );
      default:
        return <div>Unknown step</div>;
    }
  }

  return (
    <ColumnLayout columns={2} divider="vertical">
      <ColumnLayout.Row>
        {/* Left Column */}
        <ColumnLayout.Column span={3} style={LeftColumnStyle}>
          <Icon icon="TelstraIcon" props={{ height: '50px', width: '50px' }} />
          <div style={{ marginTop: '24px' }}>
            <Info totalPrice={activeStepId >= 4 ? '$144.97' : '$134.98'} />
          </div>
        </ColumnLayout.Column>

        {/* Right Column */}
        <ColumnLayout.Column span={8} style={RightColumnStyle}>
          <StepBar activeStepId={activeStepId}>
            {steps.map((label) => (
              <StepBar.Step key={label}>{label}</StepBar.Step>
            ))}
          </StepBar>

          <div style={{ marginTop: '24px' }}>
            {getStepContent(activeStepId)}
          </div>

          <div style={{ marginTop: '24px', display: 'flex', gap: '300px' }}>
            <Button
              icon={<ChevronLeft />}
              appearance="primary"
              disabled={activeStepId === 0}
              onClick={handlePrevious}
            >
              Previous
            </Button>

            <Button
              icon={<ChevronRight />}
              appearance="primary"
              onClick={handleNext}
            >
              {activeStepId < numSteps - 1 ? 'Next' : 'Done'}
            </Button>
          </div>
        </ColumnLayout.Column>
      </ColumnLayout.Row>
    </ColumnLayout>
  );
}
