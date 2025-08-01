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
import FinanceDetailsForm from '../components/ApiAccessPage/FinanceForm'
import Info from '../components/ApiAccessPage/CostInfo';
import Icon from '../components/Icon';

const steps = [
  'Application Details',
  'Data Classification',
  'Splunk Details',
  'Finance Details',
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
    currentUser: '',
    sensitiveInfoFlag: '',
    PIIDataFlag: '',
    complianceArtefact: '',
    targetSystemDataRetention: '',
    standardAPIRequestType: '',
    nonStandardAPIRequestType: '',
    restRobotAccountUsed: '',
    restQueryFrequency: '',
    infrastrcurePMOCode: '',
    laborPMOCode: '',
    termsAccepted: false,
  });

  const [applicationFormErrors, setApplicationFormErrors] = useState({});

  const handlePrevious = useCallback(() => {
    setActiveStepId((prev) => Math.max(prev - 1, 0));
  }, []);

  const validateAPIFormSteps = (stepId) => {
    switch (stepId) {
      // Below has been commented temporarily to bypass field validation during testing
      // case 0:
      //   return validateApplicationDetailsStep();
      // case 1:
      //   return ValidateDataClassificationForm();
      default:
        return true;
    }
  }

  const handleNext = useCallback(() => {
    if (validateAPIFormSteps(activeStepId)) {
      setActiveStepId((prev) => Math.min(prev + 1, numSteps - 1));
    };

  }, [activeStepId, numSteps, validateAPIFormSteps]);

  const validateApplicationDetailsStep = () => {
    const newErrors = {};
    const telstraEmailRegex = /^[^\s@]+@team\.telstra\.com$/;
    if (!applicationFormData.appID) {
      newErrors.appID = 'Application is required';
    }
    if (!applicationFormData.businessJustification) {
      newErrors.businessJustification = 'Business justification is required';
    }
    if (!applicationFormData.techContact) {
      newErrors.techContact = 'Technical contact is required';
    } else if (!telstraEmailRegex.test(applicationFormData.techContact)) {
      newErrors.techContact = 'Tecnical contact must be a valid Telstra email address ending with telstra.com'
    }
    if (!applicationFormData.supportContact) {
      newErrors.supportContact = 'Support contact is required';
    } else if (!telstraEmailRegex.test(applicationFormData.supportContact)) {
      newErrors.supportContact = 'Support contact must be a valid Telstra email address ending with telstra.com'
    }

    setApplicationFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };





  const calculateCost = useCallback(() => {
    let baseCost = 100;
    baseCost += (1440 / applicationFormData.restQueryFrequency) * 10;



    if (applicationFormData.standardAPIRequestType === 'Yes') {
      baseCost += 0;
    }

    if (applicationFormData.nonStandardAPIRequestType === 'Yes') {
      baseCost += 1000;
    }

    return `$${baseCost.toFixed(2)}`;
  }, [applicationFormData]);



  const ValidateDataClassificationForm = () => {
    const newErrors = {};
    if (!applicationFormData.sensitiveInfoFlag) {
      newErrors.sensitiveInfoFlag = 'Please select if requested dataset contains Sensitive Information';
    }
    if (!applicationFormData.PIIDataFlag) {
      newErrors.PIIDataFlag = 'Please select if requested dataset PII Information';
    }
    if (!applicationFormData.complianceArtefact) {
      newErrors.complianceArtefact = 'Compliance Artefact is mandatory';
    }
    if (!applicationFormData.targetSystemDataRetention) {
      newErrors.targetSystemDataRetention = 'Please specify Target system Data retention ';
    }
    if (!applicationFormData.dataEncryptionRestFlag) {
      newErrors.dataEncryptionRestFlag = 'Please specify data retention at rest ';
    }

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
            applicationFormErrors={applicationFormErrors}
          />
        );
      case 1:
        return (
          <DataClassificationForm
            applicationFormData={applicationFormData}
            setApplicationFormData={setApplicationFormData}
            applicationFormErrors={applicationFormErrors}
          />
        );
      case 2:
        return (
          <SplunkDetailsForm
            applicationFormData={applicationFormData}
            setApplicationFormData={setApplicationFormData}
            applicationFormErrors={applicationFormErrors}
          />
        );
      case 3:
        return (
          <FinanceDetailsForm
            applicationFormData={applicationFormData}
            setApplicationFormData={setApplicationFormData}
            applicationFormErrors={applicationFormErrors}
          />
        );
      case 4:
        return (
          <TermsAndConditionForm
            applicationFormData={applicationFormData}
            setApplicationFormData={setApplicationFormData}
            applicationFormErrors={applicationFormErrors}
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
            {/* <Info totalPrice={activeStepId >= 4 ? '$144.97' : '$134.98'} /> */}
            <Info
              totalCost={calculateCost()}
              applicationFormData={applicationFormData}
            >

            </Info>
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
