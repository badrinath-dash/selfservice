
import React, { useEffect, useState } from 'react';
import ColumnLayout from '@splunk/react-ui/ColumnLayout';
import Button from '@splunk/react-ui/Button';
import Text from '@splunk/react-ui/Text';
import Heading from '@splunk/react-ui/Heading';
import Table from '@splunk/react-ui/Table';


import WaitSpinner from '@splunk/react-ui/WaitSpinner';
import Message from '@splunk/react-ui/Message';

/**
 * Minimal helper for calling Splunkd via Splunk Web proxy.
 * Uses application/x-www-form-urlencoded to match Splunk management endpoints.
 */


async function splunkd(method, path, body) {
  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
  const res = await fetch(`splunkd/__raw${path}`, { method, headers, body });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${method} ${path} -> ${res.status} ${errText}`);
  }
  return res.text();
}

export default function ClusterMapping() {
  const owner = 'nobody';
  const app = 'splunk-self-service-app';
  const confFile = 'conf-gitlab_config_handler';

  const [clusterKey, setClusterKey] = useState('');
  const [url, setUrl] = useState('');
  const [projectId, setProjectId] = useState('');
  const [realm, setRealm] = useState('gitlab');
  const [name, setName] = useState('');
  const [rowsXml, setRowsXml] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const listStanzas = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const xml = await splunkd('GET', `/servicesNS/${owner}/${app}/configs/${confFile}`);
      setRowsXml(xml);
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const upsertStanza = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const ck = clusterKey.trim();
      const form = new URLSearchParams();
      form.set('url', url.trim());
      form.set('project_id', projectId.trim());
      form.set('realm', realm.trim());
      form.set('name', name.trim());
      form.set('owner', owner);      // namespace for passwords
      form.set('app_scope', app);    // app for passwords.conf entries
      await splunkd('POST', `/servicesNS/${owner}/${app}/configs/conf-${confFile}/${encodeURIComponent(ck)}`, form);
      setMsg({ type: 'success', text: `Stanza [${ck}] saved.` });
      await listStanzas();
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { listStanzas().catch(() => {}); }, []);

  return (
    <div style={{ padding: 16 }}>
      <Heading level={2}>Cluster → GitLab Mapping</Heading>
      <p>Create/update mapping stanzas stored in <code>gitlab_handler.conf</code> (non‑secrets only).</p>

      {msg && (
        <Message type={msg.type} style={{ marginBottom: 8 }}>
          {msg.text}
        </Message>
      )}

      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(3, 1fr)' }}>
       
        <Text label="GitLab URL">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://gitlab.example.com" />
        </Text>
        
        <div>
          <Button
            appearance="primary"
            disabled={!clusterKey.trim() || !url.trim() || !projectId.trim() || !name.trim()}
            onClick={upsertStanza}
          >
            Save
          </Button>
        </div>
      </div>

      <Heading level={3} style={{ marginTop: 24 }}>Current stanzas (XML)</Heading>
      {loading ? <WaitSpinner /> : (
        <pre style={{ background: '#f7f7f7', padding: 12, overflow: 'auto' }}>
          {rowsXml}
        </pre>
      )}
    </div>
  );
}

