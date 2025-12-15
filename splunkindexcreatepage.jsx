
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
import GenerateReviewPage from '../components/IndexCreationPage/Review'
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

export default function SplunkIndexCreatePage() {
  const [activeStepId, setActiveStepId] = useState(0);
  const numSteps = steps.length;
  const [totalCost, setTotalCost] = useState(0);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    indexNameExtraSegment:'',
    authenticationMappingConfig:'',
    authorizeConfig:'',
    adGroupNameProposed:'',
    AGSSecondLevelApprover:'',
    AGSSecondLevelBackupApprover:'',
    AGSThirdLevelApprover:'',
    agsMappingEnabled:'',
    AGSThirdLevelBackupApprover:'',
    indexClusterRepo:'',
    agsMappingConfig:''

  });

  
 /** ✅ Reusable field update handler (stable) */
  const handleApplicationFormChange = useCallback((field, value) => {
    setIndexCreateFormData(prev => ({ ...prev, [field]: value }));
  }, []);


  const [indexCreateFormErrors, setIndexCreateFormErrors] = useState({});
  const [mrInfo, setMrInfo] = useState(null); // { url, iid, title }
  const [indexNameComputed, setIndexNameComputed] = useState('');
  const [indexNameValidation, setIndexNameValidation] = useState({
    status: null, // 'invalid' | 'loading' | 'available' | 'exists' | 'network-error' | null
    loading: false,
  });

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
    const hasRoles  = !!(indexCreateFormData.authorizeConfig?.trim());
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
  },[indexCreateFormData]);

  const ValidateIndexDetailsForm = useCallback(() => {
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
  },[indexCreateFormData]);

  0
  // Use handleNext to run validators (DO NOT run validators during render)
  const handlePrevious = useCallback(() => {
    setActiveStepId((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleNext = useCallback(() => {
    // Click-time validation only
    switch (activeStepId) {
      case 0:
        if (!validateApplicationDetailsStep()) return;
        break;
      case 1:
        if (!ValidateIndexDetailsForm()) return;
        break;
      case 2:
        // Gate is based on child validation (pure gate above)
        if (!canGoNextFromNameValidation) return;
        break;
      case 3:
        if (!canGoNextFromGenerateConfig) return;
        break;
      case 4:
        if (!canGoNextFromAGSConfig) return; 
        break;
      default:
        break;
    }

    if (activeStepId < numSteps - 1) {
      setActiveStepId((prev) => Math.min(prev + 1, numSteps - 1));
    } else {
      handleSubmit();
    }
  }, [
    activeStepId,
    numSteps,
    validateApplicationDetailsStep,
    ValidateIndexDetailsForm,
    canGoNextFromNameValidation,
    canGoNextFromGenerateConfig,
    canGoNextFromAGSConfig
    ]);

  
   const [message, setMessage] = useState('');

  
const buildPayload = () => ({
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
});



const handleSubmit = async () => {
  if (isSubmitting) return;
  setIsSubmitting(true);
  setMessage('');

  try {
    // 1) Persist the request in KV Store (your helper)
    const payload = buildPayload();
    const defaultErrorMsg = 'Failed to store request in KV Store';

    // If your insertKVStore throws on error, a simple await is enough:
    const kvRes = await insertKVStore(
      'selfservice_index_details_collection',
      '',           // empty key -> collection endpoint; payload contains _key already
      payload,
      defaultErrorMsg
    );
    setMessage('Request saved to KV Store.');
    const git_payload ={indexName: indexCreateFormData.indexNameProposed,
      appId: indexCreateFormData.appID,
      stanzaContent: indexCreateFormData.indexConfigStanza,
      authorName: indexCreateFormData.currentUser,
      authorEmail: 'indexCreateFormData.currentUser', 
      branch: `feature/add-index-${indexCreateFormData.splunkEngagementRequestNumber}`,
      labels: ['index', 'splunk'],};

    // 2) Commit the stanza & open MR in GitLab via Splunk Web proxy
    const gitRes = await commitIndexStanzaToGitLab(
      git_payload,
    {
      timeoutMs: 20000,
      maxRetries: 3,
      onDebug: (info) => console.debug('commitIndexStanzaToGitLab:', info),
    }
  );
;

    const mr = gitRes?.payload?.mergeRequest;
    if (mr?.url) {
      setMrInfo({ url: mr.url, iid: mr.iid, title: mr.title });
      setMessage(prev => `${prev} MR created: ${mr.url}`);
      alert(`Request stored & MR created: ${mr.url}`);
    } else {
      setMessage(prev => `${prev} (MR created, but no URL returned)`);
    }
  } catch (error) {
    console.error('Submit failed:', error);
    setMessage(`Error: ${error?.message || error}`);
  } finally {
    setIsSubmitting(false);
  }
};



  const LeftColumnStyle = { display: 'flex', flexDirection: 'column', padding: '24px', boxSizing: 'border-box' };
  const RightColumnStyle = { display: 'flex', flexDirection: 'column', padding: '24px', boxSizing: 'border-box' };

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
            handleApplicationFormChange= {handleApplicationFormChange}
          />
        );
      case 2:
        // Generate Name & Validate
        return (
          <IndexConfigGenerator
            mode="name" // optional: implement in your component
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
      default:
        return <div>Unknown step</div>;
    }
  }

  return (
    <div>
      <ColumnLayout divider="vertical" style={{ width: '100%', height: '100%' }}>
        <ColumnLayout.Row>
          {/* Left Column */}
          <ColumnLayout.Column span={3} style={LeftColumnStyle}>
            <Icon icon="TelstraIcon" props={{ height: '50px', width: '50px' }} />
            <div style={{ marginTop: '24px' }}>
              <Info indexCreateFormData={indexCreateFormData} onTotalCostChange={setTotalCost} />
            </div>
          </ColumnLayout.Column>

          {/* Right Column */}
          <ColumnLayout.Column span={9} style={RightColumnStyle}>
            <StepBar activeStepId={activeStepId}>
              {steps.map((label) => (
                <StepBar.Step key={label}>{label}</StepBar.Step>
              ))}
            </StepBar>

            <div style={{ marginTop: '24px' }}>{getStepContent(activeStepId)}</div>

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
                  disabled={activeStepId === 0}
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
                  {activeStepId < numSteps - 1 ? 'Next' : 'Submit'}
                </Button>
              </ControlGroup>
            </div>
          </ColumnLayout.Column>
        </ColumnLayout.Row>
      </ColumnLayout>
    </div>
  );
}
