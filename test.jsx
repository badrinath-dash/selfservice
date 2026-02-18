import React, { useState, useEffect, useCallback, useRef } from 'react';
import SplunkThemeProvider from '@splunk/themes/SplunkThemeProvider';
import Button from '@splunk/react-ui/Button';
import Message from '@splunk/react-ui/Message';
import Text from '@splunk/react-ui/Text';
import RadioList from '@splunk/react-ui/RadioList';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import Date from '@splunk/react-ui/Date';
import TabBar from '@splunk/react-ui/TabBar';
import Select from '@splunk/react-ui/Select';
import Multiselect from '@splunk/react-ui/Multiselect';
import Heading from '@splunk/react-ui/Heading';
import WaitSpinner from '@splunk/react-ui/WaitSpinner';
import Chip from '@splunk/react-ui/Chip';
import queryString from 'query-string';
import moment from 'moment';

// Icons
import Metrics from '@splunk/react-icons/enterprise/Metrics';
import Event from '@splunk/react-icons/enterprise/Events';
import Activity from '@splunk/react-icons/enterprise/Activity';
import DataSource from '@splunk/react-icons/enterprise/DataSource';
import Plus from '@splunk/react-icons/enterprise/Plus';

// Custom Function imports
import { searchKVStore, updateKVStore } from '../common/ManageKVStore';
import {
    IndexClusterDropDownOptions,
    ContactTypeOptions,
    URLTypeOptions,
    SortByOptions
} from '../common/DropDownData';
import getUserRoleDetails from '../common/GetUserDetails';

// =============================================================================
// DESIGN TOKENS (Shared with Home Page)
// =============================================================================
const T = {
    bgBase: '#0d0f14',
    bgSurface: 'rgba(255, 255, 255, 0.03)',
    border: 'rgba(255,255,255,0.08)',
    accent: '#996dffff', // Metrics Purple
    accentTeal: '#00d100ff', // Events Green
    textPrimary: '#e8eaf0',
    textMuted: '#9AA4AE',
    radiusLg: '24px',
    radiusMd: '12px',
};

// =============================================================================
// STYLES OBJECT
// =============================================================================
const S = {
    pageWrapper: { padding: '40px', maxWidth: '1600px', margin: '0 auto', color: T.textPrimary },
    layoutGrid: { display: 'flex', gap: '40px', alignItems: 'flex-start' },
    sidebar: { 
        width: '280px', 
        position: 'sticky', 
        top: '40px', 
        paddingRight: '20px', 
        borderRight: `1px solid ${T.border}` 
    },
    sidebarHeading: { color: T.textMuted, marginBottom: '12px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' },
    mainContent: { flex: 1 },
    
    // Header Bar
    headerBar: {
        background: 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(10px)',
        borderRadius: T.radiusMd,
        padding: '20px 30px',
        border: `1px solid ${T.border}`,
        marginBottom: '30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },

    // Bento Style Section Cards
    sectionCard: {
        background: T.bgSurface,
        backdropFilter: 'blur(12px)',
        borderRadius: T.radiusLg,
        border: `1px solid ${T.border}`,
        padding: '30px',
        marginBottom: '24px'
    },
    
    bentoGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        background: 'rgba(0, 0, 0, 0.2)',
        padding: '16px',
        borderRadius: '16px',
        marginBottom: '24px'
    },
    statItem: { textAlign: 'center' },
    statLabel: { fontSize: '10px', color: T.textMuted, fontWeight: 700, textTransform: 'uppercase' },
    statValue: { fontSize: '18px', fontWeight: 600, color: '#fff' }
};

