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
import {
    DisplayIndexClassificationIcon,
    DisplayIndexTypeIcon,
    DisplayRoleIcon,
    DisplayIndexUsageIcon,
    DisplayIndexActiveIcon,
    DisplayIndexActivityIcon,
} from '../components/DataCatalogueHome/DisplayHomeIcon';
import { HomeHelpMenuReact } from '../components/DataCatalogueHome/HomeHelpMenu';
import { HomePageHistoryModalPanelReact } from '../components/DataCatalogueHome/HomeHistoryModal';
import { HomeIndexDetailsModalPanelReact } from '../components/DataCatalogueHome/HomeIndexDetailsModal';
import getUserRoleDetails from '../common/GetUserDetails';
import ModernSearchBar from '../components/DataCatalogueHome/ModernSearchBar';
import Chip from '@splunk/react-ui/Chip';
import { loadConfig } from '../components/DataCatalogueHome/config';

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


/**
 * ModernSearchBar
 *
 * Props:
 * - value: string           // current search text
 * - onChange: (s) => void   // setSearchTerm
 * - filterKey: string       // current field key
 * - onFilterKeyChange: (k)  // setSearchFilterName
 * - options: Array<{label, value}>
 * - onSubmit?: () => void   // optional explicit submit
 * - placeholder?: string
 */


