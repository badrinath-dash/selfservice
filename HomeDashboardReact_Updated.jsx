import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import SplunkThemeProvider from '@splunk/themes/SplunkThemeProvider';
import Message from '@splunk/react-ui/Message';
import Button from '@splunk/react-ui/Button';
import Card from '@splunk/react-ui/Card';
import CardLayout from '@splunk/react-ui/CardLayout';
import Plus from '@splunk/react-icons/enterprise/Plus';
import Paginator from '@splunk/react-ui/Paginator';
import { isInternalLink, NavigationProvider } from '@splunk/react-ui/Clickable';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import RadioList from '@splunk/react-ui/RadioList';
import Dropdown from '@splunk/react-ui/Dropdown';
import Modal from '@splunk/react-ui/Modal';
import P from '@splunk/react-ui/Paragraph';
import Heading from '@splunk/react-ui/Heading';
import Stop from '@splunk/react-icons/enterprise/Stop';
import Cancel from '@splunk/react-icons/enterprise/Cancel';
import Select from '@splunk/react-ui/Select';
import SearchToolbar from './HomeDashboard/SearchToolbar';
import { createRESTURL } from '@splunk/splunk-utils/url';

// Custom Imports
import { searchKVStore, deleteKVStore } from './ManageKVStore';
import { SortByOptions } from './DropDownData';
import { HomeHelpMenuReact } from './HomeHelpMenu';
import { getUserRoleDetails } from './GetUserDetails';
import { HomePageHistoryModalPanelReact } from './HomeHistoryModal';
import { HomeIndexDetailsModalPanelReact } from './HomeIndexDetailsModal';
import { IndexCardSplunkbaseStyle } from './SplunkbaseStyleCards';

// Config loading (same as before)
let config;

export async function loadConfig() {
    if (config) return config;
    const url = createRESTURL(`/static/app/splunk-app-asset-registry/config.json`);
    
    let res;
    try {
        res = await fetch(url, { cache: 'no-store', credentials: 'same-origin' });
    } catch (networkErr) {
        throw new Error(`Network error while fetching config.json: ${networkErr?.message || networkErr}`);
    }

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(
            `Failed to load ${url}: HTTP ${res.status} ${res.statusText}. ` +
            `Response starts with: ${text?.slice(0, 120) || '[empty]'}`,
        );
    }

    const ctype = res.headers.get('content-type') || '';
    if (!ctype.toLowerCase().includes('application/json')) {
        const text = await res.text().catch(() => '');
        throw new Error(
            `Expected JSON from ${url} but got content-type "${ctype}". ` +
            `Response starts with: ${text?.slice(0, 120)}`,
        );
    }

    try {
        config = await res.json();
        return config;
    } catch (parseErr) {
        const text = await res.text().catch(() => '');
        throw new Error(
            `Could not parse JSON from ${url}. Error: ${parseErr?.message}. ` +
            `Response starts with: ${text?.slice(0, 120)}`
        );
    }
}

