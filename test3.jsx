import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { variables } from '@splunk/themes';
import SplunkThemeProvider from '@splunk/themes/SplunkThemeProvider';

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
import External from '@splunk/react-icons/enterprise/External';
import Remove from '@splunk/react-icons/enterprise/Remove';
import Plus from '@splunk/react-icons/enterprise/Plus';
import Activity from '@splunk/react-icons/enterprise/Activity';
import DataSource from '@splunk/react-icons/enterprise/DataSource';

// Local Imports
import { searchKVStore, deleteKVStore } from '../common/ManageKVStore';
import { SortByOptions } from '../common/DropDownData';
import { HomeHelpMenuReact } from '../components/DataCatalogueHome/HomeHelpMenu';
import { HomePageHistoryModalPanelReact } from '../components/DataCatalogueHome/HomeHistoryModal';
import { HomeIndexDetailsModalPanelReact } from '../components/DataCatalogueHome/HomeIndexDetailsModal';
import getUserRoleDetails from '../common/GetUserDetails';
import ModernSearchBar from '../components/DataCatalogueHome/ModernSearchBar';
import { loadConfig } from '../components/DataCatalogueHome/config';

// --- STYLED COMPONENTS ---

const PageContainer = styled.div`
    padding: 40px;
    max-width: 1600px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
`;

const MainLayout = styled.div`
    display: flex;
    gap: 40px;
    align-items: flex-start;
`;

const Sidebar = styled.aside`
    width: 280px;
    position: sticky;
    top: 40px;
    padding-right: 10px;
    border-right: 1px solid ${variables.borderColor};
`;

const FilterSection = styled.div`
    margin-bottom: 32px;
`;

const StyledCard = styled.div`
    position: relative;
    background: ${variables.backgroundColorElevated};
    backdrop-filter: blur(12px);
    border-radius: 24px;
    border: 1px solid ${variables.borderColor};
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    padding: 24px;
    display: flex;
    flex-direction: column;

    &:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
        background: ${variables.backgroundColorHover};
    }
`;

const BentoGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    background: rgba(0, 0, 0, 0.2);
    padding: 12px;
    border-radius: 12px;
    margin: 16px 0;
`;

const StatItem = styled.div`
    display: flex;
    flex-direction: column;
    .label {
        font-size: 9px;
        color: ${variables.textColorMuted};
        text-transform: uppercase;
        font-weight: 700;
    }
    .value {
        font-size: 14px;
        font-weight: 600;
        color: ${variables.textColor};
    }
`;

const TypeIconBox = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: ${props => props.isMetrics ? 'rgba(182, 109, 255, 0.15)' : 'rgba(0, 209, 175, 0.15)'};
    border: 1px solid ${props => props.isMetrics ? 'rgba(182, 109, 255, 0.3)' : 'rgba(0, 209, 175, 0.3)'};
    color: ${props => props.isMetrics ? '#B66DFF' : '#00D1AF'};
`;

// --- MAIN COMPONENT ---

