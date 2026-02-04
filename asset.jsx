import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import SplunkThemeProvider from '@splunk/themes/SplunkThemeProvider';
import Message from '@splunk/react-ui/Message';
import Button from '@splunk/react-ui/Button';
import Card from '@splunk/react-ui/Card';
import CardLayout from '@splunk/react-ui/CardLayout';
import Menu from '@splunk/react-ui/Menu';
import Remove from '@splunk/react-icons/enterprise/Remove';
import Search from '@splunk/react-icons/enterprise/Search';
import DataSource from '@splunk/react-icons/enterprise/DataSource';
import Text from '@splunk/react-ui/Text';
import Plus from '@splunk/react-icons/enterprise/Plus';
import Select from '@splunk/react-ui/Select';
import Paginator from '@splunk/react-ui/Paginator';
import { isInternalLink, NavigationProvider } from '@splunk/react-ui/Clickable';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import { includes } from 'lodash';
import RadioList from '@splunk/react-ui/RadioList';
import Dropdown from '@splunk/react-ui/Dropdown';
import External from '@splunk/react-icons/External';
import DL from '@splunk/react-ui/DefinitionList';
import Modal from '@splunk/react-ui/Modal';
import P from '@splunk/react-ui/Paragraph';
import Heading from '@splunk/react-ui/Heading';
import Activity from '@splunk/react-icons/Activity';
import Stop from '@splunk/react-icons/enterprise/Stop';
import Cancel from '@splunk/react-icons/enterprise/Cancel';
import SearchToolbar from './HomeDashboard/SearchToolbar';
import { createRESTURL } from '@splunk/splunk-utils/url';


// Custom Imports inside this react App
import { searchKVStore, deleteKVStore } from './ManageKVStore';
import { SortByOptions } from './DropDownData';
import {
    DisplayIndexClassificationIcon,
    DisplayIndexTypeIcon,
    DisplayRoleIcon,
    DisplayIndexUsageIcon,
    DisplayIndexActiveIcon,
    DisplayIndexActivityIcon,
} from './DisplayHomeIcon';
import { HomeHelpMenuReact } from './HomeHelpMenu';
import { getUserRoleDetails } from './GetUserDetails';
import { HomePageHistoryModalPanelReact } from './HomeHistoryModal';
import { HomeIndexDetailsModalPanelReact } from './HomeIndexDetailsModal';

import {
    StyledCard,
    IconRow,
    KPIGrid,
    KPI,
    DLGrid,
    CardFooterBar,
    StatusDot,
} from './HomeDashboard/HomeDashboardCardStyles';



