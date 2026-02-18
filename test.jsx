import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import SplunkThemeProvider from '@splunk/themes/SplunkThemeProvider';
import useSplunkTheme from '@splunk/themes/useSplunkTheme';
import { createRESTURL } from '@splunk/splunk-utils/url';
import SearchIcon from '@splunk/react-icons/enterprise/Search';
import Close from '@splunk/react-icons/enterprise/Close';
import Message from '@splunk/react-ui/Message';
import Button from '@splunk/react-ui/Button';
import Card from '@splunk/react-ui/Card';
import CardLayout from '@splunk/react-ui/CardLayout';
import Menu from '@splunk/react-ui/Menu';
import Text from '@splunk/react-ui/Text';
import Select from '@splunk/react-ui/Select';
import Paginator from '@splunk/react-ui/Paginator';
import { isInternalLink, NavigationProvider } from '@splunk/react-ui/Clickable';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import RadioList from '@splunk/react-ui/RadioList';
import Dropdown from '@splunk/react-ui/Dropdown';
import External from '@splunk/react-icons/enterprise/External';
import Modal from '@splunk/react-ui/Modal';
import P from '@splunk/react-ui/Paragraph';
import Heading from '@splunk/react-ui/Heading';
import DL from '@splunk/react-ui/DefinitionList';

import Metrics from '@splunk/react-icons/enterprise/Metrics';
import Event from '@splunk/react-icons/enterprise/Events';

import Remove from '@splunk/react-icons/enterprise/Remove';
import Search from '@splunk/react-icons/enterprise/Search';
import DataSource from '@splunk/react-icons/enterprise/DataSource';
import Plus from '@splunk/react-icons/enterprise/Plus';
import Activity from '@splunk/react-icons/enterprise/Activity';
import Stop from '@splunk/react-icons/enterprise/Stop';
import Cancel from '@splunk/react-icons/enterprise/Cancel';


import { searchKVStore, deleteKVStore } from '../common/ManageKVStore';

import { SortByOptions } from '../common/DropDownData';
import { HomeHelpMenuReact } from '../components/DataCatalogueHome/HomeHelpMenu';
import HomePageHistoryModalPanelReact from '../components/DataCatalogueHome/HomeHistoryModal';
import HomeIndexDetailsModalPanelReact from '../components/DataCatalogueHome/HomeIndexDetailsModal';
import getUserRoleDetails from '../common/GetUserDetails';
import ModernSearchBar from '../components/DataCatalogueHome/ModernSearchBar';
import Chip from '@splunk/react-ui/Chip';
import { loadConfig } from '../components/DataCatalogueHome/config';
import DescriptionPopover from '../components/DataCatalogueHome/IndexDescPopOver';



// Optional: a tiny debounce hook (feel free to move this to a utils file)
function useDebouncedValue(value, delay = 250) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return debounced;
}


function buildUrl(base, paramName, value) {
    if (!base || value == null || value === '') return undefined;
    try {
        // Works whether base is absolute (https://...) or relative (/path)
        const url = new URL(base, window.location.origin);
        url.searchParams.set(paramName, String(value));
        return url.toString();
    } catch {
        // If base is something like "https://x/y?foo=1" we can still append safely
        const sep = base.includes('?') ? '&' : '?';
        return `${base}${sep}${encodeURIComponent(paramName)}=${encodeURIComponent(String(value))}`;
    }
}





