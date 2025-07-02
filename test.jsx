import React, { useState } from 'react';
import {
  Box,
  Button,
  Stepper,
  Step,
  StepLabel,
  CssBaseline,
  Typography
} from '@mui/material';
import Step1YourInfo from '../components/ApiAccessPage/TermsAndConditionForm';
import ApplicationDetailsForm from '../components/ApiAccessPage/ApplicationDetailsForm';
import DataClassificationForm from '../components/ApiAccessPage/DataClassificationForm';
import SplunkDetailsForm from '../components/ApiAccessPage/SplunkDetailsForm';
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import ColumnLayout from '@splunk/react-ui/ColumnLayout';
import TelstraIcon from '../components/ApiAccessPage/CustomLogo';

const steps = ['Application Details', 'Data Classification', 'Splunk Details', 'Terms & Conditions'];

function getStepContent(step) {
  switch (step) {
    case 0:
      return <ApplicationDetailsForm />;
    case 1:
      return <DataClassificationForm />;
    case 2:
      return <SplunkDetailsForm />;
    case 3:
      return <Step1YourInfo />;
    default:
      return <div>Unknown step</div>;
  }
}

// Placeholder for the color dropdown
const ColorModeIconDropdown = () => <Box>Color Mode</Box>;

// Placeholder for Info component
const Info = ({ totalPrice }) => (
  <Box>
    <Typography variant="body1">Total Price: {totalPrice}</Typography>
  </Box>
);

export default function SplunkRestAPIAccess() {
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    if (activeStep < steps.length - 1) setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (activeStep > 0) setActiveStep((prev) => prev - 1);
  };

  return (
    <>
      <CssBaseline />
      <Box sx={{ position: 'fixed', top: '1rem', right: '1rem' }}>
        <ColorModeIconDropdown />
      </Box>

      <ColumnLayout gutter="wide">
        <ColumnLayout.Row>
          <ColumnLayout.Column>
            {/* Sidebar / Info Section */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'background.paper',
                borderRight: '1px solid',
                borderColor: 'divider',
                alignItems: 'start',
                pt: 8,
                px: 4,
                gap: 2
              }}
            >
              {/* <TelstraIcon /> */}
              <Info totalPrice={activeStep >= 2 ? "$144.97" : "$134.98"} />
            </Box>
          </ColumnLayout.Column>

          <ColumnLayout.Column>
            {/* Main Form Section */}
            <Box sx={{ px: 4, py: 6 }}>
              <Stepper activeStep={activeStep} alternativeLabel>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              <Box sx={{ mt: 4 }}>{getStepContent(activeStep)}</Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  startIcon={<ChevronLeftRoundedIcon />}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ChevronRightRoundedIcon />}
                >
                  {activeStep === steps.length - 1 ? 'Submit' : 'Next'}
                </Button>
              </Box>
            </Box>
          </ColumnLayout.Column>
        </ColumnLayout.Row>
      </ColumnLayout>
    </>
  );
}
