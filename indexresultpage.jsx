import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Message from '@splunk/react-ui/Message';
import Button from '@splunk/react-ui/Button';
import Link from '@splunk/react-ui/Link';
import ColumnLayout from '@splunk/react-ui/ColumnLayout';
import ChevronLeft from '@splunk/react-icons/ChevronLeft';

export default function IndexCreateResultPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // Fallback if user refreshes or hits URL directly
  if (!state) {
    return (
      <Message type="error">
        Invalid navigation state. Please submit a new request.
      </Message>
    );
  }

  const {
    status,           // 'success' | 'error'
    requestNumber,
    message,
    mrInfo,           // { url, iid, title }
  } = state;

  return (
    <ColumnLayout style={{ padding: '32px' }}>
      <ColumnLayout.Row>
        <ColumnLayout.Column span={8}>

          {/* Step 1: Status */}
          <Message type={status === 'success' ? 'success' : 'error'}>
            <strong>{status === 'success' ? 'Request Submitted' : 'Submission Failed'}</strong>
            <div style={{ marginTop: 8 }}>
              {message}
            </div>
            {requestNumber && (
              <div style={{ marginTop: 8 }}>
                Request Number: <strong>{requestNumber}</strong>
              </div>
            )}
          </Message>

          {/* Step 2: Git PR */}
          {status === 'success' && mrInfo?.url && (
            <div style={{ marginTop: 24 }}>
              <Message type="info">
                <strong>GitLab Merge Request</strong>
                <div style={{ marginTop: 8 }}>
                  <Link to={mrInfo.url} target="_blank">
                    {mrInfo.title || `MR !${mrInfo.iid}`}
                  </Link>
                </div>
              </Message>
            </div>
          )}

          {/* CTA */}
          <div style={{ marginTop: 32 }}>
            <Button
              icon={<ChevronLeft />}
              appearance="primary"
              onClick={() => navigate('/splunk/index/create')}
            >
              Create Another Index
            </Button>
          </div>

        </ColumnLayout.Column>
      </ColumnLayout.Row>
    </ColumnLayout>
  );
}
