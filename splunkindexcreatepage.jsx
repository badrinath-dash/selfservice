import React, { useState, useCallback, useMemo } from 'react';
import ColumnLayout from '@splunk/react-ui/ColumnLayout';
import Button from '@splunk/react-ui/Button';
import StepBar from '@splunk/react-ui/StepBar';
import ChevronLeft from '@splunk/react-icons/ChevronLeft';
import ChevronRight from '@splunk/react-icons/ChevronRight';
import ApplicationDetailsForm from '../components/IndexCreationPage/ApplicationDetailsForm';
import SplunkDetailsForm from '../components/IndexCreationPage/IndexCreateForm';
import IndexConfigGenerator from '../components/IndexCreationPage/GenerateSplunkIndexConfig';
import GenerateConfigAndRoles from '../components/IndexCreationPage/GenerateRoleMappingIndexConfig';
import GenerateAGSMapping from '../components/IndexCreationPage/GenerateAGSConfig';
import GenerateReviewPage from '../components/IndexCreationPage/Review';
import Info from '../components/IndexCreationPage/IndexCostInfo';
import Icon from '../components/Icon';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import { insertKVStore } from '../../utils/common/ManageKVStore';
import { commitIndexStanzaToGitLab } from '../common/ManageGitLabCommit';

const steps = [
  'Application Details',
  'Index Details',
  'Generate Index Config',
  'Generate Role Mapping',
  'Generate AGS Config',
  'Review and Submit',
];

const LEFT_COLUMN_SPAN = 3;
const RIGHT_COLUMN_SPAN = 9;

