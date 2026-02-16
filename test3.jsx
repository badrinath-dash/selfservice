import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import SplunkThemeProvider from '@splunk/themes/SplunkThemeProvider';
import useSplunkTheme from '@splunk/themes/useSplunkTheme';
import Metrics from '@splunk/react-icons/enterprise/Metrics';
import Event from '@splunk/react-icons/enterprise/Events';
import Message from '@splunk/react-ui/Message';
import Button from '@splunk/react-ui/Button';
import CardLayout from '@splunk/react-ui/CardLayout';
import Menu from '@splunk/react-ui/Menu';
import Text from '@splunk/react-ui/Text';
import Select from '@splunk/react-ui/Select';
import Paginator from '@splunk/react-ui/Paginator';
import RadioList from '@splunk/react-ui/RadioList';
import Dropdown from '@splunk/react-ui/Dropdown';
import External from '@splunk/react-icons/enterprise/External';
import Modal from '@splunk/react-ui/Modal';
import P from '@splunk/react-ui/Paragraph';
import Heading from '@splunk/react-ui/Heading';
import Remove from '@splunk/react-icons/enterprise/Remove';
import DataSource from '@splunk/react-icons/enterprise/DataSource';
import Plus from '@splunk/react-icons/enterprise/Plus';
import Activity from '@splunk/react-icons/enterprise/Activity';
import Stop from '@splunk/react-icons/enterprise/Stop';
import Cancel from '@splunk/react-icons/enterprise/Cancel';
import Chip from '@splunk/react-ui/Chip';

// Assuming these are local imports from your project
import { searchKVStore, deleteKVStore } from '../common/ManageKVStore';
import { SortByOptions } from '../common/DropDownData';
import { HomeHelpMenuReact } from '../components/DataCatalogueHome/HomeHelpMenu';
import { HomePageHistoryModalPanelReact } from '../components/DataCatalogueHome/HomeHistoryModal';
import { HomeIndexDetailsModalPanelReact } from '../components/DataCatalogueHome/HomeIndexDetailsModal';
import getUserRoleDetails from '../common/GetUserDetails';
import ModernSearchBar from '../components/DataCatalogueHome/ModernSearchBar';
import { loadConfig } from '../components/DataCatalogueHome/config';

function useDebouncedValue(value, delay = 250) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return debounced;
}

