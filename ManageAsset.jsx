// STYLES: Enhanced Background and Glassmorphism Card
const styles = {
    pageBackground: {
        // Replace with your actual image path or import
        backgroundImage: `url('DataCatalogueHomePageBackGround.jpg')`, 
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed', // Keeps image static while scrolling
        minHeight: '100vh',
        padding: '40px 20px', // Top/Bottom padding for spacing
        display: 'flex',
        justifyContent: 'center', // Centers the form horizontally
        alignItems: 'flex-start',
    },
    glassCard: {
        // This overrides the default solid card color
        backgroundColor: 'rgba(25, 25, 25, 0.85)', // Dark semi-transparent
        backdropFilter: 'blur(12px)', // Blurs the background image behind the card
        border: '1px solid rgba(255, 255, 255, 0.15)', // Subtle glowing border
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)', // Deep shadow for depth
        maxWidth: '1200px', // Prevents form from getting too wide
        width: '100%',
        borderRadius: '12px', // Softer corners
    },
    heading: {
        color: '#ffffff',
        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
        marginBottom: '20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: '15px'
    }
};




// ... inside ManageAssetRegistryReact ...

    // Loading State with Background
    if (isLoading === true) {
        return (
            <SplunkThemeProvider family={colorFamily} colorScheme={colorScheme} density={density}>
                <div style={styles.pageBackground}>
                    <Card style={styles.glassCard}>
                        <Card.Body>
                            <WaitSpinner size="large" />
                            <div style={{textAlign: 'center', marginTop: '20px', color: '#ccc'}}>
                                Loading Asset Registry...
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </SplunkThemeProvider>
        );
    }

    // Main Render
    return (
        <SplunkThemeProvider family={colorFamily} colorScheme={colorScheme} density={density}>
            {/* 1. WRAPPER DIV for Background Image */}
            <div style={styles.pageBackground}>
                
                {/* 2. CARD with "Glass" Style */}
                <Card style={styles.glassCard}>
                    <Card.Body>
                        
                        {/* Heading with border */}
                        <div style={styles.heading}>
                            <Heading level={2}>Splunk Data Catalog Manage Asset</Heading>
                        </div>

                        {infoMessage.visible && (
                            <Message
                                appearance="fill"
                                type={infoMessage.type || 'info'}
                                onRequestRemove={handleMessageRemove}
                                style={{marginBottom: '20px'}}
                            >
                                {infoMessage.message}
                            </Message>
                        )}

                        {/* Top Controls (Color/Density Toggle) */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                            <ControlGroup label="">
                                <Dropdown toggle={toggle} retainFocus closeReasons={closeReasons}>
                                    <div style={{ padding: 20, width: 300 }}>
                                        <ControlGroup label="Color" labelPosition="top">
                                            <RadioList
                                                name="color_scheme"
                                                value={colorScheme}
                                                onChange={(event, { value }) => setColorScheme(value)}
                                            >
                                                <RadioList.Option value="light">Light</RadioList.Option>
                                                <RadioList.Option value="dark">Dark</RadioList.Option>
                                            </RadioList>
                                        </ControlGroup>
                                        {/* ... (Keep your existing Family and Density controls here) ... */}
                                    </div>
                                </Dropdown>
                            </ControlGroup>

                            <ControlGroup label="" style={{ marginLeft: '10px' }}>
                                <Button
                                    label="Save"
                                    appearance="primary"
                                    type="submit"
                                    value="Submit"
                                    onClick={handleSubmit}
                                    disabled={saveButtonDisabled}
                                />
                                <Button
                                    label="Edit"
                                    appearance="default" // Changed to default for contrast against Primary Save
                                    type="edit"
                                    value="Edit"
                                    onClick={handleEdit}
                                    disabled={editButtonDisabled}
                                    style={{ marginLeft: '10px' }}
                                />
                            </ControlGroup>
                        </div>

                        {/* ---------------------------------------
                           EXISTING PANELS (Copy your panels here)
                           ---------------------------------------
                        */}
                        
                        <CollapsiblePanel
                            title="Index Overview"
                            onRequestClose={handleRequestClose}
                            onRequestOpen={handleRequestOpen}
                            open={includes(open, 1)}
                            description="Basic details of the index"
                            panelId={1}
                            style={{ background: 'transparent' }} // Ensure panel blends in
                        >
                             {/* ... Your Index Overview Content ... */}
                             <ControlGroup label="Index Name (*)" help={formErrors.index_name_error}>
                                <Text
                                    placeholder="index name"
                                    name="index_name"
                                    onChange={(e,data)=> handleInputChange(e,data)}
                                    value={FormInputvalues.index_name}
                                    error={formErrors.index_name_Invalid}
                                    disabled={indexNameDisabled}
                                />
                                <Button
                                    disabled={checkButtonDisabled}
                                    label="Check"
                                    appearance="primary"
                                    type="submit"
                                    value="IndexValidate"
                                    onClick={handleIndexValidate}
                                />
                            </ControlGroup>
                            {/* ... Rest of your inputs ... */}
                        </CollapsiblePanel>

                        {/* Repeat for other CollapsiblePanels (2, 3, 4, 5) */}
                        {/* Ensure you just copy paste the content inside the panels from your original code */}
                        
                        <CollapsiblePanel
                            title="Index Size & Retentention Overview"
                            onRequestClose={handleRequestClose}
                            onRequestOpen={handleRequestOpen}
                            open={includes(open, 2)}
                            description="Index sizing details"
                            panelId={2}
                        >
                            {/* ... Content Panel 2 ... */}
                        </CollapsiblePanel>

                         {/* ... Content Panel 3, 4, 5 ... */}

                    </Card.Body>
                </Card>
            </div>
        </SplunkThemeProvider>
    );

// ... inside ManageAssetRegistryReact ...

    // Loading State with Background
    if (isLoading === true) {
        return (
            <SplunkThemeProvider family={colorFamily} colorScheme={colorScheme} density={density}>
                <div style={styles.pageBackground}>
                    <Card style={styles.glassCard}>
                        <Card.Body>
                            <WaitSpinner size="large" />
                            <div style={{textAlign: 'center', marginTop: '20px', color: '#ccc'}}>
                                Loading Asset Registry...
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </SplunkThemeProvider>
        );
    }

    // Main Render
    return (
        <SplunkThemeProvider family={colorFamily} colorScheme={colorScheme} density={density}>
            {/* 1. WRAPPER DIV for Background Image */}
            <div style={styles.pageBackground}>
                
                {/* 2. CARD with "Glass" Style */}
                <Card style={styles.glassCard}>
                    <Card.Body>
                        
                        {/* Heading with border */}
                        <div style={styles.heading}>
                            <Heading level={2}>Splunk Data Catalog Manage Asset</Heading>
                        </div>

                        {infoMessage.visible && (
                            <Message
                                appearance="fill"
                                type={infoMessage.type || 'info'}
                                onRequestRemove={handleMessageRemove}
                                style={{marginBottom: '20px'}}
                            >
                                {infoMessage.message}
                            </Message>
                        )}

                        {/* Top Controls (Color/Density Toggle) */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                            <ControlGroup label="">
                                <Dropdown toggle={toggle} retainFocus closeReasons={closeReasons}>
                                    <div style={{ padding: 20, width: 300 }}>
                                        <ControlGroup label="Color" labelPosition="top">
                                            <RadioList
                                                name="color_scheme"
                                                value={colorScheme}
                                                onChange={(event, { value }) => setColorScheme(value)}
                                            >
                                                <RadioList.Option value="light">Light</RadioList.Option>
                                                <RadioList.Option value="dark">Dark</RadioList.Option>
                                            </RadioList>
                                        </ControlGroup>
                                        {/* ... (Keep your existing Family and Density controls here) ... */}
                                    </div>
                                </Dropdown>
                            </ControlGroup>

                            <ControlGroup label="" style={{ marginLeft: '10px' }}>
                                <Button
                                    label="Save"
                                    appearance="primary"
                                    type="submit"
                                    value="Submit"
                                    onClick={handleSubmit}
                                    disabled={saveButtonDisabled}
                                />
                                <Button
                                    label="Edit"
                                    appearance="default" // Changed to default for contrast against Primary Save
                                    type="edit"
                                    value="Edit"
                                    onClick={handleEdit}
                                    disabled={editButtonDisabled}
                                    style={{ marginLeft: '10px' }}
                                />
                            </ControlGroup>
                        </div>

                        {/* ---------------------------------------
                           EXISTING PANELS (Copy your panels here)
                           ---------------------------------------
                        */}
                        
                        <CollapsiblePanel
                            title="Index Overview"
                            onRequestClose={handleRequestClose}
                            onRequestOpen={handleRequestOpen}
                            open={includes(open, 1)}
                            description="Basic details of the index"
                            panelId={1}
                            style={{ background: 'transparent' }} // Ensure panel blends in
                        >
                             {/* ... Your Index Overview Content ... */}
                             <ControlGroup label="Index Name (*)" help={formErrors.index_name_error}>
                                <Text
                                    placeholder="index name"
                                    name="index_name"
                                    onChange={(e,data)=> handleInputChange(e,data)}
                                    value={FormInputvalues.index_name}
                                    error={formErrors.index_name_Invalid}
                                    disabled={indexNameDisabled}
                                />
                                <Button
                                    disabled={checkButtonDisabled}
                                    label="Check"
                                    appearance="primary"
                                    type="submit"
                                    value="IndexValidate"
                                    onClick={handleIndexValidate}
                                />
                            </ControlGroup>
                            {/* ... Rest of your inputs ... */}
                        </CollapsiblePanel>

                        {/* Repeat for other CollapsiblePanels (2, 3, 4, 5) */}
                        {/* Ensure you just copy paste the content inside the panels from your original code */}
                        
                        <CollapsiblePanel
                            title="Index Size & Retentention Overview"
                            onRequestClose={handleRequestClose}
                            onRequestOpen={handleRequestOpen}
                            open={includes(open, 2)}
                            description="Index sizing details"
                            panelId={2}
                        >
                            {/* ... Content Panel 2 ... */}
                        </CollapsiblePanel>

                         {/* ... Content Panel 3, 4, 5 ... */}

                    </Card.Body>
                </Card>
            </div>
        </SplunkThemeProvider>
    );