export default function SplunkIndexCreatePage() {
  const [activeStepId, setActiveStepId] = useState(0);
  const numSteps = steps.length;
  const [totalCost, setTotalCost] = useState(0);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info'); // 'info' | 'success' | 'error'

  const [indexCreateFormData, setIndexCreateFormData] = useState({
    applicationName: '',
    currentUser: '',
    appID: '',
    dataOwner: '',
    dataOwnerUserId: '',
    targetIndexCluster: '',
    dataOriginDomain: '',
    splunkEngagementRequestNumber: '',
    dataIngestionPerDayMB: '',
    splunkDataRetention: '',
    indexNameProposed: '',
    indexConfigStanza: '',
    globalIndexFlag: '',
    indexNameExtraSegment: '',
    authenticationMappingConfig: '',
    authorizeConfig: '',
    adGroupNameProposed: '',
    AGSSecondLevelApprover: '',
    AGSSecondLevelBackupApprover: '',
    AGSThirdLevelApprover: '',
    agsMappingEnabled: '',
    AGSThirdLevelBackupApprover: '',
    indexClusterRepo: '',
    agsMappingConfig: ''
  });

  const [indexCreateFormErrors, setIndexCreateFormErrors] = useState({});
  const [mrInfo, setMrInfo] = useState(null); // { url, iid, title }
  const [indexNameComputed, setIndexNameComputed] = useState('');
  const [indexNameValidation, setIndexNameValidation] = useState({
    status: null, // 'invalid' | 'loading' | 'available' | 'exists' | 'network-error' | null
    loading: false,
  });

  /** ✅ Reusable field update handler (stable) */
  const handleApplicationFormChange = useCallback((field, value) => {
    setIndexCreateFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // ---------- PURE GATES (no setState inside these) ----------
  // Step 0: Application Details gate — require key fields present
  const canGoNextFromApplication = useMemo(() => {
    return Boolean(
      indexCreateFormData.appID &&
      indexCreateFormData.currentUser &&
      indexCreateFormData.applicationName
    );
  }, [
    indexCreateFormData.appID,
    indexCreateFormData.currentUser,
    indexCreateFormData.applicationName,
  ]);

  // Step 1: Index Details gate — require all fields present
  const canGoNextFromIndexDetails = useMemo(() => {
    return Boolean(
      indexCreateFormData.targetIndexCluster &&
      indexCreateFormData.dataOriginDomain &&
      indexCreateFormData.splunkEngagementRequestNumber &&
      indexCreateFormData.dataIngestionPerDayMB &&
      indexCreateFormData.splunkDataRetention &&
      typeof indexCreateFormData.globalIndexFlag !== 'undefined' &&
      indexCreateFormData.globalIndexFlag !== ''
    );
  }, [
    indexCreateFormData.targetIndexCluster,
    indexCreateFormData.dataOriginDomain,
    indexCreateFormData.splunkEngagementRequestNumber,
    indexCreateFormData.dataIngestionPerDayMB,
    indexCreateFormData.splunkDataRetention,
    indexCreateFormData.globalIndexFlag,
  ]);

  // Step 2: Name validation gate — require child validation to be 'available'
  const canGoNextFromNameValidation = useMemo(() => {
    return (
      indexNameValidation.status === 'available' &&
      !indexNameValidation.loading &&
      !!indexNameComputed
    );
  }, [indexNameValidation.status, indexNameValidation.loading, indexNameComputed]);

  // Step 3: Generate Config gate — require indexConfigStanza to be present
  const canGoNextFromGenerateConfig = useMemo(() => {
    const hasStanza = !!(indexCreateFormData.indexConfigStanza?.trim());
    const hasRoles = !!(indexCreateFormData.authorizeConfig?.trim());
    return hasStanza && hasRoles;
  }, [
    indexCreateFormData.indexConfigStanza,
    indexCreateFormData.authorizeConfig,
  ]);

  // Step 4: Generate AGS Config 
  const canGoNextFromAGSConfig = useMemo(() => {
    const wantsAGS = !!indexCreateFormData.agsMappingEnabled;
    const hasAGS = !!indexCreateFormData.agsMappingConfig?.trim();

    return wantsAGS ? hasAGS : true;
  }, [
    indexCreateFormData.agsMappingEnabled,
    indexCreateFormData.agsMappingConfig,
  ]);
  
  const nextDisabled = useMemo(() => {
    // Disable while submitting
    if (isSubmitting) return true;

    switch (activeStepId) {
      case 0: return !canGoNextFromApplication;
      case 1: return !canGoNextFromIndexDetails;
      case 2: return !canGoNextFromNameValidation;
      case 3: return !canGoNextFromGenerateConfig;
      case 4: return !canGoNextFromAGSConfig;
      case 5: return false; // Review & Submit has no extra gate
      default: return false;
    }
  }, [
    activeStepId,
    isSubmitting,
    canGoNextFromApplication,
    canGoNextFromIndexDetails,
    canGoNextFromNameValidation,
    canGoNextFromGenerateConfig,
    canGoNextFromAGSConfig,
  ]);

  // ---------- Click-time validators (CAN set state / errors) ----------
  const validateApplicationDetailsStep = useCallback(() => {
    const newErrors = {};

    if (!indexCreateFormData.appID) {
      newErrors.appID = 'Application ID is required. Please select from the dropdown.';
    }
    if (!indexCreateFormData.currentUser) {
      newErrors.currentUser = 'Failed to get current user details. Please refresh the page.';
    }
    if (!indexCreateFormData.applicationName) {
      newErrors.applicationName = 'Application Name is required.';
    }

    setIndexCreateFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [indexCreateFormData]);

  const validateIndexDetailsForm = useCallback(() => {
    const newErrors = {};

    if (!indexCreateFormData.targetIndexCluster) {
      newErrors.targetIndexCluster = 'Please select the Target Index Cluster.';
    }
    if (!indexCreateFormData.dataOriginDomain) {
      newErrors.dataOriginDomain = 'Please select Origin Data Domain.';
    }
    if (!indexCreateFormData.splunkEngagementRequestNumber) {
      newErrors.splunkEngagementRequestNumber = 'Splunk Engagement Request Number is mandatory.';
    }
    if (!indexCreateFormData.dataIngestionPerDayMB) {
      newErrors.dataIngestionPerDayMB = 'Please specify Data ingestion per day (MB).';
    }
    if (!indexCreateFormData.splunkDataRetention) {
      newErrors.splunkDataRetention = 'Please specify Data Retention (days).';
    }
    if (indexCreateFormData.globalIndexFlag === '' || typeof indexCreateFormData.globalIndexFlag === 'undefined') {
      newErrors.globalIndexFlag = 'Please specify whether this is a Global Index.';
    }
    setIndexCreateFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [indexCreateFormData]);

  // ---------- Navigation handlers ----------
  const handlePrevious = useCallback(() => {
    setActiveStepId((prev) => Math.max(prev - 1, 0));
    setMessage('');
    setMessageType('info');
  }, []);

  const buildPayload = useCallback(() => ({
    _key: indexCreateFormData.indexNameProposed,
    applicationName: indexCreateFormData.applicationName,
    appID: indexCreateFormData.appID,
    requestedBy: indexCreateFormData.currentUser,
    targetIndexCluster: indexCreateFormData.targetIndexCluster,
    dataOriginDomain: indexCreateFormData.dataOriginDomain,
    splunkEngagementRequestNumber: indexCreateFormData.splunkEngagementRequestNumber,
    dataIngestionPerDayMB: Number(indexCreateFormData.dataIngestionPerDayMB),
    splunkDataRetention: Number(indexCreateFormData.splunkDataRetention),
    globalIndexFlag: indexCreateFormData.globalIndexFlag,
    indexNameProposed: indexCreateFormData.indexNameProposed,
    indexNameExtraSegment: indexCreateFormData.indexNameExtraSegment,
    indexConfigStanza: indexCreateFormData.indexConfigStanza,
    authorizeConfig: indexCreateFormData.authorizeConfig,
    authenticationMappingConfig: indexCreateFormData.authenticationMappingConfig,
    agsMappingEnabled: !!indexCreateFormData.agsMappingEnabled,
    agsMappingConfig: indexCreateFormData.agsMappingConfig,
    adGroupNameProposed: indexCreateFormData.adGroupNameProposed,
    AGSSecondLevelApprover: indexCreateFormData.AGSSecondLevelApprover,
    AGSSecondLevelBackupApprover: indexCreateFormData.AGSSecondLevelBackupApprover,
    AGSThirdLevelApprover: indexCreateFormData.AGSThirdLevelApprover,
    AGSThirdLevelBackupApprover: indexCreateFormData.AGSThirdLevelBackupApprover,
    indexClusterRepo: indexCreateFormData.indexClusterRepo,
    submittedAt: new Date().toISOString(),
    totalCost,
  }), [indexCreateFormData, totalCost]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setMessage('Submitting request...');
    setMessageType('info');

    try {
      // Step 1: Save to KV Store
      const payload = buildPayload();
      await insertKVStore(
        'selfservice_index_details_collection',
        '',
        payload,
        'Failed to store request in KV Store'
      );
      
      setMessage('Request saved. Creating GitLab merge request...');
      setMessageType('info');

      // Step 2: Create GitLab MR
      const gitPayload = {
        indexName: indexCreateFormData.indexNameProposed,
        appId: indexCreateFormData.appID,
        stanzaContent: indexCreateFormData.indexConfigStanza,
        authorName: indexCreateFormData.currentUser,
        authorEmail: `${indexCreateFormData.currentUser}@yourcompany.com`, // Update domain as needed
        branch: `feature/add-index-${indexCreateFormData.splunkEngagementRequestNumber}`,
        labels: ['index', 'splunk'],
      };

      const gitRes = await commitIndexStanzaToGitLab(gitPayload, {
        timeoutMs: 20000,
        maxRetries: 3,
        onDebug: (info) => console.debug('GitLab commit:', info),
      });

      const mr = gitRes?.payload?.mergeRequest;
      if (mr?.url) {
        setMrInfo({ url: mr.url, iid: mr.iid, title: mr.title });
        setMessage(`Success! Merge request created. Redirecting to GitLab...`);
        setMessageType('success');
        
        // Redirect after 3 seconds
        setTimeout(() => {
          window.location.href = mr.url;
        }, 3000);
      } else {
        setMessage('Request saved successfully, but GitLab MR URL not returned. Please check GitLab manually.');
        setMessageType('success');
      }
    } catch (error) {
      console.error('Submit failed:', error);
      
      // Provide specific error context
      let errorMsg = 'Submission failed. ';
      if (error.name === 'GitLabCommitError') {
        errorMsg += `GitLab error (${error.status}): ${error.message}`;
      } else if (error.name === 'TimeoutError') {
        errorMsg += 'Request timed out. Please try again.';
      } else {
        errorMsg += error?.message || 'Unknown error occurred.';
      }
      
      setMessage(errorMsg);
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, buildPayload, indexCreateFormData]);

  const handleNext = useCallback(() => {
    let isValid = true;
    
    // Click-time validation only
    switch (activeStepId) {
      case 0:
        isValid = validateApplicationDetailsStep();
        break;
      case 1:
        isValid = validateIndexDetailsForm();
        break;
      case 2:
        isValid = canGoNextFromNameValidation;
        break;
      case 3:
        isValid = canGoNextFromGenerateConfig;
        break;
      case 4:
        isValid = canGoNextFromAGSConfig;
        break;
      default:
        break;
    }

    if (!isValid) {
      setMessage('Please complete all required fields before continuing.');
      setMessageType('error');
      return;
    }

    // Clear errors and messages on successful validation
    setIndexCreateFormErrors({});
    setMessage('');
    setMessageType('info');

    if (activeStepId < numSteps - 1) {
      setActiveStepId((prev) => Math.min(prev + 1, numSteps - 1));
    } else {
      handleSubmit();
    }
  }, [
    activeStepId,
    numSteps,
    validateApplicationDetailsStep,
    validateIndexDetailsForm,
    canGoNextFromNameValidation,
    canGoNextFromGenerateConfig,
    canGoNextFromAGSConfig,
    handleSubmit,
  ]);

  // ---------- Step content renderer ----------
  function getStepContent(step) {
    switch (step) {
      case 0:
        return (
          <ApplicationDetailsForm
            indexCreateFormData={indexCreateFormData}
            setIndexCreateFormData={setIndexCreateFormData}
            indexCreateFormErrors={indexCreateFormErrors}
          />
        );
      case 1:
        return (
          <SplunkDetailsForm
            indexCreateFormData={indexCreateFormData}
            setIndexCreateFormData={setIndexCreateFormData}
            indexCreateFormErrors={indexCreateFormErrors}
            handleApplicationFormChange={handleApplicationFormChange}
          />
        );
      case 2:
        return (
          <IndexConfigGenerator
            mode="name"
            indexCreateFormData={indexCreateFormData}
            setIndexCreateFormData={setIndexCreateFormData}
            indexCreateFormErrors={indexCreateFormErrors}
            onIndexNameComputed={(name) => {
              setIndexNameComputed(name);
              setIndexCreateFormData((prev) => ({ ...prev, indexNameProposed: name }));
            }}
            onValidationChange={({ status, loading }) => {
              setIndexNameValidation({ status, loading });
            }}
          />
        );
      case 3:
        return (
          <GenerateConfigAndRoles
            indexCreateFormData={indexCreateFormData}
            setIndexCreateFormData={setIndexCreateFormData}
          />
        );
      case 4:
        return (
          <GenerateAGSMapping
            indexCreateFormData={indexCreateFormData}
            setIndexCreateFormData={setIndexCreateFormData}
          />
        );
      case 5:
        return (
          <GenerateReviewPage
            indexCreateFormData={indexCreateFormData}
            totalCost={totalCost}
            mrInfo={mrInfo}
          />
        );
      default:
        return <div>Unknown step</div>;
    }
  }

  // ---------- Styles ----------
  const LeftColumnStyle = { 
    display: 'flex', 
    flexDirection: 'column', 
    padding: '24px', 
    boxSizing: 'border-box' 
  };
  
  const RightColumnStyle = { 
    display: 'flex', 
    flexDirection: 'column', 
    padding: '24px', 
    boxSizing: 'border-box' 
  };

  const getMessageStyle = () => {
    const baseStyle = {
      padding: '12px 16px',
      borderRadius: '4px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    };

    switch (messageType) {
      case 'success':
        return {
          ...baseStyle,
          background: '#e8f5e9',
          border: '1px solid #4caf50',
          color: '#2e7d32',
        };
      case 'error':
        return {
          ...baseStyle,
          background: '#ffebee',
          border: '1px solid #f44336',
          color: '#c62828',
        };
      default:
        return {
          ...baseStyle,
          background: '#e3f2fd',
          border: '1px solid #2196f3',
          color: '#1565c0',
        };
    }
  };

  return (
    <div>
      <ColumnLayout divider="vertical" style={{ width: '100%', height: '100%' }}>
        <ColumnLayout.Row>
          {/* Left Column */}
          <ColumnLayout.Column span={LEFT_COLUMN_SPAN} style={LeftColumnStyle}>
            <Icon icon="TelstraIcon" props={{ height: '50px', width: '50px' }} />
            <div style={{ marginTop: '24px' }}>
              <Info indexCreateFormData={indexCreateFormData} onTotalCostChange={setTotalCost} />
            </div>
          </ColumnLayout.Column>

          {/* Right Column */}
          <ColumnLayout.Column span={RIGHT_COLUMN_SPAN} style={RightColumnStyle}>
            <StepBar activeStepId={activeStepId}>
              {steps.map((label) => (
                <StepBar.Step key={label}>{label}</StepBar.Step>
              ))}
            </StepBar>

            <div style={{ marginTop: '24px' }}>
              {/* Message Display */}
              {message && (
                <div style={getMessageStyle()}>
                  {isSubmitting && <span>⏳</span>}
                  <span>{message}</span>
                </div>
              )}

              {/* Step Content */}
              {getStepContent(activeStepId)}
            </div>

            {/* Navigation Buttons */}
            <div
              style={{
                marginTop: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <ControlGroup>
                <Button
                  icon={<ChevronLeft />}
                  appearance="primary"
                  disabled={activeStepId === 0 || isSubmitting}
                  onClick={handlePrevious}
                >
                  Previous
                </Button>
              </ControlGroup>

              <ControlGroup>
                <Button
                  icon={<ChevronRight />}
                  appearance="primary"
                  onClick={handleNext}
                  disabled={nextDisabled}
                >
                  {isSubmitting ? 'Submitting...' : activeStepId < numSteps - 1 ? 'Next' : 'Submit'}
                </Button>
              </ControlGroup>
            </div>
          </ColumnLayout.Column>
        </ColumnLayout.Row>
      </ColumnLayout>
    </div>
  );
}