const SplunkDataCatalogueHomePage = () => {
    const [assetValues, setAssetValues] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchFilterName, setSearchFilterName] = useState('index_name');
    const [sortType, setSortType] = useState('index_name');
    const [postsPerPage, setPostsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeFilters, setActiveFilters] = useState({
        activeOnly: 'all',
        type: 'all',
        showInternal: 'exclude', // 'exclude', 'all', 'only'
    });
    
    // ... (keep modals, user details, and config useEffects from your original code)

    const debouncedSearchTerm = useDebouncedValue(searchTerm, 250);

    // --- Modern Styles ---
    const modernCardStyle = {
        position: 'relative',
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(12px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        transition: 'all 0.3s ease',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
    };

    // --- Filtering Logic ---
    const filteredResults = useMemo(() => {
        const normalizedSearch = debouncedSearchTerm.trim().toLowerCase();
        return assetValues.filter((row) => {
            const name = (row?.index_name || '').toLowerCase();
            const isInternal = name.startsWith('_');

            const matchesSearch = (row?.[searchFilterName] ?? '').toString().toLowerCase().includes(normalizedSearch);
            const matchesStatus = activeFilters.activeOnly === 'all' || (activeFilters.activeOnly === 'active' ? row.index_active : !row.index_active);
            const matchesType = activeFilters.type === 'all' || (row.index_type || '').toLowerCase() === activeFilters.type;
            
            // Internal Index Logic
            const matchesInternal = activeFilters.showInternal === 'all' || 
                (activeFilters.showInternal === 'only' ? isInternal : !isInternal);

            return matchesSearch && matchesStatus && matchesType && matchesInternal;
        });
    }, [assetValues, searchFilterName, debouncedSearchTerm, activeFilters]);

    // --- Sorting Logic ---
    const sortedResults = useMemo(() => {
        const copy = [...filteredResults];
        const [key, dir] = String(sortType).split(':');
        copy.sort((a, b) => {
            const av = a[key || 'index_name'];
            const bv = b[key || 'index_name'];
            return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
        });
        if (dir === 'desc') copy.reverse();
        return copy;
    }, [filteredResults, sortType]);

    // --- Pagination ---
    const totalPages = Math.max(1, Math.ceil(sortedResults.length / postsPerPage));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const currentPageResults = useMemo(() => {
        const start = (safeCurrentPage - 1) * postsPerPage;
        return sortedResults.slice(start, start + postsPerPage);
    }, [sortedResults, safeCurrentPage, postsPerPage]);

    return (
        <SplunkThemeProvider family="prisma" colorScheme="dark" density="comfortable">
            <div style={{ padding: '40px', maxWidth: '1600px', margin: '0 auto' }}>
                
                <header style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <Heading level={1} style={{ fontSize: '36px', fontWeight: 800 }}>Data Catalogue</Heading>
                    <div style={{ maxWidth: '600px', margin: '20px auto' }}>
                        <ModernSearchBar
                            value={searchTerm}
                            onChange={setSearchTerm}
                            filterKey={searchFilterName}
                            onFilterKeyChange={setSearchFilterName}
                            options={searchFieldOptions}
                            placeholder="Search indexes..."
                        />
                    </div>
                </header>

                <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
                    {/* --- SIDEBAR --- */}
                    <aside style={{ width: '280px', position: 'sticky', top: '40px' }}>
                        <div style={{ marginBottom: '32px' }}>
                            <Heading level={4} style={{ color: '#9AA4AE', marginBottom: '12px' }}>Sort Records</Heading>
                            <Select value={sortType} onChange={(_, { value }) => setSortType(value)} style={{ width: '100%' }}>
                                {SortByOptions.map(opt => <Select.Option key={opt.value} label={opt.label} value={opt.value} />)}
                            </Select>
                        </div>

                        <div style={{ marginBottom: '32px' }}>
                            <Heading level={4} style={{ color: '#9AA4AE', marginBottom: '12px' }}>Internal Indexes</Heading>
                            <RadioList value={activeFilters.showInternal} onChange={(_, { value }) => setActiveFilters(p => ({ ...p, showInternal: value }))}>
                                <RadioList.Option value="exclude">Hide Internal (_)</RadioList.Option>
                                <RadioList.Option value="all">Show All</RadioList.Option>
                                <RadioList.Option value="only">Only Internal</RadioList.Option>
                            </RadioList>
                        </div>

                        <div style={{ marginBottom: '32px' }}>
                            <Heading level={4} style={{ color: '#9AA4AE', marginBottom: '12px' }}>Results Per Page</Heading>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {[10, 20, 50].map(size => (
                                    <Button 
                                        key={size} 
                                        appearance={postsPerPage === size ? 'primary' : 'secondary'} 
                                        label={String(size)} 
                                        onClick={() => setPostsPerPage(size)}
                                        style={{ flex: 1 }}
                                    />
                                ))}
                            </div>
                        </div>

                        <Button appearance="pill" label="Reset All Filters" onClick={() => setActiveFilters({ activeOnly: 'all', type: 'all', showInternal: 'exclude' })} style={{ width: '100%' }} />
                    </aside>

                    {/* --- CARDS --- */}
                    <main style={{ flex: 1 }}>
                        <CardLayout cardWidth={320} gutterSize={20}>
                            {currentPageResults.map((asset) => {
                                const isMetrics = (asset?.index_type || '').toLowerCase() === 'metrics';
                                const typeColor = isMetrics ? '#B66DFF' : '#00D1AF';
                                const TypeIcon = isMetrics ? Metrics : Event;

                                return (
                                    <div key={asset._key} style={modernCardStyle} className="catalogue-card">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                            <div>
                                                <div style={{ fontSize: '19px', fontWeight: 700, color: '#fff' }}>{asset.index_name}</div>
                                                <div style={{ fontSize: '12px', color: '#9AA4AE' }}>{asset.source_itam_bsa || 'System Asset'}</div>
                                            </div>
                                            
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <div style={{
                                                    width: '36px', height: '36px', borderRadius: '10px', 
                                                    background: `${typeColor}15`, border: `1px solid ${typeColor}33`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: typeColor
                                                }}>
                                                    <TypeIcon size={1.2} />
                                                </div>
                                                {renderEllipsisMenu(asset, asset.index_name)}
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '12px', marginBottom: '15px' }}>
                                            <div><div style={{ fontSize: '9px', color: '#9AA4AE' }}>SIZE</div><div style={{ fontWeight: 600 }}>{asset.index_size_mb}MB</div></div>
                                            <div><div style={{ fontSize: '9px', color: '#9AA4AE' }}>USAGE</div><div style={{ fontWeight: 600 }}>{asset.avg_index_usage_mb}MB</div></div>
                                            <div><div style={{ fontSize: '9px', color: '#9AA4AE' }}>DAYS</div><div style={{ fontWeight: 600 }}>{asset.index_retention_period}d</div></div>
                                        </div>

                                        <div style={{ ...bodyTextStyle, ...clamp3, minHeight: '55px', marginBottom: '20px' }}>
                                            {asset.index_description || "No description provided."}
                                        </div>

                                        <Button appearance="secondary" label="View Details" style={{ width: '100%', borderRadius: '10px' }} to={`manage-asset?key=${asset._key}`} />
                                    </div>
                                );
                            })}
                        </CardLayout>

                        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
                            <Paginator current={safeCurrentPage} totalPages={totalPages} onChange={(_, { page }) => setCurrentPage(page)} />
                        </div>
                    </main>
                </div>
            </div>
            {/* Modal Refs */}
            <HomePageHistoryModalPanelReact ref={childRef} />
            <HomeIndexDetailsModalPanelReact ref={childRef1} />
        </SplunkThemeProvider>
    );
};

export default SplunkDataCatalogueHomePage;
