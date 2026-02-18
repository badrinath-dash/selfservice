import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import SplunkThemeProvider from '@splunk/themes/SplunkThemeProvider';
import useSplunkTheme from '@splunk/themes/useSplunkTheme';
import Message from '@splunk/react-ui/Message';
import Button from '@splunk/react-ui/Button';
import Text from '@splunk/react-ui/Text';
import Select from '@splunk/react-ui/Select';
import Paginator from '@splunk/react-ui/Paginator';
import RadioList from '@splunk/react-ui/RadioList';
import Dropdown from '@splunk/react-ui/Dropdown';
import Menu from '@splunk/react-ui/Menu';
import Modal from '@splunk/react-ui/Modal';
import P from '@splunk/react-ui/Paragraph';
import Heading from '@splunk/react-ui/Heading';
import Chip from '@splunk/react-ui/Chip';
import WaitSpinner from '@splunk/react-ui/WaitSpinner';

import External from '@splunk/react-icons/enterprise/External';
import Remove   from '@splunk/react-icons/enterprise/Remove';
import Activity from '@splunk/react-icons/enterprise/Activity';
import DataSource from '@splunk/react-icons/enterprise/DataSource';
import Metrics  from '@splunk/react-icons/enterprise/Metrics';
import Event    from '@splunk/react-icons/enterprise/Events';
import Plus     from '@splunk/react-icons/enterprise/Plus';
import Search   from '@splunk/react-icons/enterprise/Search';
import Close    from '@splunk/react-icons/enterprise/Close';

// ── Your existing imports (keep as-is) ───────────────────────────────────────
import { searchKVStore, deleteKVStore } from '../common/ManageKVStore';
import { SortByOptions } from '../common/DropDownData';
import { HomeHelpMenuReact } from '../components/DataCatalogueHome/HomeHelpMenu';
import HomePageHistoryModalPanelReact from '../components/DataCatalogueHome/HomeHistoryModal';
import HomeIndexDetailsModalPanelReact from '../components/DataCatalogueHome/HomeIndexDetailsModal';
import getUserRoleDetails from '../common/GetUserDetails';
import ModernSearchBar from '../components/DataCatalogueHome/ModernSearchBar';
import { loadConfig } from '../components/DataCatalogueHome/config';
import DescriptionPopover from '../components/DataCatalogueHome/IndexDescPopOver';

// =============================================================================
// DESIGN TOKENS
// =============================================================================
const T = {
    bgBase:      '#0d0f14',
    bgSurface:   '#13161e',
    bgRaised:    '#1a1e29',
    bgHover:     'rgba(255,255,255,0.06)',
    border:      'rgba(255,255,255,0.08)',
    borderHover: 'rgba(255,255,255,0.16)',
    accent:      '#4f8ef7',
    accentDim:   'rgba(79,142,247,0.14)',
    green:       '#3ecf8e',
    greenDim:    'rgba(62,207,142,0.12)',
    red:         '#f76f72',
    redDim:      'rgba(247,111,114,0.12)',
    purple:      '#996dff',
    purpleDim:   'rgba(153,109,255,0.14)',
    amber:       '#f5a623',
    amberDim:    'rgba(245,166,35,0.12)',
    textPrimary: '#e8eaf0',
    textSec:     '#8891a5',
    textMuted:   '#4e5568',
    radius:      '12px',
    radiusSm:    '6px',
    radiusLg:    '18px',
};

// =============================================================================
// UTILITY HOOKS
// =============================================================================
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
        const url = new URL(base, window.location.origin);
        url.searchParams.set(paramName, String(value));
        return url.toString();
    } catch {
        const sep = base.includes('?') ? '&' : '?';
        return `${base}${sep}${encodeURIComponent(paramName)}=${encodeURIComponent(String(value))}`;
    }
}

function ConvertValuesForDisplay(mbValue) {
    const num = Number(mbValue);
    if (!num) return '0 MB';
    if (num >= 1000000) return `${((num / 1024) / 1024).toFixed(2)} TB`;
    if (num >= 1000)    return `${(num / 1024).toFixed(2)} GB`;
    return `${num} MB`;
}

// =============================================================================
// REUSABLE SUB-COMPONENTS
// =============================================================================