const SplunkDataCatalogueHomePage = () => {
    const [infoMessage, setInfoMessage] = useState({ visible: false });
    const [assetValues, setAssetValues] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    // Here’s a dedicated list for search attributes:
    const searchFieldOptions = useMemo(() => ([
        { label: 'Index Name', value: 'index_name' },
        { label: 'Index Description', value: 'index_description' },
        { label: 'ITAM BSA', value: 'source_itam_bsa' },
        { label: 'Linked Access Group', value: 'ags_entitlement_name' },
        { label: 'Splunk Engagement Reference', value: 'pow_number' }
    ]), []);

    const [searchFilterName, setSearchFilterName] = useState(searchFieldOptions[0].value);
    const [sortType, setSortType] = useState('index_name');
    const [currentPage, setCurrentPage] = useState(1);
    const [postsPerPage, setPostsPerPage] = useState(10); // store as number
    const [colorScheme, setColorScheme] = useState('dark');
    const [colorFamily, setColorFamily] = useState('prisma');
    const [density, setDensity] = useState('compact');
    const modalToggle = useRef(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [keyToDelete, setKeyToDelete] = useState(null);
    const [indexNameToDelete, setIndexNameToDelete] = useState('');
    const [currentUser, setCurrentUser] = useState();
    const [currentEmail, setCurrentEmail] = useState();
    const [isSplunkAdmin, setIsSplunkAdmin] = useState(false);
    const [deleteButtonDisabled, setDeleteButtonDisabled] = useState(true);
    const { isComfortable, focusColor } = useSplunkTheme();
    const [engagementURL, setEngagementURL] = useState();
    const [splunkURL, setSplunkURL] = useState();
    const [oneCMURL, setOneCMURL] = useState();
    const [activePopover, setActivePopover] = useState(null);


    const childRef = useRef();
    const childRef1 = useRef();


    const DEFAULT_FILTERS = {
        activeOnly: 'all',     // all | active | inactive
        type: 'all',           // all | events | metrics
        classification: 'all', // optional if you implement
        showInternal: 'exclude', // exclude | all | only
    };



    const [activeFilters, setActiveFilters] = useState(DEFAULT_FILTERS);

    // --- Styling tokens (JSX objects) ---

    const modernCardStyle = {
        position: 'relative',
        background: 'rgba(255, 255, 255, 0.03)', // Glass effect base
        backdropFilter: 'blur(12px)',
        borderRadius: '24px', // Softer corners
        border: '1px solid rgba(255, 255, 255, 0.08)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
    };

    const searchWrapperStyle = {
        maxWidth: '800px',
        margin: '0 auto 40px auto',
        padding: '4px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    };

    const IconCircle = ({ children }) => (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 22,
                height: 22,
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(255,255,255,0.06)',
                flex: '0 0 auto',
            }}
        >
            {children}
        </span>
    );


    const cardShellStyle = {
        position: 'relative',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 18,
        boxShadow: '0 10px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
        overflow: 'hidden',
    };

    const sectionPad = { padding: '14px 16px' };

    const titleStyle = {
        fontSize: 16,
        fontWeight: 600,
        color: '#FFFFFF',
        lineHeight: 1.25,
    };

    const subtitleStyle = {
        color: '#A8B3BD',
        fontSize: 12,
        marginTop: 2,
    };

    const bodyTextStyle = {
        color: '#DDE3EA',
        fontSize: 13,
        lineHeight: 1.5,
    };

    // Optional: clamp description to 3 lines so cards stay even
    const clamp3 = {
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
    };



    const MetaRow = ({ label, children }) => (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '140px 1fr',
            gap: 12,
            alignItems: 'center',
            padding: '8px 0',
            borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
            <div style={{ color: '#9AA4AE', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
            <div>{children}</div>
        </div>
    );

    // Top-right badge (Event/Metrics) that floats over the header
    const TopRightBadge = ({ label }) => (
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
            <Chip appearance={label === 'Metrics' ? 'info' : 'success'} outline>{label}</Chip>
        </div>
    );
    // Debounce the text so filter only runs after pause
    const debouncedSearchTerm = useDebouncedValue(searchTerm, 250);


    const closeReasons = useMemo(() => {
        // keep content clicks open
        return Dropdown.possibleCloseReasons.filter((r) => r !== 'contentClick');
    }, []);





    // Optional: explicit submit (if you want instant, you can omit onSubmit)
    const handleSearchSubmit = () => {
        // No-op because we already filter via debouncedSearchTerm.
        // Keep it for keyboard accessibility or analytics.
    };





    useEffect(() => {
        const onKey = (e) => {
            if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                document.querySelector('input[name="search_input"]')?.focus();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);


    // Reset Page when Search Changes 
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, searchFilterName, postsPerPage, sortType, activeFilters]);



    // --- Data loading ---
    useEffect(() => {
        const defaultErrorMsg =
            'There is some error in data retrival from SPLUNK KVStore, please try again or refresh this page';

        searchKVStore('splunk_data_catalog_collection', '', '', defaultErrorMsg)
            .then((response) => {
                if (response.ok) {
                    response.json().then((data) => setAssetValues(Array.isArray(data) ? data : []));
                } else {
                    setInfoMessage({
                        visible: true,
                        type: 'info',
                        message: 'No entry exists for this index',
                    });
                }
            })
            .catch((err) => {
                setInfoMessage({
                    visible: true,
                    type: 'error',
                    message: err || defaultErrorMsg,
                });
            });

        // user context
        getUserRoleDetails(defaultErrorMsg).then((response) => {
            if (response.ok) {
                response.json().then((data) => {
                    const content = data?.entry?.[0]?.content;
                    setCurrentUser(content?.realname);
                    setCurrentEmail(content?.email);
                    const admin = Array.isArray(content?.roles) && content.roles.includes('admin');
                    setIsSplunkAdmin(!!admin);
                    setDeleteButtonDisabled(!admin);
                });
            }
        });
    }, []);

    useEffect(() => {
        loadConfig()
            .then((c) => {
                setEngagementURL(c.engagementURL);
                setOneCMURL(c.oneCMURL);
                setSplunkURL(c.SplunkURL);
            })
            .catch((err) => {
                setInfoMessage({
                    visible: true,
                    type: 'error',
                    message: err?.message || 'Failed to load config',
                });
            });
    }, []);

    // --- Handlers ---
    const handleModalRequestOpen = useCallback((key, index_name) => {
        setModalOpen(true);
        setKeyToDelete(key);
        setIndexNameToDelete(index_name);
    }, []);

    const handleModalRequestClose = useCallback(() => {
        setModalOpen(false);
        modalToggle?.current?.focus?.();
    }, []);

    const handleMessageRemove = useCallback(() => {
        setInfoMessage({ visible: false });
    }, []);

    const handleClick = useCallback((e, { openInNewContext, to }) => {
        if (!openInNewContext && isInternalLink(to)) {
            e.preventDefault();
            window.alert(`In NavigationProvider click handler, to: ${to}`); // eslint-disable-line no-alert
        }
    }, []);

    const handleAssetDelete = useCallback(
        (key) => {
            const defaultErrorMsg =
                'There are some errors in data retrival from SPLUNK KVStore, please try again or refresh this page';

            deleteKVStore('splunk_data_catalog_collection', key, defaultErrorMsg)
                .then((response) => {
                    if (response.ok) {
                        setInfoMessage({
                            visible: true,
                            type: 'success',
                            message: 'Successfully removed entry for index from KVStore',
                        });
                        setTimeout(() => setInfoMessage({ visible: false }), 1000);
                        handleModalRequestClose();

                        // refresh list
                        searchKVStore('splunk_data_catalog_collection', '', '', defaultErrorMsg)
                            .then((res) => res.ok && res.json().then((d) => setAssetValues(Array.isArray(d) ? d : [])));
                    } else {
                        setInfoMessage({
                            visible: true,
                            type: 'error',
                            message: 'Error removing entry for the selected index. Please try again.',
                        });
                        handleModalRequestClose();
                    }
                })
                .catch((err) => {
                    setInfoMessage({
                        visible: true,
                        type: 'error',
                        message: err || defaultErrorMsg,
                    });
                    handleModalRequestClose();
                });
        },
        [handleModalRequestClose]
    );

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, searchFilterName, postsPerPage, sortType]);

    // --- Derived data: filter, sort, paginate ---
    const normalizedSearch = debouncedSearchTerm.trim().toLowerCase();

    //   const filteredResults = useMemo(() => {
    //     if (!normalizedSearch) return assetValues;

    //     return assetValues.filter((row) => {
    //       const field = (row?.[searchFilterName] ?? '').toString().toLowerCase();
    //       return field.includes(normalizedSearch);
    //     });
    //   }, [assetValues, normalizedSearch, searchFilterName]);

    const IndexTypeIndicator = ({ type }) => {
        const isMetrics = type?.toLowerCase() === 'metrics';
        const iconColor = isMetrics ? '#996dffff' : '#00d100ff';
        const IconComponent = isMetrics ? Metrics : Event;

        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: `${iconColor}22`,
                border: `1px solid ${iconColor}44`,
                color: iconColor,
                flexShrink: 0 // Prevents icon from squishing
            }}>
                <IconComponent size={1.2} />
            </div>
        );
    };

    const filteredResults = useMemo(() => {

        const isInternalIndex = (row) => {
            // Option 1: infer from name
            const name = (row?.index_name ?? '').toString();
            return name.startsWith('_');
        };

        return assetValues.filter((row) => {
            // 1. Search bar logic
            const matchesSearch = (row?.[searchFilterName] ?? '').toString().toLowerCase().includes(normalizedSearch);

            // 2. Status logic
            const matchesStatus = (() => {

                // Normalize the backend data to Boolean
                const isActive = row.index_active === 'Y';

                if (activeFilters.activeOnly === 'all') return true;
                if (activeFilters.activeOnly === 'active') return isActive;
                if (activeFilters.activeOnly === 'inactive') return !isActive;

                return true;
            })();

            // 3. Type logic
            const type = (row.index_type || '').toLowerCase();
            let matchesType = false;

            if (activeFilters.type === 'all') {
                matchesType = true;

            } else if (activeFilters.type === 'events') {
                matchesType = type === 'event' || type === 'summary';
            } else if (activeFilters.type === 'metrics') {
                matchesType = type === 'metrics' || type === 'summary-metrics';
            }


            // 4. Internal Index logic
            const internal = isInternalIndex(row);
            const matchesInternal =
                activeFilters.showInternal === 'all' ||
                (activeFilters.showInternal === 'exclude' ? !internal : internal);

            // FIX: Added '&& matchesInternal' to the return statement
            return matchesSearch && matchesStatus && matchesType && matchesInternal;
        });
    }, [assetValues, searchFilterName, normalizedSearch, activeFilters]);

    const ConvertValuesForDisplay = (mbValue) => {
        const num = Number(mbValue);
        if (!num) return '0 MB'

        if (num >= 1000000) {
            return `${((num / 1024) / 1024).toFixed(2)} TB`
        }

        if (num >= 1000) {
            return `${(num / 1024).toFixed(2)} GB`
        }


        return `${num} MB`
    }

    const compareValues = useCallback(
        (key) => (a, b) => {
            const av = a?.[key];
            const bv = b?.[key];

            // Handle undefined/null
            if (av == null && bv == null) return 0;
            if (av == null) return 1;
            if (bv == null) return -1;

            // Numeric compare if both look like numbers
            const an = Number(av);
            const bn = Number(bv);
            const bothNumeric = !Number.isNaN(an) && !Number.isNaN(bn);

            if (bothNumeric) return an - bn;

            // Fallback to string compare
            return String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' });
        },
        []
    );



    const sortedResults = useMemo(() => {
        const copy = [...filteredResults];

        // 1. Parse the sort selection (e.g., "index_size_mb:desc")
        // If sortType is simple "index_name", default to asc
        const [key, direction] = String(sortType).includes(':')
            ? sortType.split(':')
            : [sortType, 'asc'];

        const isDesc = direction === 'desc';

        copy.sort((a, b) => {
            let valA = a[key];
            let valB = b[key];

            // 2. Handle nulls/undefined (always push to bottom)
            if (valA == null && valB == null) return 0;
            if (valA == null) return 1;
            if (valB == null) return -1;

            // 3. numeric detection
            // We check if the string is purely numeric (e.g. "1024", "50.5")
            // This prevents "100" from coming before "2" in string sort
            const numA = Number(valA);
            const numB = Number(valB);

            if (!isNaN(numA) && !isNaN(numB)) {
                return isDesc ? numB - numA : numA - numB;
            }

            // 4. String comparison (case-insensitive)
            const strA = String(valA).toLowerCase();
            const strB = String(valB).toLowerCase();

            if (strA < strB) return isDesc ? 1 : -1;
            if (strA > strB) return isDesc ? -1 : 1;
            return 0;
        });

        return copy;
    }, [filteredResults, sortType]);

    const totalPages = Math.max(1, Math.ceil(sortedResults.length / Number(postsPerPage)));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const start = (safeCurrentPage - 1) * Number(postsPerPage);
    const end = start + Number(postsPerPage);
    const currentPageResults = useMemo(() => sortedResults.slice(start, end), [sortedResults, start, end]);


    useEffect(() => {
        console.log('Parent searchFilterName:', searchFilterName);
    }, [searchFilterName]);



    