const SplunkDataCatalogueHomePage = () => {
    // State
    const [assetValues, setAssetValues] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortType, setSortType] = useState('index_name');
    const [postsPerPage, setPostsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeFilters, setActiveFilters] = useState({
        activeOnly: 'all',
        type: 'all',
        showInternal: 'exclude',
    });

    const childRef = useRef();
    const childRef1 = useRef();

    // Logic: Filtering & Sorting
    const filteredResults = useMemo(() => {
        return assetValues.filter((row) => {
            const name = (row?.index_name || '').toLowerCase();
            const isInternal = name.startsWith('_');
            const matchesSearch = name.includes(searchTerm.toLowerCase());
            const matchesStatus = activeFilters.activeOnly === 'all' || 
                (activeFilters.activeOnly === 'active' ? row.index_active : !row.index_active);
            const matchesInternal = activeFilters.showInternal === 'all' || 
                (activeFilters.showInternal === 'only' ? isInternal : !isInternal);

            return matchesSearch && matchesStatus && matchesInternal;
        });
    }, [assetValues, searchTerm, activeFilters]);

    const sortedResults = useMemo(() => {
        const copy = [...filteredResults];
        copy.sort((a, b) => String(a[sortType]).localeCompare(String(b[sortType]), undefined, { numeric: true }));
        return copy;
    }, [filteredResults, sortType]);

    const currentPageResults = useMemo(() => {
        const start = (currentPage - 1) * postsPerPage;
        return sortedResults.slice(start, start + postsPerPage);
    }, [sortedResults, currentPage, postsPerPage]);

    // Menu Helper
    const renderEllipsisMenu = (asset) => (
        <Dropdown toggle={<Button appearance="toggle" label="⋯" isMenu />}>
            <Menu>
                <Menu.Item icon={<Activity />}>History</Menu.Item>
                <Menu.Item icon={<DataSource />}>Metadata</Menu.Item>
                <Menu.Divider />
                <Menu.Item icon={<Remove />} appearance="destructive">Delete</Menu.Item>
            </Menu>
        </Dropdown>
    );

    return (
        <SplunkThemeProvider family="prisma" colorScheme="dark" density="comfortable">
            <PageContainer>
                <header style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <Heading level={1}>Data Catalogue</Heading>
                    <div style={{ maxWidth: '600px', margin: '20px auto' }}>
                        <ModernSearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search indexes..." />
                    </div>
                </header>

                <MainLayout>
                    <Sidebar>
                        <FilterSection>
                            <Heading level={4} style={{ color: variables.textColorMuted, marginBottom: 12 }}>Sort By</Heading>
                            <Select value={sortType} onChange={(_, { value }) => setSortType(value)} style={{ width: '100%' }}>
                                {SortByOptions.map(opt => <Select.Option key={opt.value} label={opt.label} value={opt.value} />)}
                            </Select>
                        </FilterSection>

                        <FilterSection>
                            <Heading level={4} style={{ color: variables.textColorMuted, marginBottom: 12 }}>Internal Indexes</Heading>
                            <RadioList value={activeFilters.showInternal} onChange={(_, { value }) => setActiveFilters(p => ({ ...p, showInternal: value }))}>
                                <RadioList.Option value="exclude">Hide Internal</RadioList.Option>
                                <RadioList.Option value="all">Show All</RadioList.Option>
                            </RadioList>
                        </FilterSection>

                        <FilterSection>
                            <Heading level={4} style={{ color: variables.textColorMuted, marginBottom: 12 }}>Results Per Page</Heading>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {[10, 20, 50].map(size => (
                                    <Button key={size} appearance={postsPerPage === size ? 'primary' : 'secondary'} label={String(size)} onClick={() => setPostsPerPage(size)} style={{ flex: 1 }} />
                                ))}
                            </div>
                        </FilterSection>
                    </Sidebar>

                    <main style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <Text bold size="large">{filteredResults.length} Results</Text>
                            <Button appearance="primary" icon={<Plus />} label="Add Index" />
                        </div>

                        <CardLayout cardWidth={320} gutterSize={20}>
                            {currentPageResults.map((asset) => {
                                const isMetrics = asset.index_type?.toLowerCase() === 'metrics';
                                const TypeIcon = isMetrics ? Metrics : Event;
                                return (
                                    <StyledCard key={asset._key}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                            <div>
                                                <Heading level={3} style={{ margin: 0 }}>{asset.index_name}</Heading>
                                                <Text color="muted">{asset.source_itam_bsa || 'System'}</Text>
                                            </div>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <TypeIconBox isMetrics={isMetrics}><TypeIcon size={1.2} /></TypeIconBox>
                                                {renderEllipsisMenu(asset)}
                                            </div>
                                        </div>

                                        <BentoGrid>
                                            <StatItem><span className="label">Size</span><span className="value">{asset.index_size_mb}MB</span></StatItem>
                                            <StatItem><span className="label">Usage</span><span className="value">{asset.avg_index_usage_mb}MB</span></StatItem>
                                            <StatItem><span className="label">Days</span><span className="value">{asset.index_retention_period}d</span></StatItem>
                                        </BentoGrid>

                                        <Text style={{ minHeight: 54, opacity: 0.8 }}>{asset.index_description || "No description."}</Text>
                                        <Button appearance="secondary" label="View Details" style={{ width: '100%', marginTop: 20, borderRadius: 10 }} />
                                    </StyledCard>
                                );
                            })}
                        </CardLayout>

                        <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center' }}>
                            <Paginator current={safeCurrentPage} totalPages={totalPages} onChange={(_, { page }) => setCurrentPage(page)} />
                        </div>
                    </main>
                </MainLayout>
            </PageContainer>

            <HomePageHistoryModalPanelReact ref={childRef} />
            <HomeIndexDetailsModalPanelReact ref={childRef1} />
        </SplunkThemeProvider>
    );
};

export default SplunkDataCatalogueHomePage;