/** Index type icon badge (Event green / Metrics purple) */
function IndexTypeIcon({ type }) {
    const isMetrics = type?.toLowerCase() === 'metrics';
    const color = isMetrics ? T.purple : T.green;
    const Icon  = isMetrics ? Metrics   : Event;
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: isMetrics ? T.purpleDim : T.greenDim,
            border: `1px solid ${color}44`,
            color,
        }}>
            <Icon size={1.1} />
        </div>
    );
}

/** Stat cell inside a card bento grid */
function StatCell({ label, value, color, highlight }) {
    return (
        <div style={{
            padding: '10px 12px',
            background: highlight ? 'rgba(79,142,247,0.07)' : 'rgba(0,0,0,0.18)',
            borderRadius: 8,
            border: `1px solid ${highlight ? 'rgba(79,142,247,0.2)' : 'rgba(255,255,255,0.04)'}`,
        }}>
            <div style={{ fontSize: 10, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
                {label}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: color || T.textPrimary, fontFamily: 'monospace' }}>
                {value || '—'}
            </div>
        </div>
    );
}

/**
 * ① IMPROVED FILTER SECTION BLOCK
 * Replaces plain Heading + RadioList with a structured collapsible-ready panel
 */
function FilterSection({ title, children, badge }) {
    return (
        <div style={{
            background: T.bgRaised,
            border: `1px solid ${T.border}`,
            borderRadius: T.radius,
            marginBottom: 12,
            overflow: 'hidden',
        }}>
            <div style={{
                padding: '10px 14px',
                borderBottom: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.02)',
            }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: T.textSec }}>
                    {title}
                </span>
                {badge != null && (
                    <span style={{
                        fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
                        background: T.accentDim, color: T.accent,
                        padding: '1px 7px', borderRadius: 10,
                        border: `1px solid rgba(79,142,247,0.3)`,
                    }}>
                        {badge}
                    </span>
                )}
            </div>
            <div style={{ padding: '12px 14px' }}>
                {children}
            </div>
        </div>
    );
}

/**
 * ② ACTIVE FILTER CHIPS STRIP
 * Shows what filters are currently applied above the results grid
 */
function ActiveFilterStrip({ filters, defaults, onClear, onRemove }) {
    const active = [];
    if (filters.activeOnly !== defaults.activeOnly)  active.push({ key: 'activeOnly',    label: `Status: ${filters.activeOnly}` });
    if (filters.type       !== defaults.type)        active.push({ key: 'type',          label: `Type: ${filters.type}` });
    if (filters.showInternal !== defaults.showInternal) active.push({ key: 'showInternal', label: `Internal: ${filters.showInternal}` });

    if (active.length === 0) return null;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Active filters:
            </span>
            {active.map(f => (
                <span key={f.key} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '3px 10px', borderRadius: 20,
                    fontSize: 12, fontWeight: 500,
                    background: T.accentDim, color: T.accent,
                    border: `1px solid rgba(79,142,247,0.3)`,
                    cursor: 'pointer',
                }} onClick={() => onRemove(f.key)}>
                    {f.label}
                    <Close size={0.7} />
                </span>
            ))}
            <span style={{
                fontSize: 12, color: T.textSec, cursor: 'pointer', textDecoration: 'underline',
            }} onClick={onClear}>
                Clear all
            </span>
        </div>
    );
}

/**
 * ③ EMPTY STATE
 * Shown when filters + search return no results
 */
function EmptyState({ searchTerm, onClear }) {
    return (
        <div style={{
            gridColumn: '1 / -1',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '60px 20px', gap: 16,
            background: T.bgSurface,
            border: `1px dashed ${T.border}`,
            borderRadius: T.radiusLg,
            textAlign: 'center',
        }}>
            <div style={{ fontSize: 40, opacity: 0.3 }}>🔍</div>
            <Heading level={3} style={{ color: T.textSec }}>
                No indexes found
            </Heading>
            <P style={{ color: T.textMuted, maxWidth: 360 }}>
                {searchTerm
                    ? `No results for "${searchTerm}". Try a different search term or adjust your filters.`
                    : 'No indexes match your current filters.'}
            </P>
            <Button label="Clear all filters" onClick={onClear} />
        </div>
    );
}

/**
 * ④ LOADING SKELETON CARDS
 * 6 ghost cards shown while data loads
 */