function ManageAssetPage() {
    const [activeTabId, setActiveTabId] = useState('overview');
    const [isEditMode, setIsEditMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({
        index_name: '', index_description: '', index_type: 'event',
        index_size_mb: '0', avg_index_usage_mb: '0', index_retention_period: '90',
        index_active: 'Y', index_cluster: [], addtn_contact: [], addtn_documentation: []
    });

    const isMetrics = form.index_type === 'metrics';
    const typeColor = isMetrics ? T.accent : T.accentTeal;
    const TypeIcon = isMetrics ? Metrics : Event;

    const handleInputChange = (e, { name, value }) => setForm({ ...form, [name]: value });

    if (isLoading) return <div style={{display:'flex', height:'100vh', alignItems:'center', justifyContent:'center'}}><WaitSpinner size="large" /></div>;

    return (
        <SplunkThemeProvider family="prisma" colorScheme="dark" density="comfortable">
            <div style={S.pageWrapper}>
                
                {/* --- HEADER BLOCK --- */}
                <div style={S.headerBar}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '14px',
                            background: `${typeColor}22`, border: `1px solid ${typeColor}44`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: typeColor
                        }}>
                            <TypeIcon size={1.5} />
                        </div>
                        <div>
                            <Heading level={1} style={{ margin: 0 }}>{form.index_name || 'New Index'}</Heading>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                <Chip appearance={form.index_active === 'Y' ? 'success' : 'neutral'}>
                                    {form.index_active === 'Y' ? 'Active' : 'Offline'}
                                </Chip>
                                <Text color="muted" size="small">UID: {form._key || 'Pending'}</Text>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Button label="History" icon={<Activity />} />
                        {isEditMode ? (
                            <Button label="Save Changes" appearance="primary" onClick={() => setIsEditMode(false)} />
                        ) : (
                            <Button label="Edit Asset" appearance="primary" onClick={() => setIsEditMode(true)} />
                        )}
                    </div>
                </div>

                <div style={S.layoutGrid}>
                    {/* --- SIDEBAR --- */}
                    <aside style={S.sidebar}>
                        <div style={{ marginBottom: '32px' }}>
                            <Heading level={4} style={S.sidebarHeading}>Navigation</Heading>
                            <TabBar activeTabId={activeTabId} onChange={(e, { selectedTabId }) => setActiveTabId(selectedTabId)} vertical orientation="vertical">
                                <TabBar.Tab label="Overview" tabId="overview" icon={<DataSource />} />
                                <TabBar.Tab label="Size & Retention" tabId="retention" icon={<Activity />} />
                                <TabBar.Tab label="Stakeholders" tabId="contacts" />
                                <TabBar.Tab label="Docs & Meta" tabId="docs" />
                            </TabBar>
                        </div>

                        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: '20px' }}>
                            <Heading level={4} style={S.sidebarHeading}>Quick Stats</Heading>
                            <Text size="small" style={{ display: 'block', marginBottom: '8px' }}>
                                <span style={{ color: T.textMuted }}>Retention:</span> {form.index_retention_period} Days
                            </Text>
                            <Text size="small">
                                <span style={{ color: T.textMuted }}>Avg Usage:</span> {form.avg_index_usage_mb} MB
                            </Text>
                        </div>
                    </aside>

                    {/* --- MAIN PANEL --- */}
                    <main style={S.mainContent}>
                        
                        {/* Summary Bento Row (Visible always for context) */}
                        <div style={S.bentoGrid}>
                            <div style={S.statItem}>
                                <span style={S.statLabel}>Daily Volume</span>
                                <div style={S.statValue}>{form.index_size_mb} MB</div>
                            </div>
                            <div style={{ ...S.statItem, borderLeft: `1px solid ${T.border}`, borderRight: `1px solid ${T.border}` }}>
                                <span style={S.statLabel}>Current Usage</span>
                                <div style={S.statValue}>{form.avg_index_usage_mb} MB</div>
                            </div>
                            <div style={S.statItem}>
                                <span style={S.statLabel}>Retention</span>
                                <div style={S.statValue}>{form.index_retention_period} Days</div>
                            </div>
                        </div>

                        <div style={S.sectionCard}>
                            {/* --- TAB CONTENT: OVERVIEW --- */}
                            {activeTabId === 'overview' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <ControlGroup label="Index Name" labelPosition="top">
                                        <Text name="index_name" value={form.index_name} onChange={handleInputChange} disabled={!isEditMode} />
                                    </ControlGroup>
                                    <ControlGroup label="Role Name" labelPosition="top">
                                        <Text name="splunk_role_name" value={form.splunk_role_name} onChange={handleInputChange} disabled={!isEditMode} />
                                    </ControlGroup>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <ControlGroup label="Index Description" labelPosition="top">
                                            <Text multiline rowsMin={3} name="index_description" value={form.index_description} onChange={handleInputChange} disabled={!isEditMode} />
                                        </ControlGroup>
                                    </div>
                                    <ControlGroup label="AGS Entitlement" labelPosition="top">
                                        <Text name="ags_entitlement_name" value={form.ags_entitlement_name} onChange={handleInputChange} disabled={!isEditMode} />
                                    </ControlGroup>
                                    <ControlGroup label="Cluster Assignment" labelPosition="top">
                                        <Multiselect values={form.index_cluster} onChange={handleInputChange} disabled={!isEditMode}>
                                            {IndexClusterDropDownOptions.map(o => <Multiselect.Option key={o.value} label={o.label} value={o.value} />)}
                                        </Multiselect>
                                    </ControlGroup>
                                </div>
                            )}

                            {/* --- TAB CONTENT: SIZE & RETENTION --- */}
                            {activeTabId === 'retention' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <ControlGroup label="Retention Period (Days)" labelPosition="top">
                                        <Text name="index_retention_period" value={form.index_retention_period} onChange={handleInputChange} disabled={!isEditMode} />
                                    </ControlGroup>
                                    <ControlGroup label="Allocation (MB/Day)" labelPosition="top">
                                        <Text name="index_size_mb" value={form.index_size_mb} onChange={handleInputChange} disabled={!isEditMode} />
                                    </ControlGroup>
                                    <ControlGroup label="Created Date" labelPosition="top">
                                        <Date value={form.index_created_date} disabled={!isEditMode} />
                                    </ControlGroup>
                                </div>
                            )}

                            {/* Additional Tab logic here... */}
                        </div>
                    </main>
                </div>
            </div>
        </SplunkThemeProvider>
    );
}

export default ManageAssetPage;
