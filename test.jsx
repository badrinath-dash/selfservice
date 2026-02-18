import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ── Splunk React UI ───────────────────────────────────────────────────────────
import Button        from '@splunk/react-ui/Button';
import Message       from '@splunk/react-ui/Message';
import Text          from '@splunk/react-ui/Text';
import Select        from '@splunk/react-ui/Select';
import Multiselect   from '@splunk/react-ui/Multiselect';
import ControlGroup  from '@splunk/react-ui/ControlGroup';
import Date          from '@splunk/react-ui/Date';
import TabBar        from '@splunk/react-ui/TabBar';
import Card          from '@splunk/react-ui/Card';
import Heading       from '@splunk/react-ui/Heading';
import WaitSpinner   from '@splunk/react-ui/WaitSpinner';
import FormRows      from '@splunk/react-ui/FormRows';
import P             from '@splunk/react-ui/Paragraph';
import Link          from '@splunk/react-ui/Link';
import Chip          from '@splunk/react-ui/Chip';
import SplunkThemeProvider from '@splunk/themes/SplunkThemeProvider';

// ── Splunk Icons ──────────────────────────────────────────────────────────────
import DataSource    from '@splunk/react-icons/enterprise/DataSource';
import Activity      from '@splunk/react-icons/enterprise/Activity';
import Metrics       from '@splunk/react-icons/enterprise/Metrics';
import Events        from '@splunk/react-icons/enterprise/Events';
import External      from '@splunk/react-icons/enterprise/External';
import Stop          from '@splunk/react-icons/enterprise/Stop';
import Plus          from '@splunk/react-icons/enterprise/Plus';
import Search        from '@splunk/react-icons/enterprise/Search';
import Close         from '@splunk/react-icons/enterprise/Close';

// ── Your existing imports (keep as-is) ───────────────────────────────────────
// import { searchKVStore, updateKVStore } from '../common/ManageKVStore';
// import { DropDownData }                 from '../common/DropDownData';
// import getUserRoleDetails               from '../common/GetUserDetails';

// =============================================================================
// DESIGN TOKENS — single source of truth for every colour / size
// =============================================================================
const T = {
    bgBase:       '#0d0f14',
    bgSurface:    '#13161e',
    bgRaised:     '#1a1e29',
    bgHover:      '#1f2433',
    bgGlass:      'rgba(255,255,255,0.03)',     // home page card base
    bgGlassHover: 'rgba(255,255,255,0.06)',     // home page card hover
    border:       'rgba(255,255,255,0.08)',
    borderHover:  'rgba(255,255,255,0.16)',
    borderFocus:  '#4f8ef7',
    accent:       '#4f8ef7',
    accentDim:    'rgba(79,142,247,0.14)',
    accentGlow:   'rgba(79,142,247,0.30)',
    green:        '#3ecf8e',
    greenDim:     'rgba(62,207,142,0.14)',
    red:          '#f76f72',
    redDim:       'rgba(247,111,114,0.14)',
    amber:        '#f5a623',
    amberDim:     'rgba(245,166,35,0.12)',
    purple:       '#996dff',
    purpleDim:    'rgba(153,109,255,0.14)',
    textPrimary:  '#e8eaf0',
    textSec:      '#8891a5',
    textMuted:    '#4e5568',
    radius:       '12px',
    radiusSm:     '6px',
    radiusLg:     '18px',     // matches home page 18px card radius
    radiusXl:     '24px',     // home page largest radius
};

