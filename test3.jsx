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

    {/* REPLACEMENT: CSS Grid instead of CardLayout for perfect gutters and sizing */}
    <div style={{
        display: 'grid',
        // This creates columns that are at least 300px wide, but fill the space. 
        // Adjust '300px' if you want wider/narrower cards.
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '24px', // This is your controlled Gutter size
        alignItems: 'stretch' // Ensures all cards in a row are the same height
    }}>
        {currentPageResults.map((asset) => (
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

                    {/* Description: Strict Containment */}
                    <div style={{ 
                        ...bodyTextStyle, 
                        marginBottom: '20px',
                        flex: 1, // Pushes footer down
                        
                        // THESE LINES FIX THE CARD WIDTH ISSUE:
                        overflowWrap: 'anywhere', // Force breaks even in middle of long strings
                        wordBreak: 'break-word',  // Fallback
                        hyphens: 'auto',
                        
                        // Line clamping
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
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
    </div>

    <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
        <Paginator
            current={safeCurrentPage}
            totalPages={totalPages}
            onChange={(_, { page }) => setCurrentPage(page)}
        />
    </div>
</main>
