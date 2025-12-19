import React, { useEffect, useState } from 'react';
import Button from '@splunk/react-ui/Button';
import Text from '@splunk/react-ui/Text';
import Heading from '@splunk/react-ui/Heading';
import WaitSpinner from '@splunk/react-ui/WaitSpinner';
import Message from '@splunk/react-ui/Message';

import { getFormKey } from '@splunk/splunk-utils/config';

/**
 * splunkd helper
 * - Uses Splunk Web proxy
 * - Adds CSRF token for mutating requests
 * - Uses x-www-form-urlencoded (required by Splunkd)
 */
async function splunkd(method, path, body) {
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (method !== 'GET') {
        headers['X-Splunk-Form-Key'] = getFormKey();
    }

    const res = await fetch(`splunkd/__raw${path}`, {
        method,
        headers,
        body,
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`${method} ${path} -> ${res.status}: ${errText}`);
    }

    return res.text();
}

export default function ClusterMapping() {
    // Splunk namespace
    const owner = 'nobody';
    const app = 'splunk-self-service-app';

    // REAL config file name (gitlab_config_handler.conf)
    const confFile = 'gitlab_config_handler';

    // Form state
    const [clusterKey, setClusterKey] = useState('');
    const [url, setUrl] = useState('');
    const [projectId, setProjectId] = useState('');
    const [realm, setRealm] = useState('gitlab');
    const [name, setName] = useState('');

    // UI state
    const [rowsXml, setRowsXml] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);

    /**
     * Fetch all stanzas
     */
    const listStanzas = async () => {
        setLoading(true);
        setMsg(null);

        try {
            const xml = await splunkd(
                'GET',
                `/servicesNS/${owner}/${app}/configs/conf-${confFile}`
            );
            setRowsXml(xml);
        } catch (e) {
            setMsg({ type: 'error', text: e.message });
        } finally {
            setLoading(false);
        }
    };

    /**
     * Create / update stanza
     */
    const upsertStanza = async () => {
        const ck = clusterKey.trim();
        if (!ck) {
            setMsg({ type: 'error', text: 'Cluster Key is required.' });
            return;
        }

        setLoading(true);
        setMsg(null);

        try {
            const form = new URLSearchParams();
            form.set('url', url.trim());
            form.set('project_id', projectId.trim());
            form.set('realm', realm.trim());
            form.set('name', name.trim());

            // Used later by backend when storing secrets
            form.set('owner', owner);
            form.set('app_scope', app);

            await splunkd(
                'POST',
                `/servicesNS/${owner}/${app}/configs/conf-${confFile}/${encodeURIComponent(ck)}`,
                form
            );

            setMsg({ type: 'success', text: `Stanza [${ck}] saved successfully.` });

            // Refresh list
            await listStanzas();
        } catch (e) {
            setMsg({ type: 'error', text: e.message });
        } finally {
            setLoading(false);
        }
    };

    /**
     * Initial load
     */
    useEffect(() => {
        listStanzas().catch(() => {});
    }, []);

    return (
        <div style={{ padding: 16 }}>
            <Heading level={2}>Cluster → GitLab Mapping</Heading>

            <p>
                Create or update mappings stored in
                <code> gitlab_config_handler.conf </code>
                (non-secret values only).
            </p>

            {msg && (
                <Message type={msg.type} style={{ marginBottom: 12 }}>
                    {msg.text}
                </Message>
            )}

            {/* Form */}
            <div
                style={{
                    display: 'grid',
                    gap: 12,
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    maxWidth: 900,
                }}
            >
                <Text
                    label="Cluster Key"
                    value={clusterKey}
                    onChange={(e, { value }) => setClusterKey(value)}
                />

                <Text
                    label="GitLab URL"
                    value={url}
                    onChange={(e, { value }) => setUrl(value)}
                    placeholder="https://gitlab.example.com"
                />

                <Text
                    label="GitLab Project ID"
                    value={projectId}
                    onChange={(e, { value }) => setProjectId(value)}
                />

                <Text
                    label="Display Name"
                    value={name}
                    onChange={(e, { value }) => setName(value)}
                />

                <Text
                    label="Realm"
                    value={realm}
                    onChange={(e, { value }) => setRealm(value)}
                />

                <div style={{ alignSelf: 'end' }}>
                    <Button
                        appearance="primary"
                        onClick={upsertStanza}
                        disabled={
                            loading ||
                            !clusterKey.trim() ||
                            !url.trim() ||
                            !projectId.trim() ||
                            !name.trim()
                        }
                    >
                        Save
                    </Button>
                </div>
            </div>

            {/* Output */}
            <Heading level={3} style={{ marginTop: 32 }}>
                Current stanzas (raw XML)
            </Heading>

            {loading ? (
                <WaitSpinner />
            ) : (
                <pre
                    style={{
                        background: '#f7f7f7',
                        padding: 12,
                        maxHeight: 400,
                        overflow: 'auto',
                        borderRadius: 4,
                    }}
                >
                    {rowsXml || 'No data'}
                </pre>
            )}
        </div>
    );
}