const SplunkDataCatalogueHomePage = () => {
    const [infoMessage, setInfoMessage] = useState({ visible: false });
    const [assetValues, setAssetValues] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchFilterName, setSearchFilterName] = useState('index_name');
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
    const dropdownToggle = <Button appearance="toggle" label="Customized Options" isMenu />;

    const childRef = useRef();
    const childRef1 = useRef();

    const [activeFilters, setActiveFilters] = useState({
        activeOnly: 'all',       // 'all', 'active', 'inactive'
        type: 'all',             // 'all', 'events', 'metrics'
        classification: 'all',
        showInternal: 'exclude', // 'exclude', 'all', 'only'
    });
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

    // --- Helpers (JSX only) ---

    // Lightweight pill/chip (replaces tiny icons with readable labels)
    // const Chip = ({ children, tone = 'neutral', outline, style }) => {
    //     const palettes = {
    //         neutral: { bg: 'rgba(255,255,255,0.06)', fg: '#E6E6E6', br: 'rgba(255,255,255,0.18)' },
    //         success: { bg: 'rgba(52,199,89,0.18)', fg: '#C7F7D1', br: 'rgba(52,199,89,0.35)' },
    //         info: { bg: 'rgba(64,156,255,0.18)', fg: '#CFE5FF', br: 'rgba(64,156,255,0.35)' },
    //         warning: { bg: 'rgba(255,159,10,0.18)', fg: '#FFE2B8', br: 'rgba(255,159,10,0.35)' },
    //         danger: { bg: 'rgba(255,69,58,0.18)', fg: '#FFC9C6', br: 'rgba(255,69,58,0.35)' },
    //     };
    //     const p = palettes[tone] || palettes.neutral;

    //     const base = {
    //         display: 'inline-flex',
    //         alignItems: 'center',
    //         gap: 8,
    //         padding: '4px 8px',
    //         borderRadius: 999,
    //         fontSize: 12,
    //         fontWeight: 600,
    //         letterSpacing: .2,
    //         whiteSpace: 'nowrap',
    //         border: `1px solid ${outline ? p.br : 'transparent'}`,
    //         background: outline ? 'transparent' : p.bg,
    //         color: p.fg,
    //         backdropFilter: 'blur(2px)',
    //     };
    //     return <span style={{ ...base, ...style }}>{children}</span>;
    // };

    // Key/Value row with soft divider
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


    // If you want to use SortByOptions for search fields, pass another list.
    // Here’s a dedicated list for search attributes:
    const searchFieldOptions = useMemo(() => ([
        { label: 'Index name', value: 'index_name' },
        { label: 'Index description', value: 'index_description' },
        { label: 'ITAM BSA', value: 'source_itam_bsa' },
        { label: 'AGS group', value: 'ags_entitlement_name' },
        { label: 'POW number', value: 'pow_number' },
    ]), []);


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
    const t = (type || '').toLowerCase();
    const isMetrics = t === 'metrics';

    const iconColor = isMetrics ? '#B66DFF' : '#00D1AF';
    const IconComponent = isMetrics ? Metrics : Event;

    return (
        <div
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 10,
                background: `${iconColor}22`,
                border: `1px solid ${iconColor}44`,
                color: iconColor,
            }}
            title={isMetrics ? 'Metrics' : 'Event'}
        >
            <IconComponent size={16} />
        </div>
    );
};


    const filteredResults = useMemo(() => {
        return assetValues.filter((row) => {
            // Search bar logic
            const matchesSearch = (row?.[searchFilterName] ?? '').toString().toLowerCase().includes(normalizedSearch);

            // Sidebar filter logic
            const matchesStatus = activeFilters.activeOnly === 'all' ||
                (activeFilters.activeOnly === 'active' ? row.index_active : !row.index_active);

            const matchesType = activeFilters.type === 'all' ||
                (row.index_type || '').toLowerCase() === activeFilters.type;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [assetValues, searchFilterName, normalizedSearch, activeFilters]);



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
        // If sortType is compound like 'index_name:desc', split and handle.
        const [key, dir] = String(sortType).split(':');
        copy.sort(compareValues(key || 'index_name'));
        if (dir === 'desc') copy.reverse();
        return copy;
    }, [filteredResults, sortType, compareValues]);

    const totalPages = Math.max(1, Math.ceil(sortedResults.length / Number(postsPerPage)));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const start = (safeCurrentPage - 1) * Number(postsPerPage);
    const end = start + Number(postsPerPage);
    const currentPageResults = useMemo(() => sortedResults.slice(start, end), [sortedResults, start, end]);

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

                {/* Header Section remains at the top */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <Heading level={1} style={{ fontSize: '36px', fontWeight: 800 }}>Data Catalogue</Heading>
                    {/* <div style={searchWrapperStyle}>
                        <ModernSearchBar
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Search indexes..."
                        />
                    </div> */}
                </div>

                <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>

                    {/* --- MODERN FILTER SIDEBAR --- */}
                    <aside style={{ width: '280px', position: 'sticky', top: '40px', paddingRight: '10px' }}>

                        {/* --- 1. SORT BY SECTION --- */}
                        <div style={{ marginBottom: '32px' }}>
                            <Heading level={4} style={{ marginBottom: '16px', color: '#9AA4AE', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Activity size={1} /> Sort By
                            </Heading>
                            <Select
                                name="sortType"
                                value={sortType}
                                onChange={(_, { value }) => setSortType(value)}
                                style={{ width: '100%' }}
                            >
                                {/* Using your existing SortByOptions from common/DropDownData */}
                                {SortByOptions.map((opt) => (
                                    <Select.Option key={opt.value} label={opt.label} value={opt.value} />
                                ))}
                            </Select>
                        </div>

                        {/* --- 2. INTERNAL INDEX TOGGLE --- */}
                        <div style={{ marginBottom: '32px' }}>
                            <Heading level={4} style={{ marginBottom: '16px', color: '#9AA4AE' }}>Internal Indexes</Heading>
                            <RadioList
                                value={activeFilters.showInternal}
                                onChange={(_, { value }) => setActiveFilters(prev => ({ ...prev, showInternal: value }))}
                            >
                                <RadioList.Option value="exclude">Hide Internal (_)</RadioList.Option>
                                <RadioList.Option value="all">Show All</RadioList.Option>
                                <RadioList.Option value="only">Internal Only</RadioList.Option>
                            </RadioList>
                        </div>

                        {/* --- 3. EXISTING ATTRIBUTE FILTERS --- */}
                        <div style={{ marginBottom: '32px' }}>
                            <Heading level={4} style={{ marginBottom: '16px', color: '#9AA4AE' }}>Status</Heading>
                            <RadioList
                                value={activeFilters.activeOnly}
                                onChange={(_, { value }) => setActiveFilters(prev => ({ ...prev, activeOnly: value }))}
                            >
                                <RadioList.Option value="all">Any Status</RadioList.Option>
                                <RadioList.Option value="active">Active</RadioList.Option>
                                <RadioList.Option value="inactive">Inactive</RadioList.Option>
                            </RadioList>
                        </div>

                        {/* Clear Filters Button */}
                        <Button
                            appearance="pill"
                            label="Reset View"
                            onClick={() => {
                                setActiveFilters({ activeOnly: 'all', type: 'all', showInternal: 'exclude' });
                                setSortType('index_name');
                            }}
                            style={{ width: '100%', marginTop: '10px' }}
                        />
                    </aside>

                    {/* --- MAIN CONTENT AREA --- */}
                    <main style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <Text bold size="large">{filteredResults.length} Results Found</Text>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <HomeHelpMenuReact />
                                <Button appearance="primary" icon={<Plus />} label="Add" to="manage-asset?key=" />
                            </div>
                        </div>

                        <CardLayout cardWidth={320} gutterSize={20}>
                            {currentPageResults.map((asset) => (
                                // Use the modernCardStyle from the previous step
                               
                                <div key={asset._key}
                                    style={modernCardStyle}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)';
                                        e.currentTarget.style.transform = 'translateY(-5px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}>
                                    {/* 1. Add the Icon Indicator here */}


                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>

                                        {/* Left side: Name and Subtitle */}
                                        <div>
                                            <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>
                                                {asset.index_name}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#9AA4AE', marginTop: '2px' }}>
                                                {asset.source_itam_bsa || 'System Asset'}
                                            </div>
                                        </div>

                                        {/* Right side: Modern Type Icon + Menu */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            {/* The "Right-aligned" Modern Icon */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '12px',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                               boxShadow: `inset 0 0 10px ${(asset?.index_type || '').toLowerCase === 'metrics' ? '#B66DFF' : '#00D1AF'}15`,
                                                color: `insert ${(asset?.index_type || '').toLowerCase === 'metrics' ? '#B66DFF' : '#00D1AF'}`
                                            }} title={(asset?.index_type || '').toLowerCase === 'metrics' ? 'Metrics' : 'Event'} 
                                            >
                                                <IndexTypeIndicator size={1.2} />
                                            </div>

                                            {/* Ellipsis Menu */}
                                            {renderEllipsisMenu(asset, asset.index_name)}
                                        </div>
                                    </div>
                                    <div

                                    >

                                        {/* Metadata Pills */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                                            <Chip appearance={asset.index_active ? 'success' : 'neutral'}>
                                                {asset.index_active ? 'Active' : 'Offline'}
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
                                                <div style={{ fontSize: '16px', fontWeight: 600 }}>{asset.index_size_mb} MB</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '10px', color: '#9AA4AE', textTransform: 'uppercase' }}>Avg Usage</div>
                                                <div style={{ fontSize: '16px', fontWeight: 600 }}>{asset.avg_index_usage_mb} MB</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '10px', color: '#9AA4AE', textTransform: 'uppercase' }}>Retention</div>
                                                <div style={{ fontSize: '16px', fontWeight: 600 }}>{asset.index_retention_period} Days</div>
                                            </div>
                                        </div>

                                        <div style={{ ...bodyTextStyle, ...clamp3, minHeight: '60px', opacity: 0.8 }}>
                                            {asset.index_description || "No description provided for this data asset."}
                                        </div>

                                        <div style={{ marginTop: '24px' }}>
                                            <Button
                                                appearance="secondary"
                                                label="View Details"
                                                style={{ width: '100%', borderRadius: '12px' }}
                                                to={`manage-asset?key=${asset._key}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardLayout>

                        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
                            <Paginator
                                current={safeCurrentPage}
                                totalPages={totalPages}
                                onChange={(_, { page }) => setCurrentPage(page)}
                            />
                        </div>
                    </main>

                </div>
            </div>
        </SplunkThemeProvider>
    );
};

export default SplunkDataCatalogueHomePage;
