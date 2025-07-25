import React, { useCallback } from 'react';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import List from '@splunk/react-ui/List';
import Paragraph from '@splunk/react-ui/Paragraph';
import Switch from '@splunk/react-ui/Switch';

export default function TermsAndConditionForm({
  applicationFormData,
  setApplicationFormData,
  applicationFormErrors = {},
}) {


    const handleSwitchClick = useCallback(() => {
        setApplicationFormData((prev,current) => ({...prev,termsAccepted: !current}));
    }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <ControlGroup label="Splunk Terms and Condition">
        <Paragraph style={{ width: 600 }}>
          <List ordered>
            <List.Item>By submitting this engagement request you are agreeing to the Terms and Conditions listed below:</List.Item>
            <List.Item>The data is dependent on provider systems from which the data is sourced and therefore the quality and content cannot be guaranteed.</List.Item>
            <List.Item>
              As a Consumer of the data, you are responsible for the security compliance and governance of the data once it has been retrieved from the ONESPLUNK API. This includes adherence to any security compliance related to PII and Telstra Confidential data i.e., encryption, security approvals etc. If you are querying an index with PI data then any relevant CRO/Security compliance artefacts are attached to this request.
            </List.Item>
            <List.Item>The ONESPLUNK team are not the data Subject Matter Experts. If you have questions regarding the data, please contact the Data Owner directly. Refer to the asset registry for details of the Splunk index data owner.</List.Item>
            <List.Item>Any communications made by the ONESPLUNK team to consumers will be done via email using the details provided by the consumer system. Please ensure they are accurate and up-to-date. It is the consumer's responsibility to inform the ONESPLUNK team if these details change.</List.Item>
            <List.Item>Regular checks will be undertaken to ensure compliance is adhered to. If it is determined that the agreement has been violated, then consumer access will be immediately revoked.</List.Item>
            <List.Item>Any ONESPLUNK Support provided will be as per the support details on the Service Details page.</List.Item>
            <List.Item>The funding code provided is valid and will remain open for 3 months.</List.Item>
            <List.Item>Consumers will use a separate Robot Id for each query executed on a separate index.</List.Item>
            <List.Item>Where you have provided a custom search query in the submission because you are aware you will not be complying with the default search conditions stipulated above, you are acknowledging that the custom query must be reviewed and accepted by the Splunk team before your request can progress.</List.Item>
            <List.Item>When sending a search request to the API, you are agreeing to the known limitations listed below in relation to this service.</List.Item>
          </List>
        </Paragraph>
      </ControlGroup>

      <ControlGroup label="Confirmation">
        <Switch
          value={applicationFormData?.termsAccepted}
          onClick={handleSwitchClick}
          selected={applicationFormData?.termsAccepted }
          appearance="checkbox"
          error={applicationFormErrors?.termsAccepted}
          
        >
          I have read and accept the Terms and Conditions.
        </Switch>
      </ControlGroup>
    </div>
  );
}