const HomeDashboardReact = () => {
    const [infoMessage, setInfoMessage] = useState({ visible: false });
    const [assetValues, setAssetValues] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortType, setSortType] = useState('index_name');
    const [currentPage, setCurrentPage] = useState(1);
    const [postsPerPage, setPostsPerPage] = useState(12); // Changed default to 12 for better grid layout
    const [colorScheme, setColorScheme] = useState('dark');
    const [colorFamily, setColorFamily] = useState('prisma');
    const [density, setDensity] = useState('compact');

    const toggle = <Button appearance="toggle" label="Customization Options" isMenu />;
    const [modalOpen, setmodalOpen] = useState(false);
    const [searchFilterName, setSearchFilterName] = useState('index_name');
    const [currentUser, setCurrentUser] = useState();
    const [currentEmail, setCurrentEmail] = useState();
    const [key, setKey] = useState();
    const [indexName, setIndexName] = useState();
    const [isSplunkAdmin, setIsSplunkAdmin] = useState(false);
    const [deleteButtonDisabled, setDeleteButtonDisabled] = useState(true);
    const [deleting, setDeleting] = useState(false);

    const childRef = useRef();
    const childRef1 = useRef();

    const [oneCMURL, setOneCMURL] = useState('');
    const [splunkURL, setSplunkURL] = useState('');
    const [engagementURL, setEngagementURL] = useState('');
    const [configLoaded, setConfigLoaded] = useState(false);

    const handleModalRequestOpen = (key, index_name) => {
        setmodalOpen(true);
        setKey(key);
        setIndexName(index_name);
    };

    const handleModalRequestClose = () => {
        setmodalOpen(false);
    };

    const closeReasons = Dropdown.possibleCloseReasons.filter((r) => r !== 'contentClick');

    const handlePaginatorChange = useCallback((event, { page }) => {
        setCurrentPage(page);
    }, []);

    const handleMessageRemove = () => {
        setInfoMessage({ visible: false });
    };

    // Load config
    useEffect(() => {
        loadConfig()
            .then((c) => {
                setEngagementURL(c.engagementURL);
                setSplunkURL(c.SplunkURL);
                setOneCMURL(c.oneCMURL);
                setConfigLoaded(true);
            })
            .catch((err) => {
                setInfoMessage({
                    visible: true,
                    type: 'error',
                    message: err?.message || 'Failed to load config',
                });
            });
    }, []);

    // Get user context
    function getUserContext() {
        const defaultErrorMsg =
            'There is some error in data retrieval from SPLUNK KVStore, please try again or refresh this page';
        getUserRoleDetails(defaultErrorMsg)
            .then((response) => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Failed to fetch user details');
                }
            })
            .then((data) => {
                if (!data?.entry?.[0]?.content) {
                    throw new Error('Invalid response structure');
                }
                setCurrentUser(data.entry[0].content.realname);
                setCurrentEmail(data.entry[0].content.email);
                const isAdmin = data.entry[0].content.roles.includes('admin');
                setIsSplunkAdmin(isAdmin);
                setDeleteButtonDisabled(!isAdmin);
            })
            .catch((err) => {
                setInfoMessage({
                    visible: true,
                    type: 'error',
                    message: err?.message || defaultErrorMsg,
                });
            });
    }

    // Get all data from KVStore
    function getAssetRegistryHomeData() {
        const defaultErrorMsg =
            'There is some error in data retrieval from SPLUNK KVStore, please try again or refresh this page';
        searchKVStore('splunk_data_catalog_collection', '', '', defaultErrorMsg)
            .then((response) => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('No entries exist');
                }
            })
            .then((data) => {
                setAssetValues(Array.isArray(data) ? data : []);
                if (!data?.length) {
                    setInfoMessage({
                        visible: true,
                        type: 'info',
                        message: 'No entries exist for this index.',
                    });
                }
            })
            .catch((err) => {
                setInfoMessage({
                    visible: true,
                    type: 'error',
                    message: err?.message || defaultErrorMsg,
                });
            });
    }

    // Load data on mount
    useEffect(() => {
        getAssetRegistryHomeData();
        getUserContext();
    }, []);

    // Handle asset deletion
    const handleAssetDelete = (key) => {
        const defaultErrorMsg =
            'There are some errors in data retrieval from SPLUNK KVStore, please try again or refresh this page';
        setDeleting(true);
        deleteKVStore('splunk_data_catalog_collection', key, defaultErrorMsg)
            .then((response) => {
                if (response.ok) {
                    setInfoMessage({
                        visible: true,
                        type: 'success',
                        message: 'Successfully removed entry for index from KVStore',
                    });
                    setTimeout(() => {
                        setInfoMessage({ visible: false });
                    }, 1000);
                    handleModalRequestClose();
                    getAssetRegistryHomeData();
                } else {
                    setInfoMessage({
                        visible: true,
                        type: 'error',
                        message: 'Error in removing entry for the selected index, please try again',
                    });
                    handleModalRequestClose();
                }
            })
            .catch((err) => {
                setInfoMessage({
                    visible: true,
                    type: 'error',
                    message: err?.message || defaultErrorMsg,
                });
                handleModalRequestClose();
            })
            .finally(() => setDeleting(false));
    };

    const handleClick = (e, { openInNewContext, to }) => {
        if (!openInNewContext && isInternalLink(to)) {
            e.preventDefault();
            window.alert(`In NavigationProvider click handler, to: ${to}`);
        }
    };

    // Card action handlers
    const handleHistoryClick = useCallback((key, indexName) => {
        childRef.current?.handleModalHistoryRequestOpen?.(
            key,
            indexName,
            currentUser,
            currentEmail,
            colorScheme
        );
    }, [currentUser, currentEmail, colorScheme]);

    const handleMetadataClick = useCallback((key, indexName) => {
        childRef1.current?.handleModalShowIndexMetaData?.(
            key,
            indexName,
            currentUser,
            currentEmail,
            colorScheme
        );
    }, [currentUser, currentEmail, colorScheme]);

    // Normalize query for filter
    const normalizedQuery = useMemo(() => searchTerm.trim().toLowerCase(), [searchTerm]);

    // Filter, sort, and paginate
    const { sortedResults, currentPageResults, lastpage } = useMemo(() => {
        // Filter
        const filtered = assetValues.filter((item) => {
            if (!normalizedQuery) return true;
            const by = searchFilterName;
            const value = (item?.[by] ?? '').toString().toLowerCase();
            return value.includes(normalizedQuery);
        });

        // Sort
        const sorted = [...filtered].sort((a, b) => {
            const key = sortType || 'index_name';
            const av = (a?.[key] ?? '').toString();
            const bv = (b?.[key] ?? '').toString();
            return av.localeCompare(bv, undefined, { sensitivity: 'base', numeric: true });
        });

        // Pagination
        const perPage = Number(postsPerPage) || 12;
        const safeCurrentPage = Math.max(1, currentPage);
        const start = (safeCurrentPage - 1) * perPage;
        const end = start + perPage;
        const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));

        return {
            sortedResults: sorted,
            currentPageResults: sorted.slice(start, end),
            lastpage: totalPages,
        };
    }, [assetValues, normalizedQuery, searchFilterName, sortType, currentPage, postsPerPage]);

    // Reset pagination on filter or size changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, searchFilterName, postsPerPage]);

    // Clamp currentPage when lastpage shrinks
    useEffect(() => {
        setCurrentPage((p) => Math.min(Math.max(1, p), lastpage));
    }, [lastpage]);

    // Render cards using new Splunkbase style
    const Cards = useMemo(() => 
        currentPageResults.map((assetValue) => (
            <IndexCardSplunkbaseStyle
                key={assetValue._key}
                assetValue={assetValue}
                onHistoryClick={handleHistoryClick}
                onMetadataClick={handleMetadataClick}
                onDeleteClick={handleModalRequestOpen}
                isDeleteDisabled={deleteButtonDisabled}
                oneCMURL={oneCMURL}
                engagementURL={engagementURL}
                splunkURL={splunkURL}
                handleClick={handleClick}
            />
        )),
        [currentPageResults, handleHistoryClick, handleMetadataClick, deleteButtonDisabled, 
         oneCMURL, engagementURL, splunkURL, handleClick]
    );

    return (
        <SplunkThemeProvider family={colorFamily} colorScheme={colorScheme} density={density}>
            <Card style={{ minWidth: '100%' }}>
                <Heading level={1}>Splunk Data Catalog</Heading>
                <Card.Body>
                    {infoMessage.visible && (
                        <Message
                            appearance="fill"
                            type={infoMessage.type || 'info'}
                            onRequestRemove={handleMessageRemove}
                        >
                            {infoMessage.message}
                        </Message>
                    )}

                    <HomePageHistoryModalPanelReact ref={childRef} />
                    <HomeIndexDetailsModalPanelReact ref={childRef1} />

                    {/* Delete Confirmation Modal */}
                    <Modal onRequestClose={handleModalRequestClose} open={modalOpen}>
                        <Modal.Header title="Confirm Deletion" onRequestClose={handleModalRequestClose} />
                        <Modal.Body>
                            <P>{`Are you sure you want to delete asset "${indexName}"? This action cannot be undone.`}</P>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                <Button
                                    icon={<Stop screenReaderText={null} />}
                                    label="Confirm Delete"
                                    appearance="destructive"
                                    onClick={() => handleAssetDelete(key)}
                                    disabled={deleting}
                                />
                                <Button
                                    onClick={handleModalRequestClose}
                                    label="Cancel"
                                    appearance="secondary"
                                    icon={<Cancel screenReaderText={null} />}
                                    disabled={deleting}
                                />
                            </div>
                        </Modal.Body>
                    </Modal>

                    {/* Customization Dropdown */}
                    <ControlGroup style={{ float: 'right' }} label="">
                        <Dropdown toggle={toggle} retainFocus closeReasons={closeReasons}>
                            <div style={{ padding: 20, width: 300 }}>
                                <ControlGroup label="Color Scheme" labelPosition="top">
                                    <RadioList
                                        name="color_scheme"
                                        value={colorScheme}
                                        onChange={(event, { value }) => setColorScheme(value)}
                                    >
                                        <RadioList.Option value="light">Light</RadioList.Option>
                                        <RadioList.Option value="dark">Dark</RadioList.Option>
                                    </RadioList>
                                </ControlGroup>

                                <ControlGroup label="Color Family" labelPosition="top">
                                    <RadioList
                                        name="color_family"
                                        value={colorFamily}
                                        onChange={(event, { value }) => setColorFamily(value)}
                                    >
                                        <RadioList.Option value="prisma">Prisma</RadioList.Option>
                                        <RadioList.Option value="enterprise">Enterprise</RadioList.Option>
                                    </RadioList>
                                </ControlGroup>

                                <ControlGroup label="Density" labelPosition="top">
                                    <RadioList
                                        name="density"
                                        value={density}
                                        onChange={(event, { value }) => setDensity(value)}
                                    >
                                        <RadioList.Option value="compact">Compact</RadioList.Option>
                                        <RadioList.Option value="comfortable">Comfortable</RadioList.Option>
                                    </RadioList>
                                </ControlGroup>

                                <ControlGroup label="Sort By" labelPosition="top">
                                    <Select
                                        name="sortType"
                                        onChange={(event, { value }) => setSortType(value)}
                                        value={sortType}
                                    >
                                        {SortByOptions.map((option) => (
                                            <Select.Option
                                                key={option.label}
                                                label={option.label}
                                                value={option.value}
                                            />
                                        ))}
                                    </Select>
                                </ControlGroup>

                                <ControlGroup label="Cards Per Page" labelPosition="top">
                                    <Select
                                        name="ResultsPerPage"
                                        onChange={(event, { value }) => setPostsPerPage(Number(value))}
                                        value={postsPerPage}
                                    >
                                        <Select.Option label="12" value={12} />
                                        <Select.Option label="24" value={24} />
                                        <Select.Option label="48" value={48} />
                                        <Select.Option label="96" value={96} />
                                    </Select>
                                </ControlGroup>
                            </div>
                        </Dropdown>
                    </ControlGroup>

                    {/* Search Toolbar */}
                    <SearchToolbar
                        searchType={searchFilterName}
                        onSearchTypeChange={setSearchFilterName}
                        onSearchTermChange={setSearchTerm}
                        searchTypeOptions={[
                            { value: 'index_name', label: 'Index name' },
                            { value: 'index_description', label: 'Index description' },
                            { value: 'source_itam_bsa', label: 'ITAM BSA' },
                            { value: 'ags_entitlement_name', label: 'AGS group' },
                            { value: 'pow_number', label: 'POW number' },
                        ]}
                        sortType={sortType}
                        onSortTypeChange={setSortType}
                        resultsPerPage={postsPerPage}
                        onResultsPerPageChange={(n) => setPostsPerPage(Number(n))}
                        totalCount={sortedResults.length}
                        visibleCount={currentPageResults.length}
                    />

                    {/* Action Buttons */}
                    <div style={{ marginBottom: '20px', display: 'flex', gap: '8px' }}>
                        <Button
                            icon={<Plus screenReaderText={null} />}
                            label="Add New Index"
                            to={`manage-asset?key=`}
                            openInNewContext
                            appearance="primary"
                        />
                        <HomeHelpMenuReact />
                    </div>

                    {/* Cards Grid - Updated for Splunkbase style */}
                    <div style={{ marginBottom: '24px' }}>
                        <CardLayout cardWidth={320} gutterSize={20} alignCards="left">
                            {Cards}
                        </CardLayout>
                    </div>

                    {/* Pagination */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '14px', color: '#888' }}>
                            Showing {currentPageResults.length} of {sortedResults.length} indexes
                        </div>
                        <Paginator
                            current={currentPage}
                            totalPages={lastpage}
                            onChange={handlePaginatorChange}
                        />
                    </div>
                </Card.Body>
            </Card>
        </SplunkThemeProvider>
    );
};

export default HomeDashboardReact;
