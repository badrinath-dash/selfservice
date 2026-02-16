import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import SplunkThemeProvider from '@splunk/themes/SplunkThemeProvider';
import useSplunkTheme from '@splunk/themes/useSplunkTheme';

// Splunk UI Components
import Button from '@splunk/react-ui/Button';
import CardLayout from '@splunk/react-ui/CardLayout';
import Menu from '@splunk/react-ui/Menu';
import Text from '@splunk/react-ui/Text';
import Select from '@splunk/react-ui/Select';
import Paginator from '@splunk/react-ui/Paginator';
import RadioList from '@splunk/react-ui/RadioList';
import Dropdown from '@splunk/react-ui/Dropdown';
import Heading from '@splunk/react-ui/Heading';
import Chip from '@splunk/react-ui/Chip';

// Icons
import Metrics from '@splunk/react-icons/enterprise/Metrics';
import Event from '@splunk/react-icons/enterprise/Events';
import Plus from '@splunk/react-icons/enterprise/Plus';
import Activity from '@splunk/react-icons/enterprise/Activity';
import DataSource from '@splunk/react-icons/enterprise/DataSource';
import Remove from '@splunk/react-icons/enterprise/Remove';
import External from '@splunk/react-icons/enterprise/External';

// Local Imports
import { searchKVStore, deleteKVStore } from '../common/ManageKVStore';
import { SortByOptions } from '../common/DropDownData';
import { HomeHelpMenuReact } from '../components/DataCatalogueHome/HomeHelpMenu';
import { HomePageHistoryModalPanelReact } from '../components/DataCatalogueHome/HomeHistoryModal';
import { HomeIndexDetailsModalPanelReact } from '../components/DataCatalogueHome/HomeIndexDetailsModal';
import ModernSearchBar from '../components/DataCatalogueHome/ModernSearchBar';

// --- Global Constants ---
const DEFAULT_FILTERS = {
    activeOnly: 'all',
    type: 'all',
    showInternal: 'exclude',
};

// --- Style Tokens ---
const styles = {
    pageWrapper: { padding: '40px', maxWidth: '1600px', margin: '0 auto' },
    layoutGrid: { display: 'flex', gap: '40px', alignItems: 'flex-start' },
    sidebar: { 
        width: '280px', 
        position: 'sticky', 
        top: '40px', 
        paddingRight: '20px', 
        borderRight: '1px solid rgba(255,255,255,0.1)' 
    },
    sidebarHeading: { color: '#9AA4AE', marginBottom: '12px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' },
    modernCard: {
        background: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(12px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease'
    },
    bentoGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        background: 'rgba(0, 0, 0, 0.25)',
        padding: '12px',
        borderRadius: '16px',
        margin: '16px 0'
    },
    statLabel: { fontSize: '9px', color: '#9AA4AE', fontWeight: 700, display: 'block' },
    statValue: { fontSize: '14px', fontWeight: 600, color: '#FFFFFF' }
};

