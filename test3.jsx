{currentPageResults.map((asset) => {
    const isMetrics = (asset?.index_type || '').toLowerCase() === 'metrics';
    
    // Define modern Splunk-themed colors
    const typeColor = isMetrics ? '#B66DFF' : '#00D1AF'; // Purple for Metrics, Teal for Events
    const TypeIcon = isMetrics ? Metrics : Event;

    return (
        <div key={asset._key} style={modernCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* The Splunk React Icon */}
                    <TypeIcon size={1.5} style={{ color: typeColor }} /> 
                    
                    <div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                            {asset.index_name}
                        </div>
                        <div style={{ fontSize: '10px', color: typeColor, fontWeight: 600, letterSpacing: '0.5px' }}>
                            {isMetrics ? 'METRICS INDEX' : 'EVENT INDEX'}
                        </div>
                    </div>
                </div>
                {renderEllipsisMenu(asset, asset.index_name)}
            </div>

            {/* Rest of your card content (Pills, Description, Bento Box) */}
            ...
        </div>
    );
})}


{currentPageResults.map((asset) => (
    <div key={asset._key} style={modernCardStyle}>
        
        {/* 1. Add the Icon Indicator here */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <IndexTypeIndicator type={asset.index_type} />
            {renderEllipsisMenu(asset, asset.index_name)}
        </div>

        {/* 2. Title and rest of the content */}
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
            {asset.index_name}
        </div>
        
        <div style={{ fontSize: '12px', color: '#9AA4AE', marginBottom: '16px' }}>
            {asset.index_type?.toUpperCase() || 'EVENT'} DATASET
        </div>

        {/* ... existing metadata pills and bento row ... */}
    </div>
))}



{currentPageResults.map((asset) => (
    <div key={asset._key} style={modernCardStyle}>
        
        {/* 1. Add the Icon Indicator here */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <IndexTypeIndicator type={asset.index_type} />
            {renderEllipsisMenu(asset, asset.index_name)}
        </div>

        {/* 2. Title and rest of the content */}
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
            {asset.index_name}
        </div>
        
        <div style={{ fontSize: '12px', color: '#9AA4AE', marginBottom: '16px' }}>
            {asset.index_type?.toUpperCase() || 'EVENT'} DATASET
        </div>

        {/* ... existing metadata pills and bento row ... */}
    </div>
))}

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
