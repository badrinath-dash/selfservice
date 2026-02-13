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


    // --- Styling tokens (JSX objects) ---

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



    const filteredResults = useMemo(() => {
        if (!normalizedSearch) return assetValues;
        return assetValues.filter((row) => {
            const fieldValue = (row?.[searchFilterName] ?? '').toString().toLowerCase();
            return fieldValue.includes(normalizedSearch);
        });
    }, [assetValues, searchFilterName, normalizedSearch]);



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
        <SplunkThemeProvider family={colorFamily} colorScheme={colorScheme} density={density}>
            <Card style={{ minWidth: '100%' }}>
                <Heading level={2} style={{ marginBottom: 4 }}>Splunk Data Catalogue Home</Heading>
                <Text color="muted">
                    Browse, manage, and understand Splunk indexes
                </Text>
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

                    {/* Delete confirmation modal */}
                    <Modal onRequestClose={handleModalRequestClose} open={modalOpen}>
                        <Modal.Header title="Confirm Selection" onRequestClose={handleModalRequestClose} />
                        <Modal.Body>
                            <P>{`Are you sure you want to delete asset ${indexNameToDelete} ?  Please confirm.`}</P>
                            <Button
                                icon={<Stop screenReaderText={null} />}
                                label="Confirm"
                                appearance="destructive"
                                onClick={() => handleAssetDelete(keyToDelete)}
                            />
                            <Button
                                onClick={handleModalRequestClose}
                                label="Cancel"
                                appearance="primary"
                                icon={<Cancel screenReaderText={null} />}
                            />
                        </Modal.Body>
                    </Modal>

                    {/* Preferences dropdown */}
                    {/* <ControlGroup style={{ float: 'right' }} label="">
                        <Dropdown toggle={dropdownToggle} retainFocus closeReasons={closeReasons}>
                            <div style={{ padding: 20, width: 300 }}>
                                <ControlGroup label="Color" labelPosition="top">
                                    <RadioList
                                        name="color_scheme"
                                        value={colorScheme}
                                        onChange={(_, { value }) => setColorScheme(value)}
                                    >
                                        <RadioList.Option value="light">Light</RadioList.Option>
                                        <RadioList.Option value="dark">Dark</RadioList.Option>
                                    </RadioList>
                                </ControlGroup>

                                <ControlGroup label="Family" labelPosition="top">
                                    <RadioList
                                        name="color_family"
                                        value={colorFamily}
                                        onChange={(_, { value }) => setColorFamily(value)}
                                    >
                                        <RadioList.Option value="prisma">Prisma</RadioList.Option>
                                        <RadioList.Option value="enterprise">Enterprise</RadioList.Option>
                                    </RadioList>
                                </ControlGroup>

                                <ControlGroup label="Density" labelPosition="top">
                                    <RadioList
                                        name="density"
                                        value={density}
                                        onChange={(_, { value }) => setDensity(value)}
                                    >
                                        <RadioList.Option value="compact">Compact</RadioList.Option>
                                        <RadioList.Option value="comfortable">Comfortable</RadioList.Option>
                                    </RadioList>
                                </ControlGroup>

                                <ControlGroup label="Sort By" labelPosition="top">
                                    <Select
                                        name="sortType"
                                        onChange={(_, { value }) => setSortType(value)}
                                        value={sortType}
                                    >
                                        {SortByOptions.map((opt) => (
                                            <Select.Option key={opt.value} label={opt.label} value={opt.value} />
                                        ))}
                                    </Select>
                                </ControlGroup>

                                <ControlGroup label="Results to Display" labelPosition="top">
                                    <Select
                                        name="ResultsPerPage"
                                        onChange={(_, { value }) => setPostsPerPage(Number(value))}
                                        value={String(postsPerPage)}
                                    >
                                        <Select.Option label="10" value="10" />
                                        <Select.Option label="20" value="20" />
                                        <Select.Option label="50" value="50" />
                                        <Select.Option label="100" value="100" />
                                    </Select>
                                </ControlGroup>
                            </div>
                        </Dropdown>
                    </ControlGroup> */}

                    {/* Search */}
                    {/* <ControlGroup label="Search Asset"> */}
                    {/* <Text
              value={searchTerm}
              name="search_input"
              onChange={(e, { value }) => setSearchTerm(value)}
              endAdornment={<StyledButton appearance="pill" icon={<Search />} />}
              inline
            /> */}
                    {/* --- Modern compact search --- */}
                    <div style={{ marginTop: 16 }}>
                        <ModernSearchBar
                            value={searchTerm}
                            onChange={setSearchTerm}
                            filterKey={searchFilterName}
                            onFilterKeyChange={setSearchFilterName}
                            options={searchFieldOptions}
                            onSubmit={handleSearchSubmit}
                            placeholder="Search assets…"
                        />
                    </div>
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

                    {/* Cards */}
                    <div>
                        <CardLayout cardWidth={320} gutterSize={20} alignCards="left">
                            {currentPageResults.map((assetValue) => {
                                const sizeMb = Number(assetValue?.index_size_mb) || 0;
                                const avgMb = Number(assetValue?.avg_index_usage_mb) || 0;
                                const retention = assetValue?.index_retention_period ?? '—';
                                const indexName = assetValue?.index_name ?? '—';
                                const isMetrics = (assetValue?.index_type || '').toLowerCase() === 'metrics';




                                return (
                                    <Card key={assetValue?._key || indexName} style={cardShellStyle}>
                                        {/* Floating "Event/Metrics" badge */}

                                        

                                        <Card.Header
                                            title={
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={titleStyle}>{indexName}</div>
                                                    {/* {typeBadge} */}
                                                </div>
                                            }
                                            subtitle={
                                                <div style={subtitleStyle}>
                                                    {assetValue?.ags_entitlement_name ? (
                                                        <>Business Concept in&nbsp;<Chip outline>{assetValue.ags_entitlement_name}</Chip></>
                                                    ) : '—'}
                                                </div>
                                            }
                                            actionsSecondary={renderEllipsisMenu(assetValue, indexName)}
                                            value={assetValue}
                                        />

                                        {/* Header area */}
                                        <div style={{ ...sectionPad, paddingBottom: 4 }}>
                                            <div style={titleStyle}>{indexName}</div>
                                            <div style={subtitleStyle}>
                                                {assetValue?.ags_entitlement_name ? (
                                                    <>Business Concept in&nbsp;<Chip outline>{assetValue.ags_entitlement_name}</Chip></>
                                                ) : '—'}
                                            </div>
                                        </div>

                                        {/* Soft divider */}
                                        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />

                                        {/* Labels instead of icons – quick facts row */}
                                        <div style={{ ...sectionPad, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                            {/* Classification */}
                                            {assetValue?.index_classification && (
                                                <Chip appearance="warning">{assetValue.index_classification}</Chip>
                                            )}
                                            {/* Active */}
                                            <Chip appearance={assetValue?.index_active ? 'success' : 'danger'}>
                                                {assetValue?.index_active ? 'Active' : 'Inactive'}
                                            </Chip>
                                            {/* Used flag */}
                                            <Chip appearance={assetValue?.index_used ? 'info' : 'neutral'}>
                                                {assetValue?.index_used ? 'Recently Used' : 'Low Activity'}
                                            </Chip>
                                            {/* Size */}
                                            <Chip appearance="neutral">{`${sizeMb} MB Allocated`}</Chip>
                                            {/* Avg usage */}
                                            <Chip appearance="neutral">{`Avg 7d: ${avgMb} MB`}</Chip>
                                            {/* Retention */}
                                            <Chip appearance="neutral">
                                                {retention ? `${retention} ${Number(retention) === 1 ? 'Day' : 'Days'}` : 'Retention —'}
                                            </Chip>
                                        </div>

                                        {/* Soft divider */}
                                        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' }} />

                                        {/* Description */}
                                        <div style={{ ...sectionPad, paddingTop: 8 }}>
                                            <div style={{ ...bodyTextStyle, ...clamp3 }}>
                                                {assetValue?.index_description || 'No description provided.'}
                                            </div>
                                        </div>

                                        {/* Optional meta rows similar to the concept */}
                                        <div style={{ ...sectionPad, paddingTop: 4 }}>
                                            <MetaRow label="Popularity">
                                                <Chip tone="info">Popular</Chip>
                                            </MetaRow>
                                            <MetaRow label="Synonyms">
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                    {/* Replace with real synonyms if available */}
                                                    <Chip outline>Retail Orders</Chip>
                                                    <Chip outline>Sales Orders</Chip>
                                                    <Chip outline>Placed Orders</Chip>
                                                </div>
                                            </MetaRow>
                                        </div>

                                        {/* Footer with actions (Details / Menu) */}
                                        <div style={{ ...sectionPad, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <NavigationProvider onClick={handleClick}>
                                                <Button
                                                    appearance="primary"
                                                    to={`manage-asset?key=${assetValue?._key || ''}`}
                                                    openInNewContext
                                                    label="Details"
                                                />
                                            </NavigationProvider>


                                        </div>
                                    </Card>
                                );
                            })}
                        </CardLayout>
                    </div>

                    {/* Paginator */}
                    <Paginator
                        style={{ float: 'right', width: '30%' }}
                        current={safeCurrentPage}
                        totalPages={totalPages}
                        onChange={(_, { page }) => setCurrentPage(page)}
                    />
                </Card.Body>
            </Card>
        </SplunkThemeProvider>
    );
};

export default SplunkDataCatalogueHomePage;
