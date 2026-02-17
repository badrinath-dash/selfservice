{/* Header Section */}
<div style={{ textAlign: 'center', marginBottom: '40px' }}>
    <Heading level={1} style={{ fontSize: '36px', fontWeight: 800 }}>Data Catalogue</Heading>
    
    {/* Merged Search Bar + Results Count Container */}
    <div style={{
        ...searchWrapperStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 20px 4px 4px', // Extra padding on right for text
        gap: '12px' // Space between search bar and count
    }}>
        {/* Search Input Area */}
        <div style={{ flex: 1 }}>
            <ModernSearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search indexes..."
                filterKey={searchFilterName}
                onFilterKeyChange={(e, { value }) => setSearchFilterName(value)}
                options={searchFieldOptions}
            />
        </div>

        {/* Divider Line */}
        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />

        {/* Results Count Text */}
        <div style={{ 
            color: '#9AA4AE', 
            fontSize: '14px', 
            fontWeight: 600,
            whiteSpace: 'nowrap',
            minWidth: '80px', // Prevents jumping when numbers change
            textAlign: 'right'
        }}>
            {filteredResults.length} Results
        </div>
    </div>
</div>