// declare a module-level cache
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

    // Check HTTP status
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(
            `Failed to load ${url}: HTTP ${res.status} ${res.statusText}. ` +
            `Response starts with: ${text?.slice(0, 120) || '[empty]'}`,
        );
    }

    // Verify content-type looks like JSON
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
    const [postsPerPage, setPostsPerPage] = useState(10);
    const [colorScheme, setColorScheme] = useState('dark');
    const [colorFamily, setColorFamily] = useState('prisma');
    const [density, setDensity] = useState('compact');

    const toggle = <Button appearance="toggle" label="Customized Options" isMenu />;
    const [modalOpen, setmodalOpen] = useState(false);
    const [searchFilterName, setSearchFilterName] = useState('index_name');
    const [currentUser, setCurrentUser] = useState();
    const [currentEmail, setCurrentEmail] = useState();
    const [key, setKey] = useState();
    const [indexName, setIndexName] = useState();
    const [isSplunkAdmin, setIsSplunkAdmin] = useState(false);
    const [deleteButtonDisabled, setDeleteButtonDisabled] = useState(true);
    const [deleting, setDeleting] = useState(false); // prevent double submit

    const childRef = useRef();
    const childRef1 = useRef();

    const [oneCMURL, setOneCMURL] = useState('');
    const [splunkURL, setSplunkURL] = useState('');
    const [engagementURL, setEngagementURL] = useState('');

    const handleModalRequestOpen = (key, index_name) => {
        setmodalOpen(true);
        setKey(key);
        setIndexName(index_name);
    };

    const handleModalRequestClose = () => {
        setmodalOpen(false);
    };

    const closeReasons = Dropdown.possibleCloseReasons.filter((r) => r !== 'contentClick');

    // Function to handle Pagination
    const handlePaginatorChange = useCallback((event, { page }) => {
        setCurrentPage(page);
    }, []);

    // Function to remove the Error / Success Message on the screen
    const handleMessageRemove = () => {
        setInfoMessage({ visible: false });
    };

    // ---- FIX: Properly handle loadConfig then/catch and set all URLs ----
    useEffect(() => {
        loadConfig()
            .then((c) => {
                setEngagementURL(c.engagementURL);
                setSplunkURL(c.SplunkURL);
                setOneCMURL(c.oneCMURL);
            })
            .catch((err) => {
                setInfoMessage({
                    visible: true,
                    type: 'error',
                    message: err?.message || 'Failed to load config',
                });
            });
    }, []);

    // Getting the User Details from SPLUNK and set the DeleteButton disabled Based on Admin Rights
    function getUserContext() {
        const defaultErrorMsg =
            'There is some error in data retrieval from SPLUNK KVStore, please try again or refresh this page';
        getUserRoleDetails(defaultErrorMsg)
            .then((response) => {
                if (response.ok) {
                    response.json().then((data) => {
                        setCurrentUser(data.entry[0].content.realname);
                        setCurrentEmail(data.entry[0].content.email);
                        if (data.entry[0].content.roles.includes('admin')) {
                            setIsSplunkAdmin(true);
                            setDeleteButtonDisabled(false);
                        } else {
                            setIsSplunkAdmin(false);
                            setDeleteButtonDisabled(true);
                        }
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

    // Get all the data from KVStore and store it
    function getAssetRegistryHomeData() {
        const defaultErrorMsg =
            'There is some error in data retrieval from SPLUNK KVStore, please try again or refresh this page';
        searchKVStore('splunk_data_catalog_collection', '', '', defaultErrorMsg)
            .then((response) => {
                if (response.ok) {
                    response.json().then((data) => {
                        setAssetValues(Array.isArray(data) ? data : []);
                        if (!data?.length) {
                            setInfoMessage({
                                visible: true,
                                type: 'info',
                                message: 'No entries exist for this index.',
                            });
                        }
                    });
                } else {
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

    // Load the function during page load
    useEffect(() => {
        getAssetRegistryHomeData();
        getUserContext();
    }, []);

    // Card Menu Icon (memoized)
    const HomeMenuCardIcon = useCallback(
        (key, index_name, itam_bsa, pow_number) => (
            <Menu>
                <Menu.Item
                    to={`${oneCMURL}=${itam_bsa}`}
                    openInNewContext
                    icon={<External />}
                    disabled={!itam_bsa}
                >
                    ONECM
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                    to={`${engagementURL}=${pow_number}`}
                    openInNewContext
                    icon={<External />}
                    disabled={!pow_number}
                >
                    POW
                </Menu.Item>
                <Menu.Item
                    to={`${splunkURL}=${index_name}`}
                    openInNewContext
                    icon={<External />}
                    disabled={!index_name}
                >
                    Usage
                </Menu.Item>
                <Menu.Item
                    onClick={() => {
                        setmodalOpen(true);
                        setKey(key);
                        setIndexName(index_name);
                    }}
                    icon={<Remove />}
                    disabled={deleteButtonDisabled}
                >
                    Delete
                </Menu.Item>
                <Menu.Item
                    onClick={() => {
                        // ---- FIX: guard refs with optional chaining ----
                        childRef.current?.handleModalHistoryRequestOpen?.(
                            key,
                            index_name,
                            currentUser,
                            currentEmail,
                            colorScheme
                        );
                    }}
                    icon={<Activity />}
                >
                    History
                </Menu.Item>
                <Menu.Item
                    onClick={() => {
                        // ---- FIX: guard refs with optional chaining ----
                        childRef1.current?.handleModalShowIndexMetaData?.(
                            key,
                            index_name,
                            currentUser,
                            currentEmail,
                            colorScheme
                        );
                    }}
                    icon={<DataSource />}
                >
                    Index Metadata
                </Menu.Item>
            </Menu>
        ),
        [currentUser, currentEmail, colorScheme, deleteButtonDisabled, oneCMURL, engagementURL]
    );

    // Deletion handler for Asset
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
            window.alert(`In NavigationProvider click handler, to: ${to}`); // eslint-disable-line no-alert
        }
    };
    // Normalize query for filter
    const normalizedQuery = useMemo(() => searchTerm.trim().toLowerCase(), [searchTerm]);
    // Filter, sort, and paginate with memoization
    const { sortedResults, currentPageResults, lastpage } = useMemo(() => {
        // Filter
        const filtered = assetValues.filter((item) => {
            if (!normalizedQuery) return true;
            const by = searchFilterName;
            const value = (item?.[by] ?? '').toString().toLowerCase();
            return value.includes(normalizedQuery);
        });

        // Sort (dynamic by sortType)
        const sorted = [...filtered].sort((a, b) => {
            const key = sortType || 'index_name';
            const av = (a?.[key] ?? '').toString();
            const bv = (b?.[key] ?? '').toString();
            return av.localeCompare(bv, undefined, { sensitivity: 'base', numeric: true });
        });

        // Pagination
        const perPage = Number(postsPerPage) || 10;
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

    // ---- FIX: clamp currentPage when lastpage shrinks (e.g., filtering) ----
    useEffect(() => {
        setCurrentPage((p) => Math.min(Math.max(1, p), lastpage));
    }, [lastpage]);

    // Mapping of values into the Card visualization
    const Cards = currentPageResults.map((assetValue) => {
    const isActive =
        String(assetValue.index_active).toLowerCase() === 'true' ||
        assetValue.index_active === 1;

    const TitleWithStatus = (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <StatusDot $active={isActive} />
            <span>{assetValue.index_name}</span>
        </div>
    );

    return (
        <StyledCard key={assetValue._key} accessibilityLabel={`${assetValue.index_name} summary`}>
            <Card.Header
                title={TitleWithStatus}
                subtitle={`AGS: ${assetValue.ags_entitlement_name || '—'}`}
                actionsSecondary={HomeMenuCardIcon(
                    assetValue._key,
                    assetValue.index_name,
                    assetValue.source_itam_bsa,
                    assetValue.pow_number
                )}
                value={assetValue}
            />

            <IconRow aria-label="Index status icons">
                {DisplayIndexClassificationIcon(assetValue.index_classification)}
                {DisplayIndexTypeIcon(assetValue.index_type)}
                {DisplayRoleIcon(assetValue.ags_entitlement_name)}
                {DisplayIndexUsageIcon(assetValue.index_size_mb, assetValue.avg_index_usage_mb)}
                {DisplayIndexActiveIcon(assetValue.index_active)}
                {DisplayIndexActivityIcon(assetValue.index_used)}
            </IconRow>

            <KPIGrid>
                <KPI aria-label="Allocated Size">
                    <div className="label">Allocated Size</div>
                    <div className="value">{`${assetValue.index_size_mb ?? 0}MB`}</div>
                </KPI>
                <KPI aria-label="Average Usage (7 days)">
                    <div className="label">Avg Usage (7d)</div>
                    <div className="value">{`${assetValue.avg_index_usage_mb ?? 0}MB`}</div>
                </KPI>
                <KPI aria-label="Retention">
                    <div className="label">Retention</div>
                    <div className="value">{`${assetValue.index_retention_period ?? 0} Days`}</div>
                </KPI>
            </KPIGrid>

            <Card.Body>
                <DLGrid>
                    <DL.Term>Allocated Size</DL.Term>
                    <DL.Description>{`${assetValue.index_size_mb ?? 0}MB`}</DL.Description>

                    <DL.Term>Avg Usage (7d)</DL.Term>
                    <DL.Description>{`${assetValue.avg_index_usage_mb ?? 0}MB`}</DL.Description>

                    <DL.Term>Index Retention</DL.Term>
                    <DL.Description>{`${assetValue.index_retention_period ?? 0} Days`}</DL.Description>

                    <DL.Term>Flags</DL.Term>
                    <DL.Description>{assetValue.index_used ? 'used' : 'unused'}</DL.Description>
                </DLGrid>

                {assetValue.index_description && (
                    <P style={{ opacity: 0.85, margin: '6px 12px 0 12px' }}>
                        {assetValue.index_description}
                    </P>
                )}
            </Card.Body>

            <CardFooterBar>
                <span style={{ fontSize: 12, opacity: 0.75 }}>
                    {assetValue.pow_number ? `POW: ${assetValue.pow_number}` : ''}
                </span>

                <Card.Footer>
                    <NavigationProvider onClick={handleClick}>
                        <Button
                            to={`manage-asset?key=${assetValue._key}`}
                            openInNewContext
                            aria-label={`Open details for ${assetValue.index_name}`}
                            appearance="primary"
                        >
                            Details
                        </Button>
                    </NavigationProvider>
                </Card.Footer>
            </CardFooterBar>
        </StyledCard>
    );
});
 

    return (
        <SplunkThemeProvider family={colorFamily} colorScheme={colorScheme} density={density}>
            <Card style={{ minWidth: '100%' }}>
                <Heading>Splunk Data Catalog Home</Heading>
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
                    <Modal onRequestClose={handleModalRequestClose} open={modalOpen}>
                        <Modal.Header title="Confirm Selection" onRequestClose={handleModalRequestClose} />
                        <Modal.Body>
                            <P>{`Are you sure you want to delete asset ${indexName}? Please confirm.`}</P>
                            <Button
                                icon={<Stop screenReaderText={null} />}
                                label="Confirm"
                                appearance="destructive"
                                onClick={() => handleAssetDelete(key)}
                                disabled={deleting}
                            />
                            <Button
                                onClick={handleModalRequestClose}
                                label="Cancel"
                                appearance="primary"
                                icon={<Cancel screenReaderText={null} />}
                                disabled={deleting}
                            />
                        </Modal.Body>
                    </Modal>

                    <ControlGroup style={{ float: 'right' }} label="">
                        <Dropdown toggle={toggle} retainFocus closeReasons={closeReasons}>
                            <div style={{ padding: 20, width: 300 }}>
                                <ControlGroup label="Color" labelPosition="top">
                                    <RadioList
                                        name="color_scheme"
                                        value={colorScheme}
                                        onChange={(event, { value }) => {
                                            setColorScheme(value);
                                        }}
                                    >
                                        <RadioList.Option value="light">Light</RadioList.Option>
                                        <RadioList.Option value="dark">Dark</RadioList.Option>
                                    </RadioList>
                                </ControlGroup>

                                <ControlGroup label="Family" labelPosition="top">
                                    <RadioList
                                        name="color_family"
                                        value={colorFamily}
                                        onChange={(event, { value }) => {
                                            setColorFamily(value);
                                        }}
                                    >
                                        <RadioList.Option value="prisma">Prisma</RadioList.Option>
                                        <RadioList.Option value="enterprise">Enterprise</RadioList.Option>
                                    </RadioList>
                                </ControlGroup>

                                <ControlGroup label="Density" labelPosition="top">
                                    <RadioList
                                        name="density"
                                        value={density}
                                        onChange={(event, { value }) => {
                                            setDensity(value);
                                        }}
                                    >
                                        <RadioList.Option value="compact">Compact</RadioList.Option>
                                        <RadioList.Option value="comfortable">Comfortable</RadioList.Option>
                                    </RadioList>
                                </ControlGroup>

                                <ControlGroup label="Sort By" labelPosition="top">
                                    <Select
                                        name="sortType"
                                        onChange={(event, { value }) => {
                                            setSortType(value);
                                        }}
                                        value={sortType}
                                    >
                                        {SortByOptions.map((SortByOption) => (
                                            <Select.Option
                                                key={SortByOption.label}
                                                label={SortByOption.label}
                                                value={SortByOption.value}
                                            />
                                        ))}
                                    </Select>
                                </ControlGroup>

                                <ControlGroup label="Results to Display" labelPosition="top">
                                    <Select
                                        name="ResultsPerPage"
                                        onChange={(event, { value }) => {
                                            setPostsPerPage(Number(value));
                                        }}
                                        value={postsPerPage}
                                    >
                                        <Select.Option label="10" value={10} />
                                        <Select.Option label="20" value={20} />
                                        <Select.Option label="50" value={50} />
                                        <Select.Option label="100" value={100} />
                                    </Select>
                                </ControlGroup>
                            </div>
                        </Dropdown>
                    </ControlGroup>

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

                    {/* 
                    <ControlGroup label="Search Asset">
                        <Text
                            value={searchTerm}
                            name="search_input"
                            onChange={(event) => {
                                setSearchTerm(event.target.value);
                            }}
                            endAdornment={<StyledButton appearance="pill" icon={<Search />} />}
                            inline
                        />
                    </ControlGroup>

                    <ControlGroup label="Search Attribute">
                        <RadioList
                            direction="row"
                            value={searchFilterName}
                            onChange={(event, { value }) => {
                                setSearchFilterName(value);
                            }}
                        >
                            <RadioList.Option value="index_name">Index name</RadioList.Option>
                            <RadioList.Option value="index_description">Index Desc</RadioList.Option>
                            <RadioList.Option value="source_itam_bsa">ITAM BSA</RadioList.Option>
                            <RadioList.Option value="ags_entitlement_name">AGS Group</RadioList.Option>
                            <RadioList.Option value="pow_number">POW Number</RadioList.Option>
                        </RadioList>
                    </ControlGroup>
                    */}

                    <div>
                        <Button
                            icon={<Plus screenReaderText={null} />}
                            label="Add"
                            to={`manage-asset?key=`}
                            openInNewContext
                            appearance="primary"
                        />
                        <HomeHelpMenuReact />
                    </div>

                    <div>
                        <CardLayout cardWidth={280} gutterSize={16} alignCards="left">
                            {Cards}
                        </CardLayout>
                    </div>

                    <Paginator
                        style={{ float: 'right', width: '30%' }}
                        current={currentPage}
                        totalPages={lastpage}
                        onChange={handlePaginatorChange}
                    />
                </Card.Body>
            </Card>
        </SplunkThemeProvider>
    );
};

export default HomeDashboardReact;