// =============================================================================
// STYLES OBJECT
// =============================================================================
const S = {
    // ── Page shell ────────────────────────────────────────────────────────────
    page: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: T.bgBase,
        fontFamily: "'IBM Plex Sans', 'Splunk Platform Sans', sans-serif",
        color: T.textPrimary,
    },

    // ── Top nav breadcrumb bar ─────────────────────────────────────────────
    topNav: {
        height: '48px',
        background: 'rgba(13,15,20,0.85)',
        borderBottom: `1px solid ${T.border}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 28px',
        gap: '8px',
        position: 'sticky',
        top: 0,
        zIndex: 110,
        backdropFilter: 'blur(16px)',
    },
    topNavLogo: {
        fontFamily: 'monospace',
        fontSize: '13px',
        fontWeight: 700,
        color: T.accent,
        letterSpacing: '0.04em',
    },
    topNavSep:    { color: T.textMuted, fontSize: '14px' },
    topNavPath:   { fontSize: '13px', color: T.textSec },
    topNavActive: { color: T.textPrimary, fontWeight: 500 },
    topNavRight:  { marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' },

    // ── Sticky action bar — glass panel like home page cards ──────────────
    actionBar: {
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${T.border}`,
        padding: '14px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: '48px',
        zIndex: 100,
        gap: '16px',
    },
    actionBarLeft:  { display: 'flex', flexDirection: 'column', gap: '4px' },
    actionBarTitle: {
        fontSize: '17px', fontWeight: 700,
        display: 'flex', alignItems: 'center', gap: '10px',
        color: '#FFFFFF',
    },
    actionBarSub: {
        fontSize: '12px', color: T.textSec,
        fontFamily: 'monospace',
    },
    actionBarRight: { display: 'flex', gap: '8px', alignItems: 'center' },

    // ── Status badges ──────────────────────────────────────────────────────
    badge: (color, dim, borderAlpha) => ({
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '2px 10px', borderRadius: '20px',
        fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
        background: dim, color: color,
        border: `1px solid ${borderAlpha}`,
        whiteSpace: 'nowrap',
    }),
    badgeDot: (color) => ({
        width: '6px', height: '6px', borderRadius: '50%',
        background: color, boxShadow: `0 0 6px ${color}`,
        flexShrink: 0,
    }),

    // ── Main body (sidebar + main panel) ──────────────────────────────────
    body: { display: 'flex', flex: 1, minHeight: 0 },

    // ── Left sidebar — glass panel matching home page card style ──────────
    sidebar: {
        width: '220px', minWidth: '220px',
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(12px)',
        borderRight: `1px solid ${T.border}`,
        padding: '20px 0',
        position: 'sticky',
        top: '104px',
        height: 'calc(100vh - 104px)',
        overflowY: 'auto',
    },
    sidebarSection: { padding: '0 12px', marginBottom: '24px' },
    sidebarLabel: {
        fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: T.textMuted,
        padding: '0 8px', marginBottom: '6px',
    },
    sidebarItem: (active) => ({
        display: 'flex', alignItems: 'center', gap: '9px',
        padding: '8px 10px', borderRadius: T.radiusSm,
        cursor: 'pointer', fontSize: '13px', fontWeight: 500,
        color: active ? T.accent : T.textSec,
        background: active ? T.accentDim : 'transparent',
        borderLeft: active ? `3px solid ${T.accent}` : '3px solid transparent',
        transition: 'all 0.12s ease',
    }),
    sidebarIcon: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '18px', flexShrink: 0, opacity: 0.85,
    },
    sidebarCount: {
        marginLeft: 'auto', fontSize: '11px', fontFamily: 'monospace',
        background: T.bgRaised, color: T.textMuted,
        padding: '1px 7px', borderRadius: '10px',
    },
    sidebarDivider: {
        height: '1px', background: T.border, margin: '8px 14px',
    },

    // ── Main panel ────────────────────────────────────────────────────────
    main: {
        flex: 1,
        padding: '24px 32px',
        overflowY: 'auto',
        maxWidth: '960px',
    },

    // ── Metric row ────────────────────────────────────────────────────────
    metricRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '14px',
        marginBottom: '24px',
    },
    // Glass metric card — mirrors home page bento grid cells
    metricCard: {
        background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
        border: `1px solid ${T.border}`,
        borderRadius: T.radiusLg,
        boxShadow: '0 10px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
        padding: '16px 18px',
        display: 'flex', flexDirection: 'column', gap: '4px',
        backdropFilter: 'blur(12px)',
    },
    metricLabel: {
        fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: T.textMuted,
    },
    metricValue: (color) => ({
        fontSize: '22px', fontWeight: 600,
        fontFamily: 'monospace', color: color || T.textPrimary,
    }),
    metricSub: { fontSize: '11px', color: T.textSec },
    progressBar: {
        height: '3px', background: 'rgba(0,0,0,0.25)',
        borderRadius: '2px', overflow: 'hidden', marginTop: '8px',
    },
    progressFill: (pct, color) => ({
        height: '100%', borderRadius: '2px',
        background: color || T.accent,
        width: `${pct}%`, transition: 'width 0.4s ease',
    }),

    // ── Section card — glass card exactly matching home page card style ───
    sectionCard: (hasError) => ({
        position: 'relative',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${hasError ? 'rgba(247,111,114,0.45)' : T.border}`,
        borderRadius: T.radiusXl,          // 24px — matches home page
        boxShadow: '0 10px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
        marginBottom: '20px',
        overflow: 'hidden',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    }),
    // Section head uses a subtle gradient like home page card headers
    sectionHead: {
        padding: '14px 20px',
        borderBottom: `1px solid rgba(255,255,255,0.06)`,
        background: 'rgba(255,255,255,0.03)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
    },
    sectionHeadLeft:  { display: 'flex', alignItems: 'center', gap: '12px' },
    sectionTitle:     { fontSize: '14px', fontWeight: 600, color: '#FFFFFF', lineHeight: 1.25 },
    sectionSubtitle:  { fontSize: '12px', color: T.textSec, marginTop: '2px' },
    sectionBody:      { padding: '18px 22px' },
    sectionMeta:      { fontSize: '11px', color: T.textMuted, fontFamily: 'monospace' },

    // ── Two-column grid inside section ────────────────────────────────────
    grid2: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0 24px',
    },
    fullWidth: { gridColumn: '1 / -1' },

    // ── Divider ───────────────────────────────────────────────────────────
    divider: {
        height: '1px', background: 'rgba(255,255,255,0.06)',
        margin: '14px 0',
    },

    // ── Inline field + button ─────────────────────────────────────────────
    inlineField: { display: 'flex', gap: '8px', alignItems: 'flex-start' },

    // ── Pill selector ─────────────────────────────────────────────────────
    pillGroup: { display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '4px' },
    pill: (variant) => {
        const map = {
            active:   { bg: T.greenDim,  color: T.green,  border: 'rgba(62,207,142,0.35)' },
            inactive: { bg: T.redDim,    color: T.red,    border: 'rgba(247,111,114,0.35)' },
            selected: { bg: T.accentDim, color: T.accent, border: 'rgba(79,142,247,0.35)'  },
            default:  { bg: 'transparent', color: T.textSec, border: T.border },
        };
        const v = map[variant] || map.default;
        return {
            padding: '5px 14px', borderRadius: '20px',
            border: `1px solid ${v.border}`,
            background: v.bg, color: v.color,
            fontSize: '12px', fontWeight: 500,
            cursor: 'pointer', userSelect: 'none',
            transition: 'all 0.12s ease',
        };
    },

    // ── Toast notification ────────────────────────────────────────────────
    toast: {
        position: 'fixed', bottom: '24px', right: '24px',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
        backdropFilter: 'blur(16px)',
        border: `1px solid rgba(62,207,142,0.45)`,
        borderRadius: T.radiusLg,
        padding: '12px 18px',
        display: 'flex', alignItems: 'center', gap: '10px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(62,207,142,0.2)',
        fontSize: '13px', color: T.textPrimary,
        zIndex: 999,
        animation: 'slideUp 0.25s ease',
    },

    // ── Contact row grid ──────────────────────────────────────────────────
    contactRowGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr auto',
        gap: '8px',
        alignItems: 'flex-end',
        marginBottom: '10px',
    },

    // ── Loading ───────────────────────────────────────────────────────────
    loadingWrap: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', flexDirection: 'column', gap: '14px',
        background: T.bgBase,
    },
};

// =============================================================================
// SMALL REUSABLE SUB-COMPONENTS (no external deps beyond tokens)
// =============================================================================

/** Status badge */
function StatusBadge({ label, color, dim, border, showDot = true }) {
    return (
        <span style={S.badge(color, dim, border)}>
            {showDot && <span style={S.badgeDot(color)} />}
            {label}
        </span>
    );
}

/** Metric summary card */
function MetricCard({ label, value, unit, sub, pct, color }) {
    return (
        <div style={S.metricCard}>
            <div style={S.metricLabel}>{label}</div>
            <div style={S.metricValue(color)}>
                {value}
                {unit && <span style={{ fontSize: '13px', opacity: 0.7 }}> {unit}</span>}
            </div>
            {sub && <div style={S.metricSub}>{sub}</div>}
            {pct != null && (
                <div style={S.progressBar}>
                    <div style={S.progressFill(pct, color)} />
                </div>
            )}
        </div>
    );
}

/** Section card wrapper — uses Splunk Chip as the section icon badge */
function SectionCard({ chipLabel, chipAppearance = 'info', title, subtitle, meta, right, children, hasError, sectionRef }) {
    return (
        <div ref={sectionRef} style={S.sectionCard(hasError)}>
            <div style={S.sectionHead}>
                <div style={S.sectionHeadLeft}>
                    {/* Splunk Chip replaces the old emoji-in-a-div */}
                    <Chip appearance={chipAppearance} outline>
                        {chipLabel}
                    </Chip>
                    <div>
                        <div style={S.sectionTitle}>{title}</div>
                        {subtitle && <div style={S.sectionSubtitle}>{subtitle}</div>}
                    </div>
                </div>
                {meta  && <div style={S.sectionMeta}>{meta}</div>}
                {right && right}
            </div>
            <div style={S.sectionBody}>{children}</div>
        </div>
    );
}

/** Pill selector — replaces RadioList for Yes/No and small enum sets */
function PillSelect({ options, value, onChange, disabled }) {
    return (
        <div style={S.pillGroup}>
            {options.map(opt => {
                const isSelected = value === opt.value;
                let variant = 'default';
                if (isSelected) {
                    if (opt.value === 'Y' || opt.value === 'yes') variant = 'active';
                    else if (opt.value === 'N' || opt.value === 'no') variant = 'inactive';
                    else variant = 'selected';
                }
                return (
                    <div
                        key={opt.value}
                        style={{
                            ...S.pill(variant),
                            opacity: disabled ? 0.45 : 1,
                            pointerEvents: disabled ? 'none' : 'auto',
                        }}
                        onClick={() => !disabled && onChange(opt.value)}
                    >
                        {isSelected && (opt.value === 'Y' ? '✓ ' : opt.value === 'N' ? '✗ ' : '● ')}
                        {opt.label}
                    </div>
                );
            })}
        </div>
    );
}

/**
 * Sidebar navigation item.
 * `icon` is a Splunk icon component (JSX) — rendered directly rather than as emoji text.
 */
function SidebarItem({ icon, label, count, active, onClick, countColor }) {
    return (
        <div style={S.sidebarItem(active)} onClick={onClick}>
            <span style={S.sidebarIcon}>{icon}</span>
            <span>{label}</span>
            {count != null && (
                <span style={{ ...S.sidebarCount, color: countColor || T.textMuted }}>
                    {count}
                </span>
            )}
        </div>
    );
}

/** Toast notification */
function Toast({ message, onClose }) {
    return (
        <div style={S.toast}>
            <span style={{ color: T.green, fontSize: '16px' }}>✓</span>
            <span>{message}</span>
            <span
                style={{ marginLeft: 'auto', cursor: 'pointer', color: T.textMuted, fontSize: '16px' }}
                onClick={onClose}
            >×</span>
        </div>
    );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================
function ManageAssetPage() {

    // ── Theme ─────────────────────────────────────────────────────────────────
    const [colorScheme] = useState('dark');
    const [colorFamily] = useState('prisma');
    const [density]     = useState('comfortable');

    // ── Core UI state ─────────────────────────────────────────────────────────
    const [activeTabId,  setActiveTabId]  = useState('overview');
    const [isEditMode,   setIsEditMode]   = useState(false);
    const [isLoading,    setIsLoading]    = useState(false);
    const [toast,        setToast]        = useState(null);   // { message }
    const [formErrors,   setFormErrors]   = useState({});

    // ── Form values ───────────────────────────────────────────────────────────
    const [form, setForm] = useState({
        index_name:             '',
        index_description:      '',
        application_desc:       '',
        index_type:             'event',
        index_created_date:     '',
        ags_entitlement_name:   '',
        ability_app_name:       '',
        splunk_role_name:       '',
        index_size_mb:          '100',
        avg_index_usage_mb:     '0',
        index_created_by:       '',
        index_retention_period: '',
        pow_number:             '',
        index_customer_segment: '',
        index_classification:   '',
        index_cluster:          [],
        addtn_contact:          [],
        addtn_documentation:    [],
        index_active:           'Y',
        index_used:             'Y',
    });

    // ── Section refs — one entry per SectionCard across all tabs ─────────────
    // Using a single mutable ref-object so we never violate the Rules of Hooks
    const sectionRefs = useRef({});

    // Track which section heading is currently in view (for sidebar highlight)
    const [activeSection, setActiveSection] = useState('identity');

    // ── Map: tabId → ordered list of sections in that tab ────────────────────
    const TAB_SECTIONS = useMemo(() => ({
        overview: [
            { id: 'identity',     icon: <DataSource size={0.9} />, label: 'Identity'     },
            { id: 'descriptions', icon: <Search     size={0.9} />, label: 'Descriptions' },
        ],
        retention: [
            { id: 'volume',    icon: <Metrics   size={0.9} />, label: 'Volume'    },
            { id: 'lifecycle', icon: <Activity  size={0.9} />, label: 'Lifecycle' },
        ],
        contacts: [
            { id: 'contacts', icon: <Stop size={0.9} />, label: 'Contacts' },
        ],
        docs: [
            { id: 'references', icon: <External size={0.9} />, label: 'References' },
            { id: 'doclinks',   icon: <External size={0.9} />, label: 'Doc Links'  },
        ],
        classification: [
            { id: 'classification', icon: <Events size={0.9} />, label: 'Classification' },
        ],
    }), []);

    // ── IntersectionObserver — highlight sidebar item as user scrolls ─────────
    useEffect(() => {
        const sections = TAB_SECTIONS[activeTabId] || [];
        if (sections.length === 0) return;

        // Fallback: set first section as active whenever the tab changes
        setActiveSection(sections[0].id);

        const observers = [];
        sections.forEach(({ id }) => {
            const el = sectionRefs.current[id];
            if (!el) return;

            const obs = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) setActiveSection(id);
                },
                {
                    // Fire when the top 20 % of the section enters the viewport
                    rootMargin: '-10% 0px -70% 0px',
                    threshold: 0,
                }
            );
            obs.observe(el);
            observers.push(obs);
        });

        return () => observers.forEach(o => o.disconnect());
    }, [activeTabId, TAB_SECTIONS]);

    // ── scrollToSection — switch tab if needed, then smooth-scroll ────────────
    const scrollToSection = useCallback(
        (tabId, sectionId) => {
            const doScroll = () => {
                const el = sectionRefs.current[sectionId];
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setActiveSection(sectionId);
                }
            };

            if (tabId !== activeTabId) {
                // Switch tab first; let React re-render, then scroll
                setActiveTabId(tabId);
                // rAF + timeout gives the DOM time to mount the new tab's sections
                requestAnimationFrame(() => setTimeout(doScroll, 80));
            } else {
                doScroll();
            }
        },
        [activeTabId]
    );

    // ── Drop-down option arrays (replace with your real data) ─────────────────
    const architectOptions = [
        { label: '— Select Architect —', value: '' },
        { label: 'Jane Smith',           value: 'jane_smith' },
        { label: 'Bob Nguyen',           value: 'bob_nguyen' },
    ];
    const customerSegmentOptions = [
        { label: 'Enterprise', value: 'enterprise' },
        { label: 'SMB',        value: 'smb' },
        { label: 'Internal',   value: 'internal' },
        { label: 'Partner',    value: 'partner' },
    ];
    const classificationOptions = [
        { label: 'Public',       value: 'public' },
        { label: 'Internal',     value: 'internal' },
        { label: 'Confidential', value: 'confidential' },
        { label: 'Restricted',   value: 'restricted' },
    ];
    const clusterOptions = [
        { label: 'Cluster A', value: 'cluster_a' },
        { label: 'Cluster B', value: 'cluster_b' },
        { label: 'Cluster C', value: 'cluster_c' },
    ];

    // ── Handlers ──────────────────────────────────────────────────────────────
    const set = useCallback(
        (name, value) => setForm(f => ({ ...f, [name]: value })),
        []
    );
    // Splunk Text / Select onChange signature: (e, { value, name })
    const handleChange = useCallback(
        (e, { name, value }) => set(name, value),
        [set]
    );

    const handleEdit = () => setIsEditMode(true);

    const handleCancel = () => {
        setIsEditMode(false);
        setFormErrors({});
        // TODO: call your reset / re-fetch logic here
    };

    const validate = () => {
        const errors = {};
        if (!form.index_name.trim())           errors.index_name = 'Index name is required';
        if (!form.index_description.trim())    errors.index_description = 'Description is required';
        if (!form.splunk_role_name.trim())     errors.splunk_role_name = 'Role name is required';
        if (!form.ags_entitlement_name.trim()) errors.ags_entitlement_name = 'AGS entitlement name is required';
        if (!form.index_size_mb.trim())        errors.index_size_mb = 'Size is required';
        if (!form.index_created_by)            errors.index_created_by = 'Select an architect';
        if (!form.index_retention_period.trim()) errors.index_retention_period = 'Retention period is required';
        return errors;
    };

    const handleSave = () => {
        const errors = validate();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            // Jump to first tab with errors
            if (errors.index_name || errors.index_description ||
                errors.splunk_role_name || errors.ags_entitlement_name) {
                setActiveTabId('overview');
            } else {
                setActiveTabId('retention');
            }
            return;
        }
        setFormErrors({});
        setIsEditMode(false);
        // TODO: call updateKVStore / your save logic here
        setToast({ message: `Asset "${form.index_name || 'record'}" saved successfully.` });
        setTimeout(() => setToast(null), 4000);
    };

    const handleIndexCheck = () => {
        // TODO: wire to your KV-store lookup
        console.log('Checking index name:', form.index_name);
    };

    // Contacts helpers
    const addContact = () =>
        set('addtn_contact', [...form.addtn_contact, { name: '', email: '', role: '' }]);
    const removeContact = (i) =>
        set('addtn_contact', form.addtn_contact.filter((_, idx) => idx !== i));
    const updateContact = (i, field, value) => {
        const next = [...form.addtn_contact];
        next[i] = { ...next[i], [field]: value };
        set('addtn_contact', next);
    };

    // Documentation helpers
    const addDoc = () =>
        set('addtn_documentation', [...form.addtn_documentation, { label: '', url: '' }]);
    const removeDoc = (i) =>
        set('addtn_documentation', form.addtn_documentation.filter((_, idx) => idx !== i));
    const updateDoc = (i, field, value) => {
        const next = [...form.addtn_documentation];
        next[i] = { ...next[i], [field]: value };
        set('addtn_documentation', next);
    };

    // ── Tab label helper (with count badge) ──────────────────────────────────
    const tabLabel = (label, count) =>
        count ? `${label} (${count})` : label;

    // ── Derived values ────────────────────────────────────────────────────────
    const isActive        = form.index_active === 'Y';
    const descFilled      = [form.index_description, form.application_desc].filter(Boolean).length;
    const hasOverviewErr  = !!(formErrors.index_name || formErrors.index_description ||
                               formErrors.splunk_role_name || formErrors.ags_entitlement_name);
    const hasRetentionErr = !!(formErrors.index_size_mb || formErrors.index_created_by ||
                               formErrors.index_retention_period);

    // ── Loading screen ────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <SplunkThemeProvider family={colorFamily} colorScheme={colorScheme} density={density}>
                <div style={S.loadingWrap}>
                    <WaitSpinner size="large" />
                    <P style={{ color: T.textSec }}>Loading asset data…</P>
                </div>
            </SplunkThemeProvider>
        );
    }

    // =========================================================================
    // RENDER
    // =========================================================================
    return (
        <SplunkThemeProvider family={colorFamily} colorScheme={colorScheme} density={density}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap');
                @keyframes slideUp { from { transform:translateY(16px); opacity:0; } to { transform:translateY(0); opacity:1; } }
                body { background: ${T.bgBase}; }
            `}</style>

            <div style={S.page}>

                {/* ── ① TOP NAV BREADCRUMB ──────────────────────────────────── */}
                <nav style={S.topNav}>
                    <span style={S.topNavLogo}>◈ Splunk</span>
                    <span style={S.topNavSep}>/</span>
                    <span style={S.topNavPath}>
                        Data Catalog
                        <span style={{ color: T.textMuted, margin: '0 4px' }}>›</span>
                        <span style={S.topNavActive}>Manage Asset</span>
                    </span>
                    <div style={S.topNavRight}>
                        <StatusBadge
                            label="Prisma Dark"
                            color={T.accent}
                            dim={T.accentDim}
                            border="rgba(79,142,247,0.3)"
                        />
                    </div>
                </nav>

                {/* ── ① STICKY ACTION BAR ───────────────────────────────────── */}
                <div style={S.actionBar}>
                    <div style={S.actionBarLeft}>
                        <div style={S.actionBarTitle}>
                            {form.index_name || 'New Asset'}
                            <StatusBadge
                                label={isActive ? 'Active' : 'Inactive'}
                                color={isActive ? T.green : T.red}
                                dim={isActive ? T.greenDim : T.redDim}
                                border={isActive ? 'rgba(62,207,142,0.3)' : 'rgba(247,111,114,0.3)'}
                            />
                            <StatusBadge
                                label={form.index_type || 'Event'}
                                color={T.amber}
                                dim={T.amberDim}
                                border="rgba(245,166,35,0.3)"
                                showDot={false}
                            />
                        </div>
                        <div style={S.actionBarSub}>
                            index_name · Last modified by system
                        </div>
                    </div>

                    <div style={S.actionBarRight}>
                        {isEditMode ? (
                            <>
                                <Button label="Cancel" onClick={handleCancel} />
                                <Button label="Save Changes" appearance="primary" onClick={handleSave} />
                            </>
                        ) : (
                            <Button label="Edit" onClick={handleEdit} />
                        )}
                    </div>
                </div>

                {/* ── ② TAB BAR ─────────────────────────────────────────────── */}
                <div style={{
                    background: T.bgSurface,
                    borderBottom: `1px solid ${T.border}`,
                    padding: '0 24px',
                    position: 'sticky',
                    top: '104px',
                    zIndex: 90,
                }}>
                    <TabBar activeTabId={activeTabId} onChange={(e, { selectedTabId }) => setActiveTabId(selectedTabId)}>
                        <TabBar.Tab
                            label={tabLabel('Overview', hasOverviewErr ? '!' : null)}
                            tabId="overview"
                            style={hasOverviewErr ? { color: T.red } : {}}
                        />
                        <TabBar.Tab
                            label={tabLabel('Size & Retention', hasRetentionErr ? '!' : null)}
                            tabId="retention"
                            style={hasRetentionErr ? { color: T.red } : {}}
                        />
                        <TabBar.Tab
                            label={tabLabel('Contacts', form.addtn_contact.length || null)}
                            tabId="contacts"
                        />
                        <TabBar.Tab
                            label={tabLabel('Documentation', form.addtn_documentation.length || null)}
                            tabId="docs"
                        />
                        <TabBar.Tab label="Classification" tabId="classification" />
                    </TabBar>
                </div>

                {/* ── MAIN BODY (sidebar + content) ─────────────────────────── */}
                <div style={S.body}>

                    {/* ── ③ LEFT SIDEBAR ──────────────────────────────────── */}
                    <aside style={S.sidebar}>
                        {/* Quick Jump — shows sections for the CURRENT tab only */}
                        <div style={S.sidebarSection}>
                            <div style={S.sidebarLabel}>Quick Jump</div>
                            {(TAB_SECTIONS[activeTabId] || []).map(({ id, icon, label }) => (
                                <SidebarItem
                                    key={id}
                                    icon={icon}
                                    label={label}
                                    active={activeSection === id}
                                    onClick={() => scrollToSection(activeTabId, id)}
                                />
                            ))}
                            {/* Cross-tab shortcut links */}
                            {activeTabId !== 'contacts' && (
                                <SidebarItem
                                    icon={<Stop size={0.9} />}
                                    label="→ Contacts"
                                    count={form.addtn_contact.length || null}
                                    onClick={() => scrollToSection('contacts', 'contacts')}
                                />
                            )}
                            {activeTabId !== 'docs' && (
                                <SidebarItem
                                    icon={<External size={0.9} />}
                                    label="→ Docs"
                                    count={form.addtn_documentation.length || null}
                                    onClick={() => scrollToSection('docs', 'references')}
                                />
                            )}
                        </div>

                        <div style={S.sidebarDivider} />

                        <div style={S.sidebarSection}>
                            <div style={S.sidebarLabel}>Asset Health</div>
                            <SidebarItem
                                icon={<Metrics size={0.9} />}
                                label="Usage"
                                count={`${form.avg_index_usage_mb || 0} MB`}
                            />
                            <SidebarItem
                                icon={<Activity size={0.9} />}
                                label="Retention"
                                count={form.index_retention_period ? `${form.index_retention_period}d` : '—'}
                            />
                            <SidebarItem
                                icon={<Stop size={0.9} />}
                                label="Errors"
                                count={Object.keys(formErrors).length || null}
                                countColor={Object.keys(formErrors).length ? T.red : T.textMuted}
                            />
                        </div>

                        <div style={S.sidebarDivider} />

                        <div style={S.sidebarSection}>
                            <div style={S.sidebarLabel}>Related</div>
                            <SidebarItem icon={<Stop     size={0.9} />} label="Contacts"  count={form.addtn_contact.length       || null} />
                            <SidebarItem icon={<External size={0.9} />} label="Docs"      count={form.addtn_documentation.length || null} />
                            <SidebarItem icon={<Events   size={0.9} />} label="Clusters"  count={form.index_cluster.length       || null} />
                        </div>
                    </aside>

                    {/* ── MAIN CONTENT PANEL ──────────────────────────────── */}
                    <main style={S.main}>

                        {/* ── ④ METRIC SUMMARY CARDS ──────────────────────── */}
                        <div style={S.metricRow}>
                            <MetricCard
                                label="Daily Volume"
                                value={form.index_size_mb || '—'}
                                unit="MB"
                                sub="Index size per day"
                                pct={Math.min((parseInt(form.index_size_mb) || 0) / 10, 100)}
                                color={T.accent}
                            />
                            <MetricCard
                                label="Retention"
                                value={form.index_retention_period || '—'}
                                unit={form.index_retention_period ? 'days' : ''}
                                sub="Data kept on disk"
                                pct={Math.min((parseInt(form.index_retention_period) || 0) / 3.65, 100)}
                                color={T.green}
                            />
                            <MetricCard
                                label="Contacts"
                                value={form.addtn_contact.length}
                                sub={`${form.addtn_documentation.length} docs linked`}
                                pct={Math.min(form.addtn_contact.length * 25, 100)}
                                color={T.amber}
                            />
                        </div>

                        {/* =====================================================
                            TAB: OVERVIEW
                        ===================================================== */}
                        {activeTabId === 'overview' && (
                            <>
                                {/* ── ⑤ Section: Index Identity ─────────────── */}
                                <SectionCard
                                    chipLabel="Identity"
                                    chipAppearance="info"
                                    title="Index Identity"
                                    subtitle="Core identifiers and access role"
                                    hasError={hasOverviewErr}
                                    sectionRef={el => { sectionRefs.current['identity'] = el; }}
                                >
                                    <div style={S.grid2}>

                                        {/* ── ⑥ Index Name with inline validation ── */}
                                        <ControlGroup
                                            label="Index Name"
                                            required
                                            error={formErrors.index_name}
                                            help={formErrors.index_name}
                                        >
                                            <div style={S.inlineField}>
                                                <Text
                                                    name="index_name"
                                                    value={form.index_name}
                                                    disabled={!isEditMode}
                                                    onChange={handleChange}
                                                    placeholder="e.g. prod_app_logs"
                                                    error={!!formErrors.index_name}
                                                />
                                                <Button
                                                    label="Check"
                                                    disabled={!isEditMode || !form.index_name}
                                                    onClick={handleIndexCheck}
                                                />
                                            </div>
                                        </ControlGroup>

                                        <ControlGroup
                                            label="Role Name"
                                            required
                                            error={formErrors.splunk_role_name}
                                            help={formErrors.splunk_role_name}
                                        >
                                            <Text
                                                name="splunk_role_name"
                                                value={form.splunk_role_name}
                                                disabled={!isEditMode}
                                                onChange={handleChange}
                                                placeholder="e.g. sc4s_writer"
                                                error={!!formErrors.splunk_role_name}
                                            />
                                        </ControlGroup>

                                        <ControlGroup label="Ability App Name">
                                            <Text
                                                name="ability_app_name"
                                                value={form.ability_app_name}
                                                disabled={!isEditMode}
                                                onChange={handleChange}
                                                placeholder="e.g. splunk_app_prod"
                                            />
                                        </ControlGroup>

                                        <ControlGroup
                                            label="AGS Entitlement Name"
                                            required
                                            error={formErrors.ags_entitlement_name}
                                            help={formErrors.ags_entitlement_name}
                                        >
                                            <Text
                                                name="ags_entitlement_name"
                                                value={form.ags_entitlement_name}
                                                disabled={!isEditMode}
                                                onChange={handleChange}
                                                placeholder="ags-prod-write-001"
                                                error={!!formErrors.ags_entitlement_name}
                                            />
                                        </ControlGroup>

                                        {/* ── ⑦ Pill selectors for Yes/No ────── */}
                                        <div>
                                            <ControlGroup label="Index Active">
                                                <PillSelect
                                                    options={[
                                                        { label: 'Yes – Active',   value: 'Y' },
                                                        { label: 'No – Inactive',  value: 'N' },
                                                    ]}
                                                    value={form.index_active}
                                                    onChange={v => set('index_active', v)}
                                                    disabled={!isEditMode}
                                                />
                                            </ControlGroup>
                                        </div>

                                        <div>
                                            <ControlGroup label="Index In Use">
                                                <PillSelect
                                                    options={[
                                                        { label: 'Yes', value: 'Y' },
                                                        { label: 'No',  value: 'N' },
                                                    ]}
                                                    value={form.index_used}
                                                    onChange={v => set('index_used', v)}
                                                    disabled={!isEditMode}
                                                />
                                            </ControlGroup>
                                        </div>

                                    </div>
                                </SectionCard>

                                {/* ── ⑤ Section: Descriptions ───────────────── */}
                                <SectionCard
                                    chipLabel="Descriptions"
                                    chipAppearance="default"
                                    title="Descriptions"
                                    subtitle="Purpose and application context"
                                    meta={`${descFilled} / 2 filled`}
                                    sectionRef={el => { sectionRefs.current['descriptions'] = el; }}
                                >
                                    <ControlGroup
                                        label="Index Description"
                                        required
                                        error={formErrors.index_description}
                                        help={formErrors.index_description || 'Describe the purpose, source, and intended consumers of this index.'}
                                    >
                                        <Text
                                            multiline
                                            rowsMin={3}
                                            rowsMax={6}
                                            name="index_description"
                                            value={form.index_description}
                                            disabled={!isEditMode}
                                            onChange={handleChange}
                                            placeholder="Stores production application logs ingested via SC4S forwarders…"
                                            error={!!formErrors.index_description}
                                        />
                                    </ControlGroup>

                                    <div style={S.divider} />

                                    <ControlGroup
                                        label="Application Description"
                                        help="Describe the application that writes to this index."
                                    >
                                        <Text
                                            multiline
                                            rowsMin={3}
                                            rowsMax={6}
                                            name="application_desc"
                                            value={form.application_desc}
                                            disabled={!isEditMode}
                                            onChange={handleChange}
                                            placeholder="Core payment service — processes ~2M transactions/day…"
                                        />
                                    </ControlGroup>
                                </SectionCard>
                            </>
                        )}

                        {/* =====================================================
                            TAB: SIZE & RETENTION
                        ===================================================== */}
                        {activeTabId === 'retention' && (
                            <>
                                <SectionCard
                                    chipLabel="Volume"
                                    chipAppearance="success"
                                    title="Volume"
                                    subtitle="Storage sizing estimates"
                                    hasError={hasRetentionErr}
                                    sectionRef={el => { sectionRefs.current['volume'] = el; }}
                                    <div style={S.grid2}>
                                        <ControlGroup
                                            label="Index Size Per Day (MB)"
                                            required
                                            error={formErrors.index_size_mb}
                                            help={formErrors.index_size_mb}
                                        >
                                            <Text
                                                name="index_size_mb"
                                                value={form.index_size_mb}
                                                disabled={!isEditMode}
                                                onChange={handleChange}
                                                placeholder="e.g. 500"
                                                error={!!formErrors.index_size_mb}
                                            />
                                        </ControlGroup>

                                        <ControlGroup label="Avg Index Usage (MB)">
                                            <Text
                                                name="avg_index_usage_mb"
                                                value={form.avg_index_usage_mb}
                                                disabled={!isEditMode}
                                                onChange={handleChange}
                                                placeholder="e.g. 320"
                                            />
                                        </ControlGroup>
                                    </div>
                                </SectionCard>

                                <SectionCard
                                    chipLabel="Lifecycle"
                                    chipAppearance="warning"
                                    title="Lifecycle"
                                    subtitle="Creation and retention settings"
                                    sectionRef={el => { sectionRefs.current['lifecycle'] = el; }}
                                    <div style={S.grid2}>
                                        <ControlGroup
                                            label="Created By"
                                            required
                                            error={formErrors.index_created_by}
                                            help={formErrors.index_created_by}
                                        >
                                            <Select
                                                value={form.index_created_by}
                                                disabled={!isEditMode}
                                                error={!!formErrors.index_created_by}
                                                onChange={(e, { value }) => set('index_created_by', value)}
                                            >
                                                {architectOptions.map(o => (
                                                    <Select.Option key={o.value} label={o.label} value={o.value} />
                                                ))}
                                            </Select>
                                        </ControlGroup>

                                        <ControlGroup label="Created Date" required>
                                            <Date
                                                value={form.index_created_date}
                                                disabled={!isEditMode}
                                                onChange={(e, { value }) => set('index_created_date', value)}
                                            />
                                        </ControlGroup>

                                        <ControlGroup
                                            label="Retention Period (Days)"
                                            required
                                            error={formErrors.index_retention_period}
                                            help={formErrors.index_retention_period}
                                        >
                                            <Text
                                                name="index_retention_period"
                                                value={form.index_retention_period}
                                                disabled={!isEditMode}
                                                onChange={handleChange}
                                                placeholder="e.g. 90"
                                                error={!!formErrors.index_retention_period}
                                            />
                                        </ControlGroup>

                                        <div style={S.fullWidth}>
                                            <div style={S.divider} />
                                        </div>

                                        <div>
                                            <ControlGroup label="Index Active">
                                                <PillSelect
                                                    options={[
                                                        { label: 'Yes – Active',  value: 'Y' },
                                                        { label: 'No – Inactive', value: 'N' },
                                                    ]}
                                                    value={form.index_active}
                                                    onChange={v => set('index_active', v)}
                                                    disabled={!isEditMode}
                                                />
                                            </ControlGroup>
                                        </div>

                                        <div>
                                            <ControlGroup label="Index In Use">
                                                <PillSelect
                                                    options={[
                                                        { label: 'Yes', value: 'Y' },
                                                        { label: 'No',  value: 'N' },
                                                    ]}
                                                    value={form.index_used}
                                                    onChange={v => set('index_used', v)}
                                                    disabled={!isEditMode}
                                                />
                                            </ControlGroup>
                                        </div>
                                    </div>
                                </SectionCard>
                            </>
                        )}

                        {/* =====================================================
                            TAB: CONTACTS
                        ===================================================== */}
                        {activeTabId === 'contacts' && (
                            <SectionCard
                                chipLabel="Contacts"
                                chipAppearance="info"
                                title="Additional Contacts"
                                subtitle="People responsible for this index"
                                sectionRef={el => { sectionRefs.current['contacts'] = el; }}
                                right={
                                    <Button
                                        label="+ Add Contact"
                                        appearance="secondary"
                                        disabled={!isEditMode}
                                        onClick={addContact}
                                    />
                                }
                            >
                                {form.addtn_contact.length === 0 ? (
                                    <Message type="info" appearance="fill">
                                        No contacts added yet.
                                        {isEditMode
                                            ? ' Click "+ Add Contact" above to begin.'
                                            : ' Click "Edit" to add contacts.'}
                                    </Message>
                                ) : (
                                    <>
                                        {/* ── ⑧ Structured contact rows ─────── */}
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr 140px 36px',
                                            gap: '0 10px',
                                            marginBottom: '6px',
                                        }}>
                                            {['Name', 'Email', 'Role', ''].map((h, i) => (
                                                <div key={i} style={{
                                                    fontSize: '10px', fontWeight: 700,
                                                    letterSpacing: '0.08em', textTransform: 'uppercase',
                                                    color: T.textMuted, paddingBottom: '6px',
                                                    borderBottom: `1px solid ${T.border}`,
                                                }}>
                                                    {h}
                                                </div>
                                            ))}
                                        </div>

                                        {form.addtn_contact.map((c, i) => (
                                            <div key={i} style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 1fr 140px 36px',
                                                gap: '6px 10px',
                                                alignItems: 'center',
                                                padding: '6px 0',
                                                borderBottom: `1px solid ${T.border}`,
                                            }}>
                                                <Text
                                                    name={`contact_name_${i}`}
                                                    value={c.name}
                                                    disabled={!isEditMode}
                                                    placeholder="Full name"
                                                    onChange={(e, { value }) => updateContact(i, 'name', value)}
                                                />
                                                <Text
                                                    name={`contact_email_${i}`}
                                                    value={c.email}
                                                    disabled={!isEditMode}
                                                    placeholder="user@corp.com"
                                                    onChange={(e, { value }) => updateContact(i, 'email', value)}
                                                />
                                                <Select
                                                    value={c.role}
                                                    disabled={!isEditMode}
                                                    onChange={(e, { value }) => updateContact(i, 'role', value)}
                                                >
                                                    <Select.Option label="— Role —"  value="" />
                                                    <Select.Option label="Owner"     value="owner" />
                                                    <Select.Option label="Backup"    value="backup" />
                                                    <Select.Option label="Consumer"  value="consumer" />
                                                </Select>
                                                <Button
                                                    label="✕"
                                                    appearance="secondary"
                                                    disabled={!isEditMode}
                                                    onClick={() => removeContact(i)}
                                                />
                                            </div>
                                        ))}
                                    </>
                                )}
                            </SectionCard>
                        )}

                        {/* =====================================================
                            TAB: DOCUMENTATION
                        ===================================================== */}
                        {activeTabId === 'docs' && (
                            <>
                                <SectionCard
                                    chipLabel="Reference"
                                    chipAppearance="default"
                                    title="Reference Numbers"
                                    subtitle="Tracking identifiers"
                                    sectionRef={el => { sectionRefs.current['references'] = el; }}
                                    <div style={{ maxWidth: '360px' }}>
                                        <ControlGroup label="POW Number">
                                            <Text
                                                name="pow_number"
                                                value={form.pow_number}
                                                disabled={!isEditMode}
                                                onChange={handleChange}
                                                placeholder="e.g. POW-12345"
                                            />
                                        </ControlGroup>
                                    </div>
                                </SectionCard>

                                <SectionCard
                                    chipLabel="Doc Links"
                                    chipAppearance="default"
                                    title="Documentation Links"
                                    subtitle="Runbooks, wikis, and reference URLs"
                                    sectionRef={el => { sectionRefs.current['doclinks'] = el; }}
                                    right={
                                        <Button
                                            label="+ Add URL"
                                            appearance="secondary"
                                            disabled={!isEditMode}
                                            onClick={addDoc}
                                        />
                                    }
                                >
                                    {form.addtn_documentation.length === 0 ? (
                                        <Message type="info" appearance="fill">
                                            No documentation links yet.
                                            {isEditMode
                                                ? ' Click "+ Add URL" above to begin.'
                                                : ' Click "Edit" to add links.'}
                                        </Message>
                                    ) : (
                                        <>
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: '200px 1fr 36px',
                                                gap: '0 10px', marginBottom: '6px',
                                            }}>
                                                {['Label', 'URL', ''].map((h, i) => (
                                                    <div key={i} style={{
                                                        fontSize: '10px', fontWeight: 700,
                                                        letterSpacing: '0.08em', textTransform: 'uppercase',
                                                        color: T.textMuted, paddingBottom: '6px',
                                                        borderBottom: `1px solid ${T.border}`,
                                                    }}>
                                                        {h}
                                                    </div>
                                                ))}
                                            </div>

                                            {form.addtn_documentation.map((d, i) => (
                                                <div key={i} style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: '200px 1fr 36px',
                                                    gap: '6px 10px', alignItems: 'center',
                                                    padding: '6px 0',
                                                    borderBottom: `1px solid ${T.border}`,
                                                }}>
                                                    <Text
                                                        name={`doc_label_${i}`}
                                                        value={d.label}
                                                        disabled={!isEditMode}
                                                        placeholder="e.g. Runbook"
                                                        onChange={(e, { value }) => updateDoc(i, 'label', value)}
                                                    />
                                                    <Text
                                                        name={`doc_url_${i}`}
                                                        value={d.url}
                                                        disabled={!isEditMode}
                                                        placeholder="https://..."
                                                        onChange={(e, { value }) => updateDoc(i, 'url', value)}
                                                    />
                                                    <Button
                                                        label="✕"
                                                        appearance="secondary"
                                                        disabled={!isEditMode}
                                                        onClick={() => removeDoc(i)}
                                                    />
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </SectionCard>
                            </>
                        )}

                        {/* =====================================================
                            TAB: CLASSIFICATION
                        ===================================================== */}
                        {activeTabId === 'classification' && (
                            <SectionCard
                                chipLabel="Classification"
                                chipAppearance="warning"
                                title="Data Classification"
                                subtitle="Segment, sensitivity level, and cluster assignment"
                                sectionRef={el => { sectionRefs.current['classification'] = el; }}
                                <ControlGroup label="Customer Segment">
                                    <PillSelect
                                        options={customerSegmentOptions}
                                        value={form.index_customer_segment}
                                        onChange={v => set('index_customer_segment', v)}
                                        disabled={!isEditMode}
                                    />
                                </ControlGroup>

                                <div style={S.divider} />

                                <ControlGroup label="Index Classification">
                                    <PillSelect
                                        options={classificationOptions}
                                        value={form.index_classification}
                                        onChange={v => set('index_classification', v)}
                                        disabled={!isEditMode}
                                    />
                                </ControlGroup>

                                <div style={S.divider} />

                                <ControlGroup
                                    label="Index Cluster"
                                    help="Select all clusters this index is replicated to."
                                >
                                    <Multiselect
                                        values={form.index_cluster}
                                        disabled={!isEditMode}
                                        onChange={(e, { values }) => set('index_cluster', values)}
                                    >
                                        {clusterOptions.map(o => (
                                            <Multiselect.Option key={o.value} label={o.label} value={o.value} />
                                        ))}
                                    </Multiselect>
                                </ControlGroup>
                            </SectionCard>
                        )}

                    </main>
                </div>

                {/* ── TOAST ─────────────────────────────────────────────────── */}
                {toast && (
                    <Toast message={toast.message} onClose={() => setToast(null)} />
                )}

            </div>
        </SplunkThemeProvider>
    );
}

export default ManageAssetPage;
