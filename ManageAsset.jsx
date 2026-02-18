import React, { useState } from 'react';

import Button from '@splunk/react-ui/Button';
import Message from '@splunk/react-ui/Message';
import Text from '@splunk/react-ui/Text';
import RadioList from '@splunk/react-ui/RadioList';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import Date from '@splunk/react-ui/Date';
import TabBar from '@splunk/react-ui/TabBar';
import SplunkThemeProvider from '@splunk/themes/SplunkThemeProvider';
import Select from '@splunk/react-ui/Select';
import Multiselect from '@splunk/react-ui/Multiselect';
import Card from '@splunk/react-ui/Card';
import Heading from '@splunk/react-ui/Heading';
import FormRows from '@splunk/react-ui/FormRows';
import WaitSpinner from '@splunk/react-ui/WaitSpinner';
import P from '@splunk/react-ui/Paragraph';

// ... Keep your existing Custom Function imports here ...
// import { searchKVStore, updateKVStore } from '../common/ManageKVStore';
// import { DropDownData } from '../common/DropDownData';
// import getUserRoleDetails from '../common/GetUserDetails';

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------
const styles = {
    // Page shell
    pageWrapper: {
        minHeight: '100vh',
        padding: '0',
    },

    // Sticky top action bar
    actionBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 24px',
        borderBottom: '1px solid var(--color-border-light, rgba(255,255,255,0.12))',
        marginBottom: '0',
        background: 'var(--color-background-section, rgba(0,0,0,0.15))',
        backdropFilter: 'blur(4px)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
    },

    actionBarTitle: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },

    actionBarButtons: {
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
    },

    // Status badge
    statusBadge: (isActive) => ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '2px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '600',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        background: isActive ? 'rgba(76, 175, 80, 0.18)' : 'rgba(244, 67, 54, 0.18)',
        color: isActive ? '#66BB6A' : '#EF5350',
        border: `1px solid ${isActive ? 'rgba(76,175,80,0.35)' : 'rgba(244,67,54,0.35)'}`,
    }),

    statusDot: (isActive) => ({
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: isActive ? '#66BB6A' : '#EF5350',
        boxShadow: isActive ? '0 0 5px #66BB6A' : '0 0 5px #EF5350',
    }),

    // Tab content area
    tabContent: {
        padding: '28px 24px',
    },

    // Section card — wraps groups of related fields
    sectionCard: {
        background: 'var(--color-background-section-raised, rgba(255,255,255,0.04))',
        border: '1px solid var(--color-border-light, rgba(255,255,255,0.10))',
        borderRadius: '8px',
        padding: '20px 24px',
        marginBottom: '20px',
    },

    sectionTitle: {
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        opacity: 0.5,
        marginBottom: '16px',
        paddingBottom: '10px',
        borderBottom: '1px solid var(--color-border-light, rgba(255,255,255,0.08))',
    },

    // Two-column grid inside a section
    grid2: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '4px 28px',
    },

    // Full-width helper
    fullWidth: {
        gridColumn: '1 / -1',
    },

    // Inline field + button (e.g. Index Name + Check)
    inlineField: {
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-start',
    },

    // Notification banner area
    notificationArea: {
        padding: '0 24px',
        paddingTop: '16px',
    },

    // Loading overlay
    loadingWrapper: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '16px',
    },
};

