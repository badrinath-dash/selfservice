import React from 'react';
import styled from 'styled-components';
import Card from '@splunk/react-ui/Card';
import Button from '@splunk/react-ui/Button';
import Menu from '@splunk/react-ui/Menu';
import Remove from '@splunk/react-icons/enterprise/Remove';
import External from '@splunk/react-icons/External';
import DataSource from '@splunk/react-icons/enterprise/DataSource';
import Activity from '@splunk/react-icons/Activity';
import { NavigationProvider } from '@splunk/react-ui/Clickable';

// Splunkbase-inspired Card Styling
const SplunkbaseCard = styled(Card)`
    height: 100%;
    display: flex;
    flex-direction: column;
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.2s ease-in-out;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    background: ${props => props.theme.colorScheme === 'dark' ? '#1a1a1a' : '#ffffff'};
    border: 1px solid ${props => props.theme.colorScheme === 'dark' ? '#2a2a2a' : '#e0e0e0'};

    &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateY(-2px);
    }
`;

const CardImageContainer = styled.div`
    width: 100%;
    height: 160px;
    background: ${props => {
        // Generate color based on index name hash
        const colors = ['#0877A6', '#DC4E41', '#F1813F', '#84BD00', '#9C27B0', '#00897B'];
        const hash = props.$indexName?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
        return colors[hash % colors.length];
    }};
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.1) 100%);
    }
`;

const CardImageText = styled.div`
    color: white;
    font-size: 48px;
    font-weight: 700;
    text-transform: uppercase;
    z-index: 1;
    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
`;

const CardContentWrapper = styled.div`
    padding: 20px;
    flex: 1;
    display: flex;
    flex-direction: column;
`;

const CardTitle = styled.h3`
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
    color: ${props => props.theme.colorScheme === 'dark' ? '#ffffff' : '#1a1a1a'};
    display: flex;
    align-items: center;
    gap: 8px;
`;

const CardSubtitle = styled.div`
    font-size: 13px;
    color: ${props => props.theme.colorScheme === 'dark' ? '#b0b0b0' : '#666666'};
    margin-bottom: 12px;
`;

const CardDescription = styled.p`
    font-size: 14px;
    line-height: 1.5;
    color: ${props => props.theme.colorScheme === 'dark' ? '#d0d0d0' : '#4a4a4a'};
    margin: 0 0 16px 0;
    flex: 1;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
`;

const CardMetadata = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 16px;
    padding-top: 12px;
    border-top: 1px solid ${props => props.theme.colorScheme === 'dark' ? '#2a2a2a' : '#e0e0e0'};
`;

const MetadataItem = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const MetadataLabel = styled.span`
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    color: ${props => props.theme.colorScheme === 'dark' ? '#888888' : '#999999'};
    letter-spacing: 0.5px;
`;

const MetadataValue = styled.span`
    font-size: 15px;
    font-weight: 600;
    color: ${props => props.theme.colorScheme === 'dark' ? '#ffffff' : '#1a1a1a'};
`;

const CardBadges = styled.div`
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 12px;
`;

const Badge = styled.span`
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    background: ${props => {
        if (props.$type === 'active') return props.theme.colorScheme === 'dark' ? '#1B5E20' : '#C8E6C9';
        if (props.$type === 'inactive') return props.theme.colorScheme === 'dark' ? '#B71C1C' : '#FFCDD2';
        if (props.$type === 'classification') return props.theme.colorScheme === 'dark' ? '#1565C0' : '#BBDEFB';
        return props.theme.colorScheme === 'dark' ? '#424242' : '#E0E0E0';
    }};
    color: ${props => {
        if (props.$type === 'active') return props.theme.colorScheme === 'dark' ? '#A5D6A7' : '#2E7D32';
        if (props.$type === 'inactive') return props.theme.colorScheme === 'dark' ? '#EF9A9A' : '#C62828';
        if (props.$type === 'classification') return props.theme.colorScheme === 'dark' ? '#90CAF9' : '#1565C0';
        return props.theme.colorScheme === 'dark' ? '#B0B0B0' : '#666666';
    }};
`;

const CardFooter = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid ${props => props.theme.colorScheme === 'dark' ? '#2a2a2a' : '#e0e0e0'};
`;

const FooterInfo = styled.div`
    font-size: 12px;
    color: ${props => props.theme.colorScheme === 'dark' ? '#888888' : '#999999'};
`;