const SplunkDataCatalogueHomePage = () => {
    const [assetValues, setAssetValues] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchFilterName, setSearchFilterName] = useState('index_name');
    const [sortType, setSortType] = useState('index_name');
    const [postsPerPage, setPostsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeFilters, setActiveFilters] = useState(DEFAULT_FILTERS);

    const childRef = useRef();
    const childRef1 = useRef();

    // --- Logic: Filtering & Pagination ---
    const filteredResults = useMemo(() => {
        return assetValues.filter((row) => {
            const name = (row?.index_name || '').toLowerCase();
            const isInternal = name.startsWith('_');
            const matchesSearch = (row?.[searchFilterName] ?? '').toString().toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = activeFilters.activeOnly === 'all' || 
                (activeFilters.activeOnly === 'active' ? row.index_active : !row.index_active);
            
            const matchesType = activeFilters.type === 'all' || 
                (row.index_type || '').toLowerCase() === activeFilters.type;

            const matchesInternal = activeFilters.showInternal === 'all' || 
                (activeFilters.showInternal === 'exclude' ? !isInternal : isInternal);

            return matchesSearch && matchesStatus && matchesType && matchesInternal;
        });
    }, [assetValues, searchTerm, searchFilterName, activeFilters]);

    const sortedResults = useMemo(() => {
        const copy = [...filteredResults];
        copy.sort((a, b) => String(a[sortType]).localeCompare(String(b[sortType]), undefined, { numeric: true }));
        return copy;
    }, [filteredResults, sortType]);

    const totalPages = Math.max(1, Math.ceil(sortedResults.length / postsPerPage));
    const safeCurrentPage = Math.min(currentPage, totalPages);

    const currentPageResults = useMemo(() => {
        const start = (safeCurrentPage - 1) * postsPerPage;
        return sortedResults.slice(start, start + postsPerPage);
    }, [sortedResults, safeCurrentPage, postsPerPage]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, activeFilters, postsPerPage]);

    // --- Components ---
    const IndexTypeIndicator = ({ type }) => {
        const isMetrics = type?.toLowerCase() === 'metrics';
        const color = isMetrics ? '#996dff' : '#00d100';
        const Icon = isMetrics ? Metrics : Event;

        return (
            <div style={{
                width: '36px', height: '36px', borderRadius: '10px', 
                background: `${color}22`, border: `1px solid ${color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: color
            }}>
                <Icon size={1.2} />
            </div>
        );
    };

    return (
        <SplunkThemeProvider family="prisma" colorScheme="dark" density="comfortable">
            <div style={styles.pageWrapper}>
                <header style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <Heading level={1} style={{ fontSize: '36px', fontWeight: 800 }}>Data Catalogue</Heading>
                    <div style={{ maxWidth: '600px', margin: '20px auto' }}>
                        <ModernSearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Find an index..." />
                    </div>
                </header>

                <div style={styles.layoutGrid}>
                    {/* --- Sidebar --- */}
                    <div style={styles.sidebar}>
                        <div style={{ marginBottom: '32px' }}>
                            <Heading level={4} style={styles.sidebarHeading}>Sort By</Heading>
                            <Select value={sortType} onChange={(_, { value }) => setSortType(value)} style={{ width: '100%' }}>
                                {SortByOptions.map(opt => <Select.Option key={opt.value} label={opt.label} value={opt.value} />)}
                            </Select>
                        </div>

                        <div style={{ marginBottom: '32px' }}>
                            <Heading level={4} style={styles.sidebarHeading}>Visibility</Heading>
                            <RadioList value={activeFilters.showInternal} onChange={(_, { value }) => setActiveFilters(p => ({ ...p, showInternal: value }))}>
                                <RadioList.Option value="exclude">Hide Internal (_)</RadioList.Option>
                                <RadioList.Option value="all">Show All</RadioList.Option>
                            </RadioList>
                        </div>

                        <div style={{ marginBottom: '32px' }}>
                            <Heading level={4} style={styles.sidebarHeading}>Page Size</Heading>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {[10, 20, 50].map(size => (
                                    <Button key={size} appearance={postsPerPage === size ? 'primary' : 'secondary'} label={String(size)} onClick={() => setPostsPerPage(size)} style={{ flex: 1 }} />
                                ))}
                            </div>
                        </div>

                        <Button appearance="pill" label="Reset Filters" onClick={() => setActiveFilters(DEFAULT_FILTERS)} style={{ width: '100%', marginTop: '20px' }} />
                    </div>

                    {/* --- Main Grid --- */}
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
                            <Text bold size="large" style={{ fontSize: '18px' }}>{filteredResults.length} Assets Found</Text>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <HomeHelpMenuReact />
                                <Button appearance="primary" icon={<Plus />} label="Add Index" />
                            </div>
                        </div>

                        <CardLayout cardWidth={320} gutterSize={24}>
                            {currentPageResults.map((asset) => (
                                <div key={asset._key} style={styles.modernCard}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                        <IndexTypeIndicator type={asset.index_type} />
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <Chip appearance={asset.index_active ? 'success' : 'neutral'}>{asset.index_active ? 'Active' : 'Offline'}</Chip>
                                            <Dropdown toggle={<Button appearance="toggle" label="⋯" />}>
                                                <Menu>
                                                    <Menu.Item icon={<Activity />}>History</Menu.Item>
                                                    <Menu.Item icon={<DataSource />}>Metadata</Menu.Item>
                                                    <Menu.Divider />
                                                    <Menu.Item icon={<Remove />} appearance="destructive">Delete</Menu.Item>
                                                </Menu>
                                            </Dropdown>
                                        </div>
                                    </div>

                                    <Heading level={3} style={{ margin: '0 0 4px 0', fontSize: '20px' }}>{asset.index_name}</Heading>
                                    <Text color="muted" size="small">{asset.source_itam_bsa || 'System Asset'}</Text>

                                    <div style={styles.bentoGrid}>
                                        <div><span style={styles.statLabel}>Size</span><span style={styles.statValue}>{asset.index_size_mb}MB</span></div>
                                        <div><span style={styles.statLabel}>Usage</span><span style={styles.statValue}>{asset.avg_index_usage_mb}MB</span></div>
                                        <div><span style={styles.statLabel}>Days</span><span style={styles.statValue}>{asset.index_retention_period}d</span></div>
                                    </div>

                                    <Text style={{ minHeight: '54px', opacity: 0.8, fontSize: '13px', lineHeight: '1.5' }}>{asset.index_description || "No description provided."}</Text>

                                    <Button appearance="secondary" label="View Details" style={{ width: '100%', marginTop: '20px', borderRadius: '12px' }} to={`manage-asset?key=${asset._key}`} />
                                </div>
                            ))}
                        </CardLayout>

                        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
                            <Paginator current={safeCurrentPage} totalPages={totalPages} onChange={(_, { page }) => setCurrentPage(page)} />
                        </div>
                    </div>
                </div>
            </div>
            <HomePageHistoryModalPanelReact ref={childRef} />
            <HomeIndexDetailsModalPanelReact ref={childRef1} />
        </SplunkThemeProvider>
    );
};

export default SplunkDataCatalogueHomePage;
