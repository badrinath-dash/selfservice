const [activeFilters, setActiveFilters] = useState({
    activeOnly: 'all', // 'all', 'active', 'inactive'
    type: 'all',       // 'all', 'events', 'metrics'
    classification: 'all'
});




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


return (
    <SplunkThemeProvider family="prisma" colorScheme="dark" density="comfortable">
        <div style={{ padding: '40px', maxWidth: '1600px', margin: '0 auto' }}>
            
            {/* Header Section remains at the top */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <Heading level={1} style={{ fontSize: '36px', fontWeight: 800 }}>Data Catalogue</Heading>
                <div style={searchWrapperStyle}>
                    <ModernSearchBar 
                        value={searchTerm} 
                        onChange={setSearchTerm} 
                        placeholder="Search indexes..." 
                    />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
                
                {/* --- MODERN FILTER SIDEBAR --- */}
                <aside style={{ width: '280px', position: 'sticky', top: '40px' }}>
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
                                    appearance={activeFilters.type === type ? 'primary' : 'neutral'}
                                    onClick={() => setActiveFilters(prev => ({ ...prev, type }))}
                                    style={{ cursor: 'pointer', textTransform: 'capitalize' }}
                                >
                                    {type}
                                </Chip>
                            ))}
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                        <Button 
                            appearance="pill" 
                            label="Clear All Filters" 
                            onClick={() => setActiveFilters({ activeOnly: 'all', type: 'all' })}
                            style={{ width: '100%' }}
                        />
                    </div>
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
                            <div key={asset._key} style={modernCardStyle}>
                                {/* ... card content ... */}
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