function SkeletonCard() {
    const pulse = {
        background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius: 6,
    };
    return (
        <div style={{
            background: T.bgSurface,
            border: `1px solid ${T.border}`,
            borderRadius: T.radiusLg,
            padding: 20, display: 'flex', flexDirection: 'column', gap: 14,
        }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ ...pulse, width: 34, height: 34, borderRadius: 10 }} />
                <div style={{ ...pulse, height: 16, flex: 1 }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ ...pulse, height: 22, width: 60, borderRadius: 20 }} />
                <div style={{ ...pulse, height: 22, width: 80, borderRadius: 20 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ ...pulse, height: 52, borderRadius: 8 }} />
                <div style={{ ...pulse, height: 52, borderRadius: 8 }} />
            </div>
            <div style={{ ...pulse, height: 40, borderRadius: 8 }} />
            <div style={{ ...pulse, height: 32, borderRadius: 8, marginTop: 4 }} />
        </div>
    );
}

/**
 * ⑤ PAGE HEADER
 * Replaces the bare <Heading> with a full header band
 */
function PageHeader({ total, filtered, onAdd }) {
    return (
        <div style={{
            background: `linear-gradient(135deg, rgba(79,142,247,0.08) 0%, rgba(153,109,255,0.06) 100%)`,
            border: `1px solid ${T.border}`,
            borderRadius: T.radiusLg,
            padding: '28px 32px',
            marginBottom: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            position: 'relative', overflow: 'hidden',
        }}>
            {/* Decorative blur orbs */}
            <div style={{
                position: 'absolute', top: -40, right: 120,
                width: 180, height: 180, borderRadius: '50%',
                background: 'rgba(79,142,247,0.08)', filter: 'blur(40px)', pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: -40, right: 40,
                width: 140, height: 140, borderRadius: '50%',
                background: 'rgba(153,109,255,0.08)', filter: 'blur(40px)', pointerEvents: 'none',
            }} />

            <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                    <Heading level={1} style={{ fontSize: 26, fontWeight: 800, margin: 0, color: T.textPrimary }}>
                        Data Catalogue
                    </Heading>
                    <span style={{
                        fontSize: 12, fontFamily: 'monospace', fontWeight: 700,
                        background: T.accentDim, color: T.accent,
                        padding: '3px 10px', borderRadius: 20,
                        border: `1px solid rgba(79,142,247,0.3)`,
                    }}>
                        {total} total
                    </span>
                </div>
                <P style={{ color: T.textSec, margin: 0, fontSize: 13 }}>
                    Manage and discover Splunk indexes across your organisation.
                    {filtered < total && (
                        <span style={{ color: T.amber, fontWeight: 600 }}>
                            {' '}Showing {filtered} filtered results.
                        </span>
                    )}
                </P>
            </div>

            <div style={{ display: 'flex', gap: 10, position: 'relative' }}>
                <HomeHelpMenuReact />
                <Button
                    appearance="primary"
                    icon={<Plus />}
                    label="Add Index"
                    to="manage-asset?key="
                />
            </div>
        </div>
    );
}

/**
 * ⑥ IMPROVED PAGINATOR ROW
 * Shows "Page X of Y · Showing A–B of C results"
 */
function PaginatorRow({ current, total, pageSize, totalRecords, onChange }) {
    const start = (current - 1) * pageSize + 1;
    const end   = Math.min(current * pageSize, totalRecords);
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: 32,
            padding: '14px 20px',
            background: T.bgSurface,
            border: `1px solid ${T.border}`,
            borderRadius: T.radius,
        }}>
            <span style={{ fontSize: 13, color: T.textSec }}>
                Showing <strong style={{ color: T.textPrimary }}>{start}–{end}</strong> of{' '}
                <strong style={{ color: T.textPrimary }}>{totalRecords}</strong> results
            </span>
            <Paginator current={current} totalPages={total} onChange={onChange} />
            <span style={{ fontSize: 13, color: T.textSec }}>
                Page <strong style={{ color: T.textPrimary }}>{current}</strong> of{' '}
                <strong style={{ color: T.textPrimary }}>{total}</strong>
            </span>
        </div>
    );
}

