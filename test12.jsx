// ... keep imports same

const SplunkDataCatalogueHomePage = () => {
    // ... keep existing states

    // --- Optimized Sorting Logic ---
    const sortedResults = useMemo(() => {
        const copy = [...filteredResults];
        const [key, dir] = String(sortType).split(':');
        const isDesc = dir === 'desc';

        copy.sort((a, b) => {
            let av = a?.[key || 'index_name'];
            let bv = b?.[key || 'index_name'];

            if (av == null) return 1;
            if (bv == null) return -1;

            // Numeric check
            const an = Number(av);
            const bn = Number(bv);
            if (!Number.isNaN(an) && !Number.isNaN(bn)) {
                return isDesc ? bn - an : an - bn;
            }

            // String check
            const comp = String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' });
            return isDesc ? -comp : comp;
        });
        return copy;
    }, [filteredResults, sortType]);

    // --- Pagination Math ---
    const totalPages = Math.max(1, Math.ceil(sortedResults.length / postsPerPage));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const start = (safeCurrentPage - 1) * postsPerPage;
    const currentPageResults = useMemo(() => 
        sortedResults.slice(start, start + postsPerPage), 
    [sortedResults, start, postsPerPage]);

    return (
        <SplunkThemeProvider family={colorFamily} colorScheme={colorScheme} density={density}>
            <Card style={{ minWidth: '100%' }}>
                <div style={{ padding: '20px 20px 0 20px' }}>
                    <Heading level={2} style={{ margin: 0 }}>Splunk Data Catalogue</Heading>
                    <Text color="muted">Browse and manage indexed metadata across the environment.</Text>
                </div>

                <Card.Body>
                    {/* Toolbar Area */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
                        <div style={{ flex: 1, maxWidth: 600 }}>
                            <ModernSearchBar
                                value={searchTerm}
                                onChange={setSearchTerm}
                                filterKey={searchFilterName}
                                onFilterKeyChange={setSearchFilterName}
                                options={searchFieldOptions}
                                placeholder="Press '/' to search..."
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <HomeHelpMenuReact />
                            <Button
                                icon={<Plus />}
                                label="Add Asset"
                                to={`manage-asset?key=`}
                                openInNewContext
                                appearance="primary"
                            />
                        </div>
                    </div>

                    <CardLayout cardWidth={320} gutterSize={20}>
                        {currentPageResults.map((asset) => (
                            <Card key={asset._key} style={cardShellStyle}>
                                <Card.Header
                                    title={asset.index_name || 'Unknown Index'}
                                    subtitle={
                                        asset.ags_entitlement_name 
                                        ? `Group: ${asset.ags_entitlement_name}` 
                                        : 'No Group Assigned'
                                    }
                                    actionsSecondary={renderEllipsisMenu(asset, asset.index_name)}
                                />
                                
                                <div style={sectionPad}>
                                    {/* Status Chips */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                                        <Chip appearance={asset.index_active ? 'success' : 'neutral'}>
                                            {asset.index_active ? 'Active' : 'Inactive'}
                                        </Chip>
                                        <Chip appearance="info" outline>
                                            {asset.index_type || 'Event'}
                                        </Chip>
                                        <Chip appearance="neutral">
                                            {asset.index_retention_period || '0'} Days
                                        </Chip>
                                    </div>

                                    <div style={{ ...bodyTextStyle, ...clamp3, minHeight: 60 }}>
                                        {asset.index_description || 'No description provided.'}
                                    </div>

                                    <div style={{ marginTop: 12 }}>
                                        <MetaRow label="Size">
                                            <Text bold>{asset.index_size_mb || 0} MB</Text>
                                        </MetaRow>
                                        <MetaRow label="ITAM BSA">
                                            <Text color="muted">{asset.source_itam_bsa || 'N/A'}</Text>
                                        </MetaRow>
                                    </div>
                                </div>

                                <Card.Footer>
                                    <Button
                                        appearance="secondary"
                                        to={`manage-asset?key=${asset._key}`}
                                        openInNewContext
                                        label="View Full Details"
                                        style={{ width: '100%' }}
                                    />
                                </Card.Footer>
                            </Card>
                        ))}
                    </CardLayout>

                    <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                        <Paginator
                            current={safeCurrentPage}
                            totalPages={totalPages}
                            onChange={(_, { page }) => setCurrentPage(page)}
                        />
                    </div>
                </Card.Body>
            </Card>
            
            <HomePageHistoryModalPanelReact ref={childRef} />
            <HomeIndexDetailsModalPanelReact ref={childRef1} />
        </SplunkThemeProvider>
    );
};


// New "Modern" Styling Tokens
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

// ... inside your component

return (
    <SplunkThemeProvider family="prisma" colorScheme="dark" density="comfortable">
        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
            
            {/* 1. Hero Search Section */}
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                <Heading level={1} style={{ fontSize: '42px', fontWeight: 800, marginBottom: '12px' }}>
                    Data Catalogue
                </Heading>
                <Text size="large" color="muted">Explore indexes, track retention, and manage assets.</Text>
                
                <div style={{ marginTop: '32px' }}>
                    <div style={searchWrapperStyle}>
                        <ModernSearchBar
                            value={searchTerm}
                            onChange={setSearchTerm}
                            filterKey={searchFilterName}
                            onFilterKeyChange={setSearchFilterName}
                            options={searchFieldOptions}
                            placeholder="Find an index... (Press /)"
                        />
                    </div>
                </div>
            </div>

            {/* 2. Quick Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
                <Text bold style={{ fontSize: '18px' }}>{filteredResults.length} Assets Found</Text>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <HomeHelpMenuReact />
                    <Button appearance="primary" icon={<Plus />} label="New Asset" to="manage-asset?key=" />
                </div>
            </div>

            {/* 3. The Modern Grid */}
            <CardLayout cardWidth={340} gutterSize={24}>
                {currentPageResults.map((asset) => (
                    <div 
                        key={asset._key} 
                        style={modernCardStyle}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)';
                            e.currentTarget.style.transform = 'translateY(-5px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        {/* Header Section */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>{asset.index_name}</div>
                            {renderEllipsisMenu(asset, asset.index_name)}
                        </div>

                        {/* Metadata Pills */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                            <Chip appearance={asset.index_active ? 'success' : 'neutral'}>
                                {asset.index_active ? 'Active' : 'Offline'}
                            </Chip>
                            <Chip outline>{asset.index_type || 'Event'}</Chip>
                            <Chip appearance="info">{asset.index_retention_period}d Retention</Chip>
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
                        </div>

                        <div style={{ ...bodyTextStyle, ...clamp3, minHeight: '60px', opacity: 0.8 }}>
                            {asset.index_description || "No description provided for this data asset."}
                        </div>

                        <div style={{ marginTop: '24px' }}>
                            <Button 
                                appearance="secondary" 
                                label="View Asset Details" 
                                style={{ width: '100%', borderRadius: '12px' }}
                                to={`manage-asset?key=${asset._key}`}
                            />
                        </div>
                    </div>
                ))}
            </CardLayout>

            {/* Pagination */}
            <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
                <Paginator
                    current={safeCurrentPage}
                    totalPages={totalPages}
                    onChange={(_, { page }) => setCurrentPage(page)}
                />
            </div>
        </div>
    </SplunkThemeProvider>
);
