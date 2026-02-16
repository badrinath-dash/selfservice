{currentPageResults.map((asset) => {
    const isMetrics = (asset?.index_type || '').toLowerCase() === 'metrics';
    const typeColor = isMetrics ? '#B66DFF' : '#00D1AF'; 
    const TypeIcon = isMetrics ? Metrics : Event;

    return (
        <div key={asset._key} style={modernCardStyle}>
            {/* --- HEADER ROW --- */}
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
                        boxShadow: `inset 0 0 10px ${typeColor}15`, // Subtle internal glow
                        color: typeColor
                    }} title={isMetrics ? 'Metrics' : 'Event'}>
                        <TypeIcon size={1.2} />
                    </div>

                    {/* Ellipsis Menu */}
                    {renderEllipsisMenu(asset, asset.index_name)}
                </div>
            </div>

            {/* --- REST OF CARD (Pills, Description, etc.) --- */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <Chip appearance={asset.index_active ? 'success' : 'neutral'}>
                    {asset.index_active ? 'Active' : 'Inactive'}
                </Chip>
                <Chip outline>Retention: {asset.index_retention_period}d</Chip>
            </div>
            
            <div style={{ ...bodyTextStyle, ...clamp3, minHeight: '54px', fontSize: '13px', opacity: 0.7 }}>
                {asset.index_description || "No description provided."}
            </div>

            {/* ... Bento Row and Detail Button ... */}
        </div>
    );
})}


const [activeFilters, setActiveFilters] = useState({
    activeOnly: 'all',
    type: 'all',
    showInternal: 'exclude' // 'all', 'only', 'exclude'
});
// sortType already exists in your original code, we will just map it to the UI


const filteredResults = useMemo(() => {
    return assetValues.filter((row) => {
        const name = (row?.index_name || '').toLowerCase();
        const isInternal = name.startsWith('_');

        // Internal Index Logic
        const matchesInternal = 
            activeFilters.showInternal === 'all' || 
            (activeFilters.showInternal === 'only' ? isInternal : !isInternal);

        // ... combine with your existing Search, Status, and Type filters ...
        return matchesSearch && matchesStatus && matchesType && matchesInternal;
    });
}, [assetValues, searchFilterName, normalizedSearch, activeFilters]);



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




    <aside style={{ width: '280px', position: 'sticky', top: '40px', paddingRight: '10px' }}>
    
    {/* ... Sort Section ... */}
    {/* ... Internal Index Section ... */}
    {/* ... Status Section ... */}

    {/* --- 4. RESULTS PER PAGE --- */}
    <div style={{ marginBottom: '32px' }}>
        <Heading level={4} style={{ marginBottom: '16px', color: '#9AA4AE' }}>Page Size</Heading>
        <div style={{ display: 'flex', gap: '8px' }}>
            {[10, 20, 50, 100].map((size) => (
                <Button
                    key={size}
                    appearance={postsPerPage === size ? 'primary' : 'secondary'}
                    label={String(size)}
                    onClick={() => setPostsPerPage(size)}
                    style={{ flex: 1, minWidth: 0, padding: '4px' }}
                />
            ))}
        </div>
        <Text size="small" color="muted" style={{ marginTop: '8px', display: 'block' }}>
            Showing {Math.min(postsPerPage, filteredResults.length)} of {filteredResults.length}
        </Text>
    </div>

    {/* Clear Filters Button */}
    <Button 
        appearance="pill" 
        label="Reset All" 
        onClick={() => {
            setActiveFilters({ activeOnly: 'all', type: 'all', showInternal: 'exclude' });
            setSortType('index_name');
            setPostsPerPage(10);
        }}
        style={{ width: '100%', marginTop: '10px' }}
    />
</aside>

        
        </div>
    </SplunkThemeProvider>
);