const CardActions = styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
`;

const StatusIndicator = styled.div`
    position: absolute;
    top: 12px;
    right: 12px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${props => props.$active ? '#4CAF50' : '#F44336'};
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    z-index: 2;
`;

// Main Card Component
export const IndexCardSplunkbaseStyle = ({
    assetValue,
    onMenuClick,
    onHistoryClick,
    onMetadataClick,
    onDeleteClick,
    isDeleteDisabled,
    oneCMURL,
    engagementURL,
    splunkURL,
    handleClick
}) => {
    const isActive = String(assetValue.index_active).toLowerCase() === 'true' || assetValue.index_active === 1;
    
    // Get first 2 letters of index name for the image placeholder
    const initials = assetValue.index_name?.substring(0, 2) || '??';

    return (
        <SplunkbaseCard>
            <CardImageContainer $indexName={assetValue.index_name}>
                <StatusIndicator $active={isActive} />
                <CardImageText>{initials}</CardImageText>
            </CardImageContainer>

            <CardContentWrapper>
                <CardTitle>
                    {assetValue.index_name}
                    <Menu style={{ marginLeft: 'auto' }}>
                        <Menu.Item
                            to={`${oneCMURL}=${assetValue.source_itam_bsa}`}
                            openInNewContext
                            icon={<External />}
                            disabled={!assetValue.source_itam_bsa}
                        >
                            ONECM
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item
                            to={`${engagementURL}=${assetValue.pow_number}`}
                            openInNewContext
                            icon={<External />}
                            disabled={!assetValue.pow_number}
                        >
                            POW
                        </Menu.Item>
                        <Menu.Item
                            to={`${splunkURL}=${assetValue.index_name}`}
                            openInNewContext
                            icon={<External />}
                            disabled={!assetValue.index_name}
                        >
                            Usage
                        </Menu.Item>
                        <Menu.Item
                            onClick={() => onDeleteClick(assetValue._key, assetValue.index_name)}
                            icon={<Remove />}
                            disabled={isDeleteDisabled}
                        >
                            Delete
                        </Menu.Item>
                        <Menu.Item
                            onClick={() => onHistoryClick(assetValue._key, assetValue.index_name)}
                            icon={<Activity />}
                        >
                            History
                        </Menu.Item>
                        <Menu.Item
                            onClick={() => onMetadataClick(assetValue._key, assetValue.index_name)}
                            icon={<DataSource />}
                        >
                            Index Metadata
                        </Menu.Item>
                    </Menu>
                </CardTitle>

                <CardSubtitle>
                    AGS: {assetValue.ags_entitlement_name || '—'}
                </CardSubtitle>

                <CardBadges>
                    <Badge $type={isActive ? 'active' : 'inactive'}>
                        {isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {assetValue.index_classification && (
                        <Badge $type="classification">{assetValue.index_classification}</Badge>
                    )}
                    {assetValue.index_type && (
                        <Badge>{assetValue.index_type}</Badge>
                    )}
                    <Badge>{assetValue.index_used ? 'Used' : 'Unused'}</Badge>
                </CardBadges>

                {assetValue.index_description && (
                    <CardDescription>
                        {assetValue.index_description}
                    </CardDescription>
                )}

                <CardMetadata>
                    <MetadataItem>
                        <MetadataLabel>Size</MetadataLabel>
                        <MetadataValue>{assetValue.index_size_mb ?? 0}MB</MetadataValue>
                    </MetadataItem>
                    <MetadataItem>
                        <MetadataLabel>Avg Usage</MetadataLabel>
                        <MetadataValue>{assetValue.avg_index_usage_mb ?? 0}MB</MetadataValue>
                    </MetadataItem>
                    <MetadataItem>
                        <MetadataLabel>Retention</MetadataLabel>
                        <MetadataValue>{assetValue.index_retention_period ?? 0}d</MetadataValue>
                    </MetadataItem>
                </CardMetadata>

                <CardFooter>
                    <FooterInfo>
                        {assetValue.pow_number ? `POW: ${assetValue.pow_number}` : 'No POW'}
                    </FooterInfo>
                    <CardActions>
                        <NavigationProvider onClick={handleClick}>
                            <Button
                                to={`manage-asset?key=${assetValue._key}`}
                                openInNewContext
                                aria-label={`View details for ${assetValue.index_name}`}
                                appearance="primary"
                                size="small"
                            >
                                View Details
                            </Button>
                        </NavigationProvider>
                    </CardActions>
                </CardFooter>
            </CardContentWrapper>
        </SplunkbaseCard>
    );
};

export default IndexCardSplunkbaseStyle;