function getClassificationChipConfig(index_classification) {
    const key = (index_classification ?? '').toString().trim().toLowerCase();
    const map = {
        application: { label: 'Application', appearance: 'success' },
        network:     { label: 'Network',     appearance: 'info',    outline: true },
        security:    { label: 'Security',    appearance: 'error' },
        test:        { label: 'Test',        appearance: 'warning' },
    };
    return map[key] || { label: key || 'Other', appearance: 'default', outline: true };
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
const SplunkDataCatalogueHomePage = () => {
    // ── State ─────────────────────────────────────────────────────────────────
    const [infoMessage,       setInfoMessage]       = useState({ visible: false });
    const [assetValues,       setAssetValues]       = useState([]);
    const [isDataLoading,     setIsDataLoading]     = useState(true);   // ← NEW
    const [searchTerm,        setSearchTerm]        = useState('');
    const [sortType,          setSortType]          = useState('index_name');
    const [currentPage,       setCurrentPage]       = useState(1);
    const [postsPerPage,      setPostsPerPage]      = useState(10);
    const [modalOpen,         setModalOpen]         = useState(false);
    const [keyToDelete,       setKeyToDelete]       = useState(null);
    const [indexNameToDelete, setIndexNameToDelete] = useState('');
    const [currentUser,       setCurrentUser]       = useState();
    const [currentEmail,      setCurrentEmail]      = useState();
    const [isSplunkAdmin,     setIsSplunkAdmin]     = useState(false);
    const [deleteButtonDisabled, setDeleteButtonDisabled] = useState(true);
    const [engagementURL,     setEngagementURL]     = useState();
    const [splunkURL,         setSplunkURL]         = useState();
    const [oneCMURL,          setOneCMURL]          = useState();

    const modalToggle = useRef(null);
    const childRef    = useRef();
    const childRef1   = useRef();

    const searchFieldOptions = useMemo(() => ([
        { label: 'Index Name',                  value: 'index_name' },
        { label: 'Index Description',           value: 'index_description' },
        { label: 'ITAM BSA',                    value: 'source_itam_bsa' },
        { label: 'Linked Access Group',         value: 'ags_entitlement_name' },
        { label: 'Splunk Engagement Reference', value: 'pow_number' },
    ]), []);

    const [searchFilterName, setSearchFilterName] = useState(searchFieldOptions[0].value);

    const DEFAULT_FILTERS = useMemo(() => ({
        activeOnly:   'all',
        type:         'all',
        showInternal: 'exclude',
    }), []);

    const [activeFilters, setActiveFilters] = useState(DEFAULT_FILTERS);

    // ── Keyboard shortcut: "/" focuses search ─────────────────────────────────
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

    // Reset page on filter/search change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, searchFilterName, postsPerPage, sortType, activeFilters]);

    // ── Data loading ──────────────────────────────────────────────────────────
    useEffect(() => {
        const defaultErrorMsg = 'Error retrieving data from KVStore. Please refresh.';
        setIsDataLoading(true);

        Promise.all([
            searchKVStore('splunk_data_catalog_collection', '', '', defaultErrorMsg),
            getUserRoleDetails(defaultErrorMsg),
        ])
            .then(([dataRes, userRes]) => {
                if (dataRes.ok) {
                    dataRes.json().then(d => setAssetValues(Array.isArray(d) ? d : []));
                } else {
                    setInfoMessage({ visible: true, type: 'info', message: 'No entries found.' });
                }
                if (userRes.ok) {
                    userRes.json().then(data => {
                        const content = data?.entry?.[0]?.content;
                        setCurrentUser(content?.realname);
                        setCurrentEmail(content?.email);
                        const admin = Array.isArray(content?.roles) && content.roles.includes('admin');
                        setIsSplunkAdmin(!!admin);
                        setDeleteButtonDisabled(!admin);
                    });
                }
            })
            .catch(err => setInfoMessage({ visible: true, type: 'error', message: err || defaultErrorMsg }))
            .finally(() => setIsDataLoading(false));
    }, []);

    useEffect(() => {
        loadConfig()
            .then(c => {
                setEngagementURL(c.engagementURL);
                setOneCMURL(c.oneCMURL);
                setSplunkURL(c.SplunkURL);
            })
            .catch(err => setInfoMessage({ visible: true, type: 'error', message: err?.message || 'Failed to load config' }));
    }, []);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleModalRequestOpen  = useCallback((key, name) => { setModalOpen(true); setKeyToDelete(key); setIndexNameToDelete(name); }, []);
    const handleModalRequestClose = useCallback(() => { setModalOpen(false); modalToggle?.current?.focus?.(); }, []);
    const handleMessageRemove     = useCallback(() => setInfoMessage({ visible: false }), []);

    const handleAssetDelete = useCallback((key) => {
        const defaultErrorMsg = 'Error deleting from KVStore.';
        deleteKVStore('splunk_data_catalog_collection', key, defaultErrorMsg)
            .then(res => {
                if (res.ok) {
                    setInfoMessage({ visible: true, type: 'success', message: 'Index removed successfully.' });
                    setTimeout(() => setInfoMessage({ visible: false }), 3000);
                    handleModalRequestClose();
                    searchKVStore('splunk_data_catalog_collection', '', '', defaultErrorMsg)
                        .then(r => r.ok && r.json().then(d => setAssetValues(Array.isArray(d) ? d : [])));
                } else {
                    setInfoMessage({ visible: true, type: 'error', message: 'Error removing index. Please try again.' });
                    handleModalRequestClose();
                }
            })
            .catch(err => { setInfoMessage({ visible: true, type: 'error', message: err || defaultErrorMsg }); handleModalRequestClose(); });
    }, [handleModalRequestClose]);

    const handleRemoveFilter = useCallback((key) => {
        setActiveFilters(f => ({ ...f, [key]: DEFAULT_FILTERS[key] }));
    }, [DEFAULT_FILTERS]);

    const handleClearFilters = useCallback(() => setActiveFilters(DEFAULT_FILTERS), [DEFAULT_FILTERS]);

    // ── Filtered / sorted / paginated data ───────────────────────────────────
    const debouncedSearchTerm = useDebouncedValue(searchTerm, 250);
    const normalizedSearch    = debouncedSearchTerm.trim().toLowerCase();

    const filteredResults = useMemo(() => {
        const isInternal = row => (row?.index_name ?? '').toString().startsWith('_');

        return assetValues.filter(row => {
            const matchesSearch   = (row?.[searchFilterName] ?? '').toString().toLowerCase().includes(normalizedSearch);
            const isActive        = row.index_active === 'Y';
            const matchesStatus   = activeFilters.activeOnly === 'all'
                ? true : activeFilters.activeOnly === 'active' ? isActive : !isActive;

            const type = (row.index_type || '').toLowerCase();
            const matchesType = activeFilters.type === 'all' ? true
                : activeFilters.type === 'events'  ? (type === 'event' || type === 'summary')
                : (type === 'metrics' || type === 'summary-metrics');

            const internal = isInternal(row);
            const matchesInternal = activeFilters.showInternal === 'all' ? true
                : activeFilters.showInternal === 'exclude' ? !internal : internal;

            return matchesSearch && matchesStatus && matchesType && matchesInternal;
        });
    }, [assetValues, searchFilterName, normalizedSearch, activeFilters]);

    const sortedResults = useMemo(() => {
        const copy = [...filteredResults];
        const [key, direction] = String(sortType).includes(':') ? sortType.split(':') : [sortType, 'asc'];
        const isDesc = direction === 'desc';
        copy.sort((a, b) => {
            const va = a[key], vb = b[key];
            if (va == null && vb == null) return 0;
            if (va == null) return 1;
            if (vb == null) return -1;
            const na = Number(va), nb = Number(vb);
            if (!isNaN(na) && !isNaN(nb)) return isDesc ? nb - na : na - nb;
            const sa = String(va).toLowerCase(), sb = String(vb).toLowerCase();
            if (sa < sb) return isDesc ? 1 : -1;
            if (sa > sb) return isDesc ? -1 : 1;
            return 0;
        });
        return copy;
    }, [filteredResults, sortType]);

    const totalPages       = Math.max(1, Math.ceil(sortedResults.length / Number(postsPerPage)));
    const safeCurrentPage  = Math.min(currentPage, totalPages);
    const start            = (safeCurrentPage - 1) * Number(postsPerPage);
    const end              = start + Number(postsPerPage);
    const currentPageResults = useMemo(() => sortedResults.slice(start, end), [sortedResults, start, end]);

    const closeReasons = useMemo(() =>
        Dropdown.possibleCloseReasons.filter(r => r !== 'contentClick'), []);

    // ── Card menu ──────────────────────────────────────────────────────────────
    function CardMenu({ asset }) {
        const itamUrl  = buildUrl(oneCMURL,     'bsa', asset?.source_itam_bsa);
        const powUrl   = buildUrl(engagementURL, 'pow', asset?.pow_number);
        const usageUrl = buildUrl(splunkURL,     'q',   asset?.index_name);
        return (
            <Menu>
                <Menu.Item to={itamUrl}  openInNewContext icon={<External />} disabled={!itamUrl}>ONECM</Menu.Item>
                <Menu.Divider />
                <Menu.Item to={powUrl}   openInNewContext icon={<External />} disabled={!powUrl}>POW</Menu.Item>
                <Menu.Item to={usageUrl} openInNewContext icon={<External />} disabled={!usageUrl}>Usage</Menu.Item>
                <Menu.Divider />
                <Menu.Item onClick={() => handleModalRequestOpen(asset._key, asset.index_name)} icon={<Remove />} disabled={deleteButtonDisabled}>Delete</Menu.Item>
                <Menu.Item onClick={() => childRef.current?.handleModalHistoryRequestOpen(asset._key, asset.index_name, currentUser, currentEmail, 'dark')} icon={<Activity />}>History</Menu.Item>
                <Menu.Item onClick={() => childRef1.current?.handleModalShowIndexMetaData(asset._key, asset.index_name, currentUser, currentEmail, 'dark')} icon={<DataSource />}>Index Metadata</Menu.Item>
            </Menu>
        );
    }

    // ── RENDER ────────────────────────────────────────────────────────────────
    return (
        <SplunkThemeProvider family="prisma" colorScheme="dark" density="comfortable">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;700&display=swap');
                @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
                @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
                body { background: ${T.bgBase}; }
            `}</style>

            <div style={{ padding: '28px 36px', maxWidth: 1600, margin: '0 auto', background: T.bgBase, minHeight: '100vh' }}>

                {/* ── GLOBAL MESSAGE BANNER ────────────────────────────── */}
                {infoMessage.visible && (
                    <div style={{ marginBottom: 20 }}>
                        <Message type={infoMessage.type || 'info'} onRequestRemove={handleMessageRemove}>
                            {infoMessage.message}
                        </Message>
                    </div>
                )}

                {/* ── ⑤ PAGE HEADER ────────────────────────────────────── */}
                <PageHeader
                    total={assetValues.length}
                    filtered={filteredResults.length}
                    onAdd={() => {}}
                />

                {/* ── SEARCH BAR ───────────────────────────────────────── */}
                <div style={{
                    background: T.bgSurface,
                    border: `1px solid ${T.border}`,
                    borderRadius: T.radiusLg,
                    padding: '8px 16px 8px 8px',
                    display: 'flex', alignItems: 'center', gap: 16,
                    marginBottom: 24,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                }}>
                    <div style={{ flex: 1 }}>
                        <ModernSearchBar
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Search indexes… ( / )"
                            filterKey={searchFilterName}
                            onFilterKeyChange={setSearchFilterName}
                            options={searchFieldOptions}
                        />
                    </div>
                    <div style={{ width: 1, height: 24, background: T.border }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.textSec, whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                        <span style={{ color: T.accent }}>{filteredResults.length}</span> / {assetValues.length}
                    </span>
                    {searchTerm && (
                        <Button appearance="secondary" label="Clear" icon={<Close />} onClick={() => setSearchTerm('')} />
                    )}
                </div>

                <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>

                    {/* ── ① FILTER SIDEBAR ─────────────────────────────── */}
                    <aside style={{ width: 252, minWidth: 252, position: 'sticky', top: 28 }}>

                        <FilterSection title="Sort By">
                            <Select
                                value={sortType}
                                onChange={(_, { value }) => setSortType(value)}
                                style={{ width: '100%' }}
                            >
                                {SortByOptions.map(opt => (
                                    <Select.Option key={opt.value} label={opt.label} value={opt.value} />
                                ))}
                            </Select>
                        </FilterSection>

                        <FilterSection title="Status">
                            <RadioList
                                value={activeFilters.activeOnly}
                                onChange={(_, { value }) => setActiveFilters(p => ({ ...p, activeOnly: value }))}
                            >
                                <RadioList.Option value="all">All Assets</RadioList.Option>
                                <RadioList.Option value="active">Active Only</RadioList.Option>
                                <RadioList.Option value="inactive">Inactive</RadioList.Option>
                            </RadioList>
                        </FilterSection>

                        <FilterSection title="Index Type">
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {[
                                    { value: 'all',     label: 'All' },
                                    { value: 'events',  label: 'Events' },
                                    { value: 'metrics', label: 'Metrics' },
                                ].map(({ value, label }) => (
                                    <div
                                        key={value}
                                        onClick={() => setActiveFilters(p => ({ ...p, type: value }))}
                                        style={{
                                            padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                                            fontSize: 12, fontWeight: 500,
                                            background: activeFilters.type === value ? T.accentDim : 'transparent',
                                            color:      activeFilters.type === value ? T.accent     : T.textSec,
                                            border: `1px solid ${activeFilters.type === value ? 'rgba(79,142,247,0.35)' : T.border}`,
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        {label}
                                    </div>
                                ))}
                            </div>
                        </FilterSection>

                        <FilterSection title="Internal Indexes">
                            <RadioList
                                value={activeFilters.showInternal}
                                onChange={(_, { value }) => setActiveFilters(p => ({ ...p, showInternal: value }))}
                            >
                                <RadioList.Option value="exclude">Hide Internal (_)</RadioList.Option>
                                <RadioList.Option value="all">Show All</RadioList.Option>
                                <RadioList.Option value="only">Only Internal</RadioList.Option>
                            </RadioList>
                        </FilterSection>

                        <FilterSection title="Per Page">
                            <div style={{ display: 'flex', gap: 6 }}>
                                {[10, 20, 50].map(size => (
                                    <div
                                        key={size}
                                        onClick={() => setPostsPerPage(size)}
                                        style={{
                                            padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                                            fontSize: 12, fontWeight: 700, fontFamily: 'monospace',
                                            background: postsPerPage === size ? T.accentDim : 'transparent',
                                            color:      postsPerPage === size ? T.accent     : T.textSec,
                                            border: `1px solid ${postsPerPage === size ? 'rgba(79,142,247,0.35)' : T.border}`,
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        {size}
                                    </div>
                                ))}
                            </div>
                        </FilterSection>

                        <Button
                            appearance="secondary"
                            label="Reset All Filters"
                            onClick={handleClearFilters}
                            style={{ width: '100%', marginTop: 4 }}
                        />
                    </aside>

                    {/* ── MAIN CONTENT ──────────────────────────────────── */}
                    <main style={{ flex: 1, minWidth: 0 }}>

                        {/* ── ② ACTIVE FILTER CHIPS ─────────────────────── */}
                        <ActiveFilterStrip
                            filters={activeFilters}
                            defaults={DEFAULT_FILTERS}
                            onClear={handleClearFilters}
                            onRemove={handleRemoveFilter}
                        />

                        {/* ── ④ LOADING SKELETONS ───────────────────────── */}
                        {isDataLoading ? (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                                gap: 20,
                            }}>
                                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                            </div>
                        ) : (
                            <>
                                {/* ── CARD GRID ─────────────────────────── */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                                    gap: 20,
                                    alignItems: 'stretch',
                                }}>
                                    {/* ── ③ EMPTY STATE ─────────────────── */}
                                    {currentPageResults.length === 0 ? (
                                        <EmptyState
                                            searchTerm={searchTerm}
                                            onClear={() => { setSearchTerm(''); handleClearFilters(); }}
                                        />
                                    ) : (
                                        currentPageResults.map((asset, idx) => {
                                            const classChip = getClassificationChipConfig(asset.index_classification);
                                            const isActive  = asset.index_active === 'Y';
                                            return (
                                                <div
                                                    key={asset._key}
                                                    style={{
                                                        background: T.bgSurface,
                                                        border: `1px solid ${T.border}`,
                                                        borderRadius: T.radiusLg,
                                                        padding: 20,
                                                        display: 'flex', flexDirection: 'column',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        animation: `fadeUp 0.3s ease both`,
                                                        animationDelay: `${idx * 40}ms`,
                                                    }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.borderColor = T.borderHover;
                                                        e.currentTarget.style.transform   = 'translateY(-3px)';
                                                        e.currentTarget.style.boxShadow   = '0 12px 32px rgba(0,0,0,0.4)';
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.borderColor = T.border;
                                                        e.currentTarget.style.transform   = 'none';
                                                        e.currentTarget.style.boxShadow   = 'none';
                                                    }}
                                                >
                                                    {/* Card Header */}
                                                    <div style={{
                                                        display: 'flex', justifyContent: 'space-between',
                                                        alignItems: 'flex-start', marginBottom: 14, gap: 10,
                                                    }}>
                                                        <div style={{ display: 'flex', gap: 10, minWidth: 0, flex: 1, alignItems: 'center' }}>
                                                            <IndexTypeIcon type={asset.index_type} />
                                                            <div style={{
                                                                fontSize: 15, fontWeight: 700, color: '#fff',
                                                                overflow: 'hidden', textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap', minWidth: 0,
                                                            }} title={asset.index_name}>
                                                                {asset.index_name}
                                                            </div>
                                                        </div>
                                                        <div style={{ flexShrink: 0 }}>
                                                            <Dropdown
                                                                retainFocus
                                                                closeReasons={closeReasons}
                                                                toggle={
                                                                    <Button appearance="toggle" isMenu aria-label="More actions" label="⋯" />
                                                                }
                                                            >
                                                                <CardMenu asset={asset} />
                                                            </Dropdown>
                                                        </div>
                                                    </div>

                                                    {/* Status + Classification chips */}
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                                                        <Chip appearance={isActive ? 'success' : 'error'}>
                                                            {isActive ? 'Active' : 'Inactive'}
                                                        </Chip>
                                                        <Chip appearance={classChip.appearance} outline={classChip.outline}>
                                                            {classChip.label}
                                                        </Chip>
                                                    </div>

                                                    {/* ── ⑥ IMPROVED STATS BENTO ─────────────── */}
                                                    <div style={{
                                                        display: 'grid', gridTemplateColumns: '1fr 1fr',
                                                        gap: 8, marginBottom: 14,
                                                    }}>
                                                        <StatCell
                                                            label="Daily Size"
                                                            value={ConvertValuesForDisplay(asset.index_size_mb)}
                                                            color={T.accent}
                                                            highlight
                                                        />
                                                        <StatCell
                                                            label="Avg Usage"
                                                            value={ConvertValuesForDisplay(asset.avg_index_usage_mb)}
                                                        />
                                                        <StatCell
                                                            label="Retention"
                                                            value={asset.index_retention_period ? `${asset.index_retention_period}d` : null}
                                                            color={T.green}
                                                        />
                                                        <StatCell
                                                            label="Type"
                                                            value={asset.index_type || '—'}
                                                            color={T.textSec}
                                                        />
                                                    </div>

                                                    {/* Description */}
                                                    <div style={{
                                                        flex: 1, marginBottom: 16,
                                                        fontSize: 13, color: T.textSec, lineHeight: 1.5,
                                                    }}>
                                                        <DescriptionPopover text={asset.index_description} />
                                                    </div>

                                                    {/* Footer CTA */}
                                                    <Button
                                                        appearance="secondary"
                                                        label="View / Edit Details →"
                                                        style={{ width: '100%' }}
                                                        to={`manage-asset?key=${asset._key}`}
                                                    />
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* ── ⑦ IMPROVED PAGINATOR ─────────────── */}
                                {currentPageResults.length > 0 && (
                                    <PaginatorRow
                                        current={safeCurrentPage}
                                        total={totalPages}
                                        pageSize={Number(postsPerPage)}
                                        totalRecords={sortedResults.length}
                                        onChange={(_, { page }) => setCurrentPage(page)}
                                    />
                                )}
                            </>
                        )}
                    </main>
                </div>

                {/* ── DELETE CONFIRM MODAL ──────────────────────────────── */}
                <Modal
                    onRequestClose={handleModalRequestClose}
                    open={modalOpen}
                    style={{ width: 480 }}
                >
                    <Modal.Header title="Confirm Delete" onRequestClose={handleModalRequestClose} />
                    <Modal.Body>
                        <P>
                            Are you sure you want to permanently delete the index record for{' '}
                            <strong style={{ color: T.red }}>{indexNameToDelete}</strong>?
                            This action cannot be undone.
                        </P>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button appearance="secondary" onClick={handleModalRequestClose} label="Cancel" />
                        <Button appearance="destructive" onClick={() => handleAssetDelete(keyToDelete)} label="Delete" />
                    </Modal.Footer>
                </Modal>

                <HomePageHistoryModalPanelReact ref={childRef} />
                <HomeIndexDetailsModalPanelReact ref={childRef1} />
            </div>
        </SplunkThemeProvider>
    );
};

export default SplunkDataCatalogueHomePage;
