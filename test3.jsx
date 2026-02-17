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




{/* --- MAIN CONTENT AREA --- */}
<main style={{ flex: 1 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={searchWrapperStyle}>
            <Text>{filteredResults.length} Results Found</Text>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
            <HomeHelpMenuReact />
            <Button appearance="primary" icon={<Plus />} label="Add" to="manage-asset?key=" />
        </div>
    </div>

    {/* UPDATED: Increased gutterSize to 24 and adjusted cardWidth slightly if needed */}
    <CardLayout cardWidth={340} gutterSize={24} cardMaxWidth={340} alignCards={'left'}>
        {currentPageResults.map((asset) => (
            <div key={asset._key}
                style={{
                    ...modernCardStyle,
                    height: '100%', // Ensures card takes full height of the row
                    boxSizing: 'border-box' // Prevents padding from adding to width
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
                    alignItems: 'center', // Vertically center icon and text
                    marginBottom: '16px',
                    gap: '12px' 
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <IndexTypeIndicator type={asset.index_type} />
                        <div style={{ 
                            fontSize: '18px', 
                            fontWeight: 700, 
                            color: '#fff',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis' 
                        }} title={asset.index_name}>
                            {asset.index_name}
                        </div>
                    </div>
                    
                    <div style={{ flexShrink: 0 }}>
                        {renderEllipsisMenu(asset, asset.index_name)}
                    </div>
                </div>

                {/* 2. Content Body */}
                <div style={{ flex: 1 }}>
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
                            <div style={{ fontSize: '14px', fontWeight: 600 }}>{asset.index_size_mb} MB</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '10px', color: '#9AA4AE', textTransform: 'uppercase' }}>Avg Usage</div>
                            <div style={{ fontSize: '14px', fontWeight: 600 }}>{asset.avg_index_usage_mb} MB</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '10px', color: '#9AA4AE', textTransform: 'uppercase' }}>Retention</div>
                            <div style={{ fontSize: '14px', fontWeight: 600 }}>{asset.index_retention_period} Days</div>
                        </div>
                    </div>

                    {/* Description: Added word-break and consistent height */}
                    <div style={{ 
                        ...bodyTextStyle, 
                        ...clamp3, 
                        minHeight: '60px', // Ensures vertical alignment
                        opacity: 0.8,
                        wordBreak: 'break-word', // CRITICAL: prevents card expansion on long words
                        marginBottom: '20px'
                    }}>
                        {asset.index_description || "No description provided for this data asset."}
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