// ---------------------------------------------------------------------------
// HELPER: Section wrapper with optional title
// ---------------------------------------------------------------------------
function Section({ title, children, style }) {
    return (
        <div style={{ ...styles.sectionCard, ...style }}>
            {title && <div style={styles.sectionTitle}>{title}</div>}
            {children}
        </div>
    );
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
function ManageAssetPage() {

    // -------------------------
    // STATE
    // -------------------------
    const [FormInputvalues, setFormInputValues] = useState({
        index_name: '',
        index_description: '',
        application_desc: '',
        index_type: 'event',
        index_created_date: '',
        ags_entitlement_name: '',
        ability_app_name: '',
        splunk_role_name: '',
        index_size_mb: '100',
        index_created_by: '',
        index_retention_period: '',
        pow_number: '',
        index_customer_segment: '',
        index_classification: '',
        index_cluster: [],
        addtn_documentation: [],
        addtn_contact: [],
        index_active: 'Y',
        avg_index_usage_mb: '0',
        index_used: 'Y',
    });

    const [activeTabId, setActiveTabId] = useState('overview');
    const [isLoading, setIsLoading] = useState(false);
    const [inputDisabled, setInputDisabled] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [infoMessage, setInfoMessage] = useState({ visible: false });
    const [formErrors, setFormErrors] = useState({});

    // Theme
    const [colorScheme] = useState('dark');
    const [colorFamily] = useState('prisma');
    const [density] = useState('comfortable');

    // -------------------------
    // HANDLERS
    // -------------------------
    const handleInputChange = (e, { name, value }) =>
        setFormInputValues({ ...FormInputvalues, [name]: value });

    const handleTabChange = (e, { selectedTabId }) => setActiveTabId(selectedTabId);

    const handleEdit = () => {
        setIsEditMode(true);
        setInputDisabled(false);
    };

    const handleSave = () => {
        // ... your existing validation & save logic ...
        setIsEditMode(false);
        setInfoMessage({ visible: true, type: 'success', message: 'Asset saved successfully.' });
        setTimeout(() => setInfoMessage({ visible: false }), 4000);
    };

    const handleCancel = () => {
        setIsEditMode(false);
        // ... your existing reset logic ...
    };

    // -------------------------
    // LOADING STATE
    // -------------------------
    if (isLoading) {
        return (
            <SplunkThemeProvider family={colorFamily} colorScheme={colorScheme} density={density}>
                <div style={styles.loadingWrapper}>
                    <WaitSpinner size="large" />
                    <P>Loading asset data…</P>
                </div>
            </SplunkThemeProvider>
        );
    }

    const isActive = FormInputvalues.index_active === 'Y';

    // -------------------------
    // RENDER
    // -------------------------
    return (
        <SplunkThemeProvider family={colorFamily} colorScheme={colorScheme} density={density}>
            <Card style={{ minWidth: '100%', minHeight: '100vh', borderRadius: 0, border: 'none' }}>

                {/* ── STICKY ACTION BAR ──────────────────────────────────────── */}
                <div style={styles.actionBar}>
                    <div style={styles.actionBarTitle}>
                        <Heading level={3} style={{ margin: 0 }}>
                            Splunk Data Catalog
                        </Heading>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '13px', opacity: 0.6 }}>Manage Asset</span>
                            {FormInputvalues.index_name && (
                                <span style={{ fontSize: '13px', opacity: 0.9, fontWeight: 600 }}>
                                    › {FormInputvalues.index_name}
                                </span>
                            )}
                            <span style={styles.statusBadge(isActive)}>
                                <span style={styles.statusDot(isActive)} />
                                {isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>

                    <div style={styles.actionBarButtons}>
                        {isEditMode ? (
                            <>
                                <Button label="Cancel" onClick={handleCancel} />
                                <Button label="Save Changes" appearance="primary" onClick={handleSave} />
                            </>
                        ) : (
                            <Button label="Edit" onClick={handleEdit} />
                        )}
                    </div>
                </div>

                {/* ── NOTIFICATION AREA ──────────────────────────────────────── */}
                {infoMessage.visible && (
                    <div style={styles.notificationArea}>
                        <Message type={infoMessage.type || 'info'}>{infoMessage.message}</Message>
                    </div>
                )}

                {/* ── TABS ───────────────────────────────────────────────────── */}
                <div style={{ padding: '16px 24px 0' }}>
                    <TabBar activeTabId={activeTabId} onChange={handleTabChange}>
                        <TabBar.Tab label="Overview"          tabId="overview" />
                        <TabBar.Tab label="Size & Retention"  tabId="retention" />
                        <TabBar.Tab label="Contacts"          tabId="contacts" />
                        <TabBar.Tab label="Documentation"     tabId="docs" />
                        <TabBar.Tab label="Classification"    tabId="classification" />
                    </TabBar>
                </div>

                {/* ── TAB CONTENT ────────────────────────────────────────────── */}
                <Card.Body style={{ padding: 0 }}>
                    <div style={styles.tabContent}>

                        {/* ── TAB 1: OVERVIEW ── */}
                        {activeTabId === 'overview' && (
                            <>
                                <Section title="Index Identity">
                                    <div style={styles.grid2}>
                                        <ControlGroup
                                            label="Index Name *"
                                            error={!!formErrors.index_name_error}
                                            help={formErrors.index_name_error}
                                        >
                                            <div style={styles.inlineField}>
                                                <Text
                                                    name="index_name"
                                                    value={FormInputvalues.index_name}
                                                    disabled={!isEditMode}
                                                    onChange={handleInputChange}
                                                    placeholder="e.g. main, prod_app_logs"
                                                />
                                                <Button label="Check" disabled={!isEditMode} />
                                            </div>
                                        </ControlGroup>

                                        <ControlGroup label="Role Name *">
                                            <Text
                                                name="splunk_role_name"
                                                value={FormInputvalues.splunk_role_name}
                                                disabled={!isEditMode}
                                                onChange={handleInputChange}
                                                placeholder="e.g. sc4s_writer"
                                            />
                                        </ControlGroup>

                                        <ControlGroup label="Ability App Name">
                                            <Text
                                                name="ability_app_name"
                                                value={FormInputvalues.ability_app_name}
                                                disabled={!isEditMode}
                                                onChange={handleInputChange}
                                                placeholder="App name"
                                            />
                                        </ControlGroup>

                                        <ControlGroup label="AGS Entitlement Name *">
                                            <Text
                                                name="ags_entitlement_name"
                                                value={FormInputvalues.ags_entitlement_name}
                                                disabled={!isEditMode}
                                                onChange={handleInputChange}
                                                placeholder="Entitlement name"
                                            />
                                        </ControlGroup>
                                    </div>
                                </Section>

                                <Section title="Descriptions">
                                    <div style={styles.grid2}>
                                        <div style={styles.fullWidth}>
                                            <ControlGroup label="Index Description *">
                                                <Text
                                                    multiline
                                                    rowsMin={3}
                                                    rowsMax={5}
                                                    name="index_description"
                                                    value={FormInputvalues.index_description}
                                                    disabled={!isEditMode}
                                                    onChange={handleInputChange}
                                                    placeholder="Describe the purpose and data contained in this index…"
                                                />
                                            </ControlGroup>
                                        </div>

                                        <div style={styles.fullWidth}>
                                            <ControlGroup label="Application Description">
                                                <Text
                                                    multiline
                                                    rowsMin={3}
                                                    rowsMax={5}
                                                    name="application_desc"
                                                    value={FormInputvalues.application_desc}
                                                    disabled={!isEditMode}
                                                    onChange={handleInputChange}
                                                    placeholder="Describe the application that writes to this index…"
                                                />
                                            </ControlGroup>
                                        </div>
                                    </div>
                                </Section>
                            </>
                        )}

                        {/* ── TAB 2: SIZE & RETENTION ── */}
                        {activeTabId === 'retention' && (
                            <>
                                <Section title="Volume">
                                    <div style={styles.grid2}>
                                        <ControlGroup label="Index Size Per Day (MB) *">
                                            <Text
                                                name="index_size_mb"
                                                value={FormInputvalues.index_size_mb}
                                                disabled={!isEditMode}
                                                onChange={handleInputChange}
                                                placeholder="e.g. 500"
                                            />
                                        </ControlGroup>

                                        <ControlGroup label="Average Index Usage (MB)">
                                            <Text
                                                name="avg_index_usage_mb"
                                                value={FormInputvalues.avg_index_usage_mb}
                                                disabled={!isEditMode}
                                                onChange={handleInputChange}
                                                placeholder="e.g. 250"
                                            />
                                        </ControlGroup>
                                    </div>
                                </Section>

                                <Section title="Lifecycle">
                                    <div style={styles.grid2}>
                                        <ControlGroup label="Index Created By *">
                                            <Select
                                                value={FormInputvalues.index_created_by}
                                                disabled={!isEditMode}
                                                onChange={(e, { value }) =>
                                                    handleInputChange(e, { name: 'index_created_by', value })
                                                }
                                            >
                                                {/* Map your ArchitectDropDownOptions here */}
                                                <Select.Option label="— Select Architect —" value="" />
                                            </Select>
                                        </ControlGroup>

                                        <ControlGroup label="Index Created Date *">
                                            <Date
                                                value={FormInputvalues.index_created_date}
                                                disabled={!isEditMode}
                                                onChange={(e, { value }) =>
                                                    handleInputChange(e, { name: 'index_created_date', value })
                                                }
                                            />
                                        </ControlGroup>

                                        <ControlGroup label="Retention Period (Days) *">
                                            <Text
                                                name="index_retention_period"
                                                value={FormInputvalues.index_retention_period}
                                                disabled={!isEditMode}
                                                onChange={handleInputChange}
                                                placeholder="e.g. 90"
                                            />
                                        </ControlGroup>

                                        <ControlGroup label="Index Active">
                                            <RadioList
                                                direction="row"
                                                value={FormInputvalues.index_active}
                                                disabled={!isEditMode}
                                                onChange={(e, { value }) =>
                                                    handleInputChange(e, { name: 'index_active', value })
                                                }
                                            >
                                                <RadioList.Option value="Y">Yes</RadioList.Option>
                                                <RadioList.Option value="N">No</RadioList.Option>
                                            </RadioList>
                                        </ControlGroup>

                                        <ControlGroup label="Index In Use">
                                            <RadioList
                                                direction="row"
                                                value={FormInputvalues.index_used}
                                                disabled={!isEditMode}
                                                onChange={(e, { value }) =>
                                                    handleInputChange(e, { name: 'index_used', value })
                                                }
                                            >
                                                <RadioList.Option value="Y">Yes</RadioList.Option>
                                                <RadioList.Option value="N">No</RadioList.Option>
                                            </RadioList>
                                        </ControlGroup>
                                    </div>
                                </Section>
                            </>
                        )}

                        {/* ── TAB 3: CONTACTS ── */}
                        {activeTabId === 'contacts' && (
                            <Section title="Additional Contact Information">
                                <FormRows
                                    addLabel="Add Contact"
                                    // ... your existing FormRows props for contacts ...
                                >
                                    {/*
                                        Map FormInputvalues.addtn_contact here.
                                        Each row typically has: Name, Role, Email fields.
                                        Example row structure:
                                        <FormRows.Row key={idx}>
                                            <Text name="contact_name" ... />
                                            <Text name="contact_email" ... />
                                            <Select name="contact_role" ... />
                                        </FormRows.Row>
                                    */}
                                    <Message appearance="fill" type="info">
                                        No contacts added yet. Click "Add Contact" to begin.
                                    </Message>
                                </FormRows>
                            </Section>
                        )}

                        {/* ── TAB 4: DOCUMENTATION ── */}
                        {activeTabId === 'docs' && (
                            <>
                                <Section title="Reference Numbers">
                                    <div style={styles.grid2}>
                                        <ControlGroup label="POW Number">
                                            <Text
                                                name="pow_number"
                                                value={FormInputvalues.pow_number}
                                                disabled={!isEditMode}
                                                onChange={handleInputChange}
                                                placeholder="e.g. POW-12345"
                                            />
                                        </ControlGroup>
                                    </div>
                                </Section>

                                <Section title="Additional Documentation Links">
                                    <FormRows
                                        addLabel="Add URL"
                                        // ... your existing FormRows props for URLs ...
                                    >
                                        {/*
                                            Map FormInputvalues.addtn_documentation here.
                                            Example row structure:
                                            <FormRows.Row key={idx}>
                                                <Text name="doc_label" placeholder="Label" ... />
                                                <Text name="doc_url" placeholder="https://..." ... />
                                            </FormRows.Row>
                                        */}
                                        <Message appearance="fill" type="info">
                                            No documentation links added yet. Click "Add URL" to begin.
                                        </Message>
                                    </FormRows>
                                </Section>
                            </>
                        )}

                        {/* ── TAB 5: CLASSIFICATION ── */}
                        {activeTabId === 'classification' && (
                            <Section title="Data Classification">
                                <div style={styles.grid2}>
                                    <div style={styles.fullWidth}>
                                        <ControlGroup label="Customer Segment">
                                            <RadioList
                                                direction="row"
                                                value={FormInputvalues.index_customer_segment}
                                                disabled={!isEditMode}
                                                onChange={(e, { value }) =>
                                                    handleInputChange(e, { name: 'index_customer_segment', value })
                                                }
                                            >
                                                {/*
                                                    Map IndexCustomerSegmentOptions here, e.g.:
                                                    <RadioList.Option value="enterprise">Enterprise</RadioList.Option>
                                                    <RadioList.Option value="smb">SMB</RadioList.Option>
                                                    <RadioList.Option value="internal">Internal</RadioList.Option>
                                                */}
                                            </RadioList>
                                        </ControlGroup>
                                    </div>

                                    <div style={styles.fullWidth}>
                                        <ControlGroup label="Index Classification">
                                            <RadioList
                                                direction="row"
                                                value={FormInputvalues.index_classification}
                                                disabled={!isEditMode}
                                                onChange={(e, { value }) =>
                                                    handleInputChange(e, { name: 'index_classification', value })
                                                }
                                            >
                                                {/*
                                                    Map IndexClassificationOptions here, e.g.:
                                                    <RadioList.Option value="public">Public</RadioList.Option>
                                                    <RadioList.Option value="internal">Internal</RadioList.Option>
                                                    <RadioList.Option value="confidential">Confidential</RadioList.Option>
                                                    <RadioList.Option value="restricted">Restricted</RadioList.Option>
                                                */}
                                            </RadioList>
                                        </ControlGroup>
                                    </div>

                                    <div style={styles.fullWidth}>
                                        <ControlGroup label="Index Cluster">
                                            <Multiselect
                                                values={FormInputvalues.index_cluster}
                                                disabled={!isEditMode}
                                                onChange={(e, { values }) =>
                                                    handleInputChange(e, { name: 'index_cluster', value: values })
                                                }
                                            >
                                                {/*
                                                    Map IndexClusterDropDownOptions here, e.g.:
                                                    <Multiselect.Option label="Cluster A" value="cluster_a" />
                                                    <Multiselect.Option label="Cluster B" value="cluster_b" />
                                                */}
                                            </Multiselect>
                                        </ControlGroup>
                                    </div>
                                </div>
                            </Section>
                        )}

                    </div>
                </Card.Body>
            </Card>
        </SplunkThemeProvider>
    );
}

export default ManageAssetPage;
