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

const steps = ['Application Details', 'Data Classification', 'Splunk Details', 'Terms & Conditions'];

function getStepContent(step,applicationFormData, setApplicationFormData,applicationFormErrors) {
  switch (step) {
    case 0:
      return <ApplicationDetailsForm
        applicationFormData={applicationFormData}
        setApplicationFormData={setApplicationFormData}
        applicationFormErrors={applicationFormErrors}
      />;
    case 1:
      return <DataClassificationForm 
      formapplicationFormDataData={applicationFormData} 
      setApplicationFormData={setApplicationFormData} 
      />;
    case 2:
      return <SplunkDetailsForm 
      applicationFormData={applicationFormData} 
      setApplicationFormData={setApplicationFormData} 
      />;
    case 3:
      return <TermsAndConditionForm 
      applicationFormData={applicationFormData} 
      setApplicationFormData={setApplicationFormData} 
      />;
    default:
      return <div>Unknown step</div>;
  }
}

export default function SplunkRestAPIAccess() {

  const [applicationFormData, setApplicationFormData ] = useState({
      businessJustification:'',
      appID: '',
      dataOwner: '',
      techContact: '',
      supportContact: '',
      currentUser:'',
      businessJustification:''
    });

  const [activeStepId, setActiveStepId] = useState(0);
  const numSteps = steps.length;
  const [applicationFormErrors, setApplicationFormErrors] = useState({});

  const handlePrevious = useCallback(() => {
    setActiveStepId((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleNext = useCallback(() => {
    if (activeStepId === 0) {
      console.log("I am in Step 1");
      if (validateApplicationDetailsStep()) {
        setActiveStepId((prev) => Math.min(prev + 1, numSteps - 1));
      }
    }
    

  }, [numSteps]);

  const validateApplicationDetailsStep = () => {
    const newErrors={};
      if (!applicationFormData.appID) newErrors.appID = 'Application is Required';
      if (!applicationFormData.businessJustification) newErrors.businessJustification = 'Business Justification is Required'
      if (!applicationFormData.techContact) newErrors.techContact = 'Technical Contact is Mandatory' 
      if (!applicationFormData.supportContact) newErrors.supportContact = 'SupportContact Contact is Mandatory' 
      setApplicationFormErrors(newErrors);
      return Object.keys(newErrors).length === 0; // Valid if no errors
    };


  const LeftColumnStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        paddingTop: '128px',
        paddingLeft: '80px',
        paddingRight: '0px',
        gap: '16px',
        borderRadius: '8px',
        
  };
   
  const RightColumnStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        paddingTop: '128px',
        paddingLeft: '80px',
        paddingRight: '0px',
        gap: '16px',
        borderRadius: '8px'
    };

  return (
   
      <ColumnLayout columns={2}  divider="vertical">
        <ColumnLayout.Row>
          {/* Left Column: Icon + Cost Summary */}
          <ColumnLayout.Column span={3} style={LeftColumnStyle}>
            
              <Icon icon="TelstraIcon" props={{ height: '50px', width: '50px' }} />
              <div style={{ marginTop: '24px' }}>
                <Info totalPrice={activeStepId >= 4 ? '$144.97' : '$134.98'} />
              </div>
           
          </ColumnLayout.Column>

          {/* Right Column: StepBar + Form + Navigation */}
          <ColumnLayout.Column span={8} style={RightColumnStyle}>
            <div style={{ borderRadius: '8px' }}>
              <StepBar activeStepId={activeStepId}>
                {steps.map((label) => (
                  <StepBar.Step key={label}>{label}</StepBar.Step>
                ))}
              </StepBar>

              <div style={{ marginTop: '24px' }}>{getStepContent(activeStepId,applicationFormData,setApplicationFormData,applicationFormErrors)}</div>

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
                  onClick={activeStepId < numSteps - 1 ? handleNext : undefined}
                >
                  {activeStepId < numSteps - 1 ? 'Next' : 'Done'}
                </Button>
              </div>
            </div>
          </ColumnLayout.Column>
        </ColumnLayout.Row>
      </ColumnLayout>
   
  );
}