const getClassificationChipConfig = (index_classification) => {
  const key = (index_classification ?? '').toString().trim().toLowerCase();

  // Map of classification -> label + appearance + outline (optional)
  const map = {
    application: { label: 'Application', appearance: 'success' },
    network:     { label: 'Network',     appearance: 'info', outline: true },
    security:    { label: 'Security',    appearance: 'error' },
    test:        { label: 'Test',        appearance: 'warning' },

    
  };

  // Fallback
  return map[key] || { label: 'Other', appearance: 'default', outline: true };
};



   


    // Ellipsis toggle for menu (top-right)
    const renderEllipsisMenu = (assetValue, indexName) => (
        <Dropdown
            retainFocus
            closeReasons={closeReasons}
            toggle={
                <Button
                    appearance="toggle"
                    isMenu
                    aria-label="More actions"
                    label="⋯" // ellipsis
                />
            }
        >
            <HomeMenuCardIcon
                _key={assetValue?._key}
                index_name={indexName}
                source_itam_bsa={assetValue?.source_itam_bsa}
                pow_number={assetValue?.pow_number}
            />
        </Dropdown>
    );

    // --- Menu factory ---
    function HomeMenuCardIcon({ _key, index_name, source_itam_bsa, pow_number }) {

        const itamUrl = buildUrl(oneCMURL, 'bsa', source_itam_bsa);
        const powUrl = buildUrl(engagementURL, 'pow', pow_number);
        const usageUrl = buildUrl(splunkURL, 'q', index_name);


        return (
            <Menu>
                <Menu.Item
                    to={itamUrl}
                    openInNewContext
                    icon={<External />}
                    disabled={!itamUrl}
                >
                    ONECM
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                    to={powUrl}
                    openInNewContext
                    icon={<External />}
                    disabled={!powUrl}
                >
                    POW
                </Menu.Item>
                <Menu.Item
                    to={usageUrl}
                    openInNewContext
                    icon={<External />}
                    disabled={!usageUrl}
                >
                    Usage
                </Menu.Item>
                <Menu.Item
                    onClick={() => handleModalRequestOpen(_key, index_name)}
                    icon={<Remove />}
                    disabled={deleteButtonDisabled}
                >
                    Delete
                </Menu.Item>
                <Menu.Item
                    onClick={() =>
                        childRef.current?.handleModalHistoryRequestOpen(
                            _key,
                            index_name,
                            currentUser,
                            currentEmail,
                            colorScheme
                        )
                    }
                    icon={<Activity />}
                >
                    History
                </Menu.Item>
                <Menu.Item
                    onClick={() =>
                        childRef1.current?.handleModalShowIndexMetaData(
                            _key,
                            index_name,
                            currentUser,
                            currentEmail,
                            colorScheme
                        )
                    }
                    icon={<DataSource />}
                >
                    Index Metadata
                </Menu.Item>
            </Menu>
        );
    }

    return (
        <SplunkThemeProvider family="prisma" colorScheme="dark" density="comfortable">
            <div style={{ padding: '40px', maxWidth: '1600px', margin: '0 auto' }}>

                {/* Header Section */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <Heading level={1} style={{ fontSize: '36px', fontWeight: 800 }}>Data Catalogue</Heading>

                    {/* Merged Search Bar + Results Count Container */}
                    <div style={{
                        ...searchWrapperStyle,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '4px 20px 4px 4px', // Extra padding on right for text
                        gap: '12px' // Space between search bar and count
                    }}>
                        {/* Search Input Area */}
                        <div style={{ flex: 1 }}>
                            <ModernSearchBar
                                value={searchTerm}
                                onChange={setSearchTerm}
                                placeholder="Search indexes...( / )"
                                filterKey={searchFilterName}
                                onFilterKeyChange={(e) => setSearchFilterName(e)}
                                options={searchFieldOptions}
                            />
                        </div>

                        {/* Divider Line */}
                        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />

                        {/* Results Count Text */}
                        <div style={{
                            color: '#9AA4AE',
                            fontSize: '14px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            minWidth: '80px', // Prevents jumping when numbers change
                            textAlign: 'right'
                        }}>
                            {filteredResults.length} Results
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>

                    {/* --- MODERN FILTER SIDEBAR --- */}
                    <aside style={{ width: '280px', position: 'sticky', top: '40px' }}>

                        <div style={{ marginBottom: '32px' }}>
                            <Heading level={4} style={{ color: '#9AA4AE', marginBottom: '12px' }}>Sort Records</Heading>
                            <Select
                                value={sortType}
                                onChange={(_, { value }) => setSortType(value)}
                                style={{ width: '100%' }}
                            >
                                {SortByOptions.map(opt => <Select.Option key={opt.value} label={opt.label} value={opt.value} />)}
                            </Select>
                        </div>

                        <div style={{ marginBottom: '32px' }}>
                            <Heading level={4} style={{ color: '#9AA4AE', marginBottom: '12px' }}>Internal Indexes</Heading>
                            <RadioList
                                value={activeFilters.showInternal}
                                onChange={(_, { value }) => setActiveFilters(p => ({ ...p, showInternal: value }))}
                            >
                                <RadioList.Option value="exclude">Hide Internal (_)</RadioList.Option>
                                <RadioList.Option value="all">Show All</RadioList.Option>
                                <RadioList.Option value="only">Only Internal</RadioList.Option>
                            </RadioList>
                        </div>

                        <div style={{ marginBottom: '32px' }}>
                            <Heading level={4} style={{ marginBottom: '16px', color: '#9AA4AE' }}>Status</Heading>
                            <RadioList
                                value={activeFilters.activeOnly}
                                onChange={(_, { value }) => setActiveFilters(prev => ({ ...prev, activeOnly: value }))}
                            >
                                <RadioList.Option value="all">All Assets</RadioList.Option>
                                <RadioList.Option value="active">Active Only</RadioList.Option>
                                <RadioList.Option value="inactive">Inactive</RadioList.Option>
                            </RadioList>
                        </div>

                        <div style={{ marginBottom: '32px' }}>
                            <Heading level={4} style={{ marginBottom: '16px', color: '#9AA4AE' }}>Index Type</Heading>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {['all', 'events', 'metrics'].map(type => (
                                    <Chip
                                        key={type}
                                        appearance={activeFilters.type === type ? 'info' : 'success'}
                                        onClick={() => setActiveFilters(prev => ({ ...prev, type }))}
                                        style={{ cursor: 'pointer', textTransform: 'capitalize' }}
                                    >
                                        {type}
                                    </Chip>
                                ))}
                            </div>
                        </div>
                        <div style={{ marginBottom: '32px' }}>
                            <Heading level={4} style={{ color: '#9AA4AE', marginBottom: '12px' }}>Results Per Page</Heading>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {[10, 20, 50].map(size => (
                                    <Chip
                                        key={size}
                                        appearance={postsPerPage === size ? 'info' : 'success'}
                                        onClick={() => setPostsPerPage(size)}
                                        style={{ cursor: 'pointer', textTransform: 'capitalize' }}
                                    >
                                        {String(size)}
                                    </Chip>
                                ))}
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                            <Button
                                appearance="pill"
                                label="Clear All Filters"
                                onClick={() => setActiveFilters(DEFAULT_FILTERS)}
                                style={{ width: '100%' }}
                            />
                        </div>
                    </aside>


                    {/* --- MAIN CONTENT AREA --- */}
                    <main style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <HomeHelpMenuReact />
                                <Button appearance="primary" icon={<Plus />} label="Add" to="manage-asset?key=" />
                            </div>
                        </div>

                        {/* REPLACEMENT: CSS Grid instead of CardLayout for perfect gutters and sizing */}
                        <div style={{
                            display: 'grid',
                            // This creates columns that are at least 300px wide, but fill the space. 
                            // Adjust '300px' if you want wider/narrower cards.
                            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                            gap: '24px', // This is your controlled Gutter size
                            alignItems: 'stretch' // Ensures all cards in a row are the same height
                        }}>
                            {currentPageResults.map((asset) => {
                                const classificationChip = getClassificationChipConfig(asset.index_classification); 
                                return (
                                <div key={asset._key}
                                    style={{
                                        ...modernCardStyle,
                                        height: 'auto', // Let flex handle height
                                        display: 'flex',
                                        flexDirection: 'column',
                                        maxWidth: '100%', // Prevent escaping grid cell
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)';
                                        e.currentTarget.style.transform = 'translateY(-5px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    {/* 1. Header: Icon + Name on Left, Menu on Right */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        marginBottom: '16px',
                                        gap: '12px',
                                        minWidth: 0 // Crucial for flex child truncation
                                    }}>
                                        <div style={{ display: 'flex', gap: '12px', minWidth: 0, flex: 1 }}>
                                            {/* Icon - Fixed width so it doesn't shrink */}
                                            <div style={{ flexShrink: 0 }}>
                                                <IndexTypeIndicator type={asset.index_type} />
                                            </div>

                                            {/* Title - Forces truncation if too long */}
                                            <div style={{
                                                fontSize: '18px',
                                                fontWeight: 700,
                                                color: '#fff',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                minWidth: 0
                                            }} title={asset.index_name}>
                                                {asset.index_name}
                                            </div>
                                        </div>

                                        {/* Menu - Pushed to right */}
                                        <div style={{ flexShrink: 0 }}>
                                            {renderEllipsisMenu(asset, asset.index_name)}
                                        </div>
                                    </div>

                                    {/* 2. Content Body */}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

                                        {/* Metadata Pills */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                                            <Chip appearance={asset.index_active === 'Y' ? 'success' : 'info'}>
                                                {asset.index_active === 'Y' ? 'Active' : 'InActive'}
                                            </Chip>
                                            <Chip appearance={classificationChip.appearance} outline={classificationChip.outline}>
                                                {classificationChip.label}
                                            </Chip>
                                        </div>
                                        

                                        {/* Stats "Bento" Row */}
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: '12px',
                                            background: 'rgba(0,0,0,0.2)',
                                            padding: '12px',
                                            borderRadius: '12px',
                                            marginBottom: '20px'
                                        }}>
                                            <div>
                                                <div style={{ fontSize: '10px', color: '#9AA4AE', textTransform: 'uppercase' }}>Size</div>
                                                <div style={{ fontSize: '14px', fontWeight: 600 }}>{ConvertValuesForDisplay(asset.index_size_mb)}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '10px', color: '#9AA4AE', textTransform: 'uppercase' }}>Avg Usage</div>
                                                <div style={{ fontSize: '14px', fontWeight: 600 }}>{ConvertValuesForDisplay(asset.avg_index_usage_mb)}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '10px', color: '#9AA4AE', textTransform: 'uppercase' }}>Retention</div>
                                                <div style={{ fontSize: '14px', fontWeight: 600 }}>{asset.index_retention_period} Days</div>
                                            </div>
                                        </div>

                                        {/* Description: Strict Containment */}
                                        <div style={{ flex: 1, marginBottom: '20px', ...bodyTextStyle }}>
                                            <DescriptionPopover text={asset.index_description} />
                                        </div>
                                    </div>

                                    {/* 3. Footer Button */}
                                    <div style={{ marginTop: 'auto' }}>
                                        <Button
                                            appearance="secondary"
                                            label="View Details"
                                            style={{ width: '100%', borderRadius: '12px' }}
                                            to={`manage-asset?key=${asset._key}`}
                                        />
                                    </div>
                                </div>
                                );
                            })}
                        </div>

                        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
                            <Paginator
                                current={safeCurrentPage}
                                totalPages={totalPages}
                                onChange={(_, { page }) => setCurrentPage(page)}
                            />
                        </div>
                    </main>
                    <HomePageHistoryModalPanelReact ref={childRef} />
                    <HomeIndexDetailsModalPanelReact ref={childRef1} />
                </div>
            </div>
        </SplunkThemeProvider>
    );
};

export default SplunkDataCatalogueHomePage;
