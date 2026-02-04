import React from 'react';
import styled from 'styled-components';
import Card from '@splunk/react-ui/Card';
import Button from '@splunk/react-ui/Button';
import Menu from '@splunk/react-ui/Menu';

/**
 * VARIANT 1: COMPACT CARD
 * For when you need to show more cards on screen
 */
export const CompactCard = styled(Card)`
    height: 100%;
    display: flex;
    flex-direction: column;
    border-radius: 6px;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    
    &:hover {
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12);
        transform: translateY(-1px);
    }
`;

export const CompactHeader = styled.div`
    padding: 12px 16px;
    border-bottom: 1px solid ${props => props.theme.colorScheme === 'dark' ? '#2a2a2a' : '#e0e0e0'};
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

export const CompactTitle = styled.h4`
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: ${props => props.theme.colorScheme === 'dark' ? '#ffffff' : '#1a1a1a'};
`;

export const CompactBody = styled.div`
    padding: 12px 16px;
    flex: 1;
    font-size: 13px;
`;

export const CompactMetrics = styled.div`
    display: flex;
    gap: 16px;
    margin-top: 8px;
`;

export const CompactMetric = styled.div`
    font-size: 11px;
    color: ${props => props.theme.colorScheme === 'dark' ? '#888' : '#666'};
    
    strong {
        display: block;
        font-size: 14px;
        color: ${props => props.theme.colorScheme === 'dark' ? '#fff' : '#000'};
        margin-top: 2px;
    }
`;

/**
 * VARIANT 2: LIST VIEW CARD
 * For when you want a table-like horizontal layout
 */
export const ListViewCard = styled(Card)`
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    gap: 16px;
    align-items: center;
    padding: 16px;
    border-radius: 4px;
    margin-bottom: 8px;
    transition: all 0.15s ease;
    
    &:hover {
        background: ${props => props.theme.colorScheme === 'dark' ? '#1f1f1f' : '#f5f5f5'};
    }
`;

export const ListViewIcon = styled.div`
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${props => props.$color || '#0877A6'};
    color: white;
    font-weight: 700;
    font-size: 18px;
`;

export const ListViewContent = styled.div`
    flex: 1;
    min-width: 0; // Enables text truncation
`;

export const ListViewTitle = styled.div`
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

export const ListViewMeta = styled.div`
    font-size: 12px;
    color: ${props => props.theme.colorScheme === 'dark' ? '#888' : '#666'};
    display: flex;
    gap: 12px;
    
    span {
        white-space: nowrap;
    }
`;

export const ListViewMetrics = styled.div`
    display: flex;
    gap: 24px;
    font-size: 12px;
`;

export const ListViewMetricItem = styled.div`
    text-align: center;
    
    .label {
        color: ${props => props.theme.colorScheme === 'dark' ? '#888' : '#666'};
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .value {
        font-weight: 600;
        font-size: 14px;
        margin-top: 2px;
    }
`;

export const ListViewActions = styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
`;

/**
 * VARIANT 3: DETAILED CARD
 * For when you want to show maximum information
 */
export const DetailedCard = styled(Card)`
    height: 100%;
    display: flex;
    flex-direction: column;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

export const DetailedHeader = styled.div`
    height: 120px;
    background: linear-gradient(135deg, ${props => props.$color1 || '#0877A6'} 0%, ${props => props.$color2 || '#065a87'} 100%);
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    color: white;
    position: relative;
`;

export const DetailedTitle = styled.h3`
    margin: 0;
    font-size: 20px;
    font-weight: 700;
`;

export const DetailedSubtitle = styled.div`
    font-size: 13px;
    opacity: 0.9;
`;

export const DetailedStats = styled.div`
    display: flex;
    gap: 16px;
    font-size: 12px;
    
    .stat {
        strong {
            display: block;
            font-size: 18px;
            font-weight: 700;
        }
    }
`;

export const DetailedBody = styled.div`
    padding: 20px;
    flex: 1;
    display: flex;
    flex-direction: column;
`;

export const DetailedDescription = styled.p`
    margin: 0 0 16px 0;
    font-size: 14px;
    line-height: 1.6;
    color: ${props => props.theme.colorScheme === 'dark' ? '#d0d0d0' : '#4a4a4a'};
    flex: 1;
`;

export const DetailedMetadataGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 16px 0;
    border-top: 1px solid ${props => props.theme.colorScheme === 'dark' ? '#2a2a2a' : '#e0e0e0'};
    border-bottom: 1px solid ${props => props.theme.colorScheme === 'dark' ? '#2a2a2a' : '#e0e0e0'};
`;

export const DetailedMetadataItem = styled.div`
    .label {
        font-size: 11px;
        color: ${props => props.theme.colorScheme === 'dark' ? '#888' : '#999'};
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
    }
    
    .value {
        font-size: 14px;
        font-weight: 600;
    }
`;

export const DetailedFooter = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
`;

export const DetailedBadges = styled.div`
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
`;

export const DetailedBadge = styled.span`
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    background: ${props => props.theme.colorScheme === 'dark' ? '#2a2a2a' : '#e0e0e0'};
    color: ${props => props.theme.colorScheme === 'dark' ? '#fff' : '#000'};
`;

/**
 * SHARED COMPONENTS
 */
export const StatusBadge = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    background: ${props => {
        if (props.$active) return props.theme.colorScheme === 'dark' ? '#1B5E20' : '#C8E6C9';
        return props.theme.colorScheme === 'dark' ? '#B71C1C' : '#FFCDD2';
    }};
    color: ${props => {
        if (props.$active) return props.theme.colorScheme === 'dark' ? '#A5D6A7' : '#2E7D32';
        return props.theme.colorScheme === 'dark' ? '#EF9A9A' : '#C62828';
    }};
    
    &::before {
        content: '';
        display: block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
    }
`;

export const ProgressBar = styled.div`
    width: 100%;
    height: 6px;
    background: ${props => props.theme.colorScheme === 'dark' ? '#2a2a2a' : '#e0e0e0'};
    border-radius: 3px;
    overflow: hidden;
    
    .fill {
        height: 100%;
        background: ${props => {
            const percentage = props.$percentage || 0;
            if (percentage > 80) return '#F44336'; // Red for high usage
            if (percentage > 60) return '#FF9800'; // Orange for medium-high
            if (percentage > 40) return '#FFC107'; // Yellow for medium
            return '#4CAF50'; // Green for low usage
        }};
        width: ${props => Math.min(100, props.$percentage || 0)}%;
        transition: width 0.3s ease;
    }
`;

export const TrendIndicator = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 600;
    color: ${props => props.$trend === 'up' ? '#F44336' : '#4CAF50'};
    
    &::before {
        content: '${props => props.$trend === 'up' ? '↑' : '↓'}';
        font-size: 16px;
    }
`;

/**
 * EXAMPLE USAGE OF COMPACT VARIANT
 */
export const CompactIndexCard = ({ assetValue, onMenuClick }) => {
    const initials = assetValue.index_name?.substring(0, 2) || '??';
    const isActive = String(assetValue.index_active).toLowerCase() === 'true' || assetValue.index_active === 1;
    
    return (
        <CompactCard>
            <CompactHeader>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <StatusBadge $active={isActive}>
                        {isActive ? 'Active' : 'Inactive'}
                    </StatusBadge>
                    <CompactTitle>{assetValue.index_name}</CompactTitle>
                </div>
                {/* Menu component */}
            </CompactHeader>
            <CompactBody>
                <div style={{ fontSize: 12, marginBottom: 8, opacity: 0.8 }}>
                    {assetValue.index_description?.substring(0, 80)}...
                </div>
                <CompactMetrics>
                    <CompactMetric>
                        Size
                        <strong>{assetValue.index_size_mb}MB</strong>
                    </CompactMetric>
                    <CompactMetric>
                        Usage
                        <strong>{assetValue.avg_index_usage_mb}MB</strong>
                    </CompactMetric>
                    <CompactMetric>
                        Retention
                        <strong>{assetValue.index_retention_period}d</strong>
                    </CompactMetric>
                </CompactMetrics>
            </CompactBody>
        </CompactCard>
    );
};

/**
 * EXAMPLE USAGE OF LIST VIEW VARIANT
 */
export const ListViewIndexCard = ({ assetValue, onMenuClick }) => {
    const colors = ['#0877A6', '#DC4E41', '#F1813F', '#84BD00', '#9C27B0', '#00897B'];
    const hash = assetValue.index_name?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    const color = colors[hash % colors.length];
    const initials = assetValue.index_name?.substring(0, 2) || '??';
    const isActive = String(assetValue.index_active).toLowerCase() === 'true' || assetValue.index_active === 1;
    
    return (
        <ListViewCard>
            <ListViewIcon $color={color}>{initials}</ListViewIcon>
            
            <ListViewContent>
                <ListViewTitle>{assetValue.index_name}</ListViewTitle>
                <ListViewMeta>
                    <span>AGS: {assetValue.ags_entitlement_name || '—'}</span>
                    <span>•</span>
                    <span>{assetValue.index_classification}</span>
                    <span>•</span>
                    <StatusBadge $active={isActive}>
                        {isActive ? 'Active' : 'Inactive'}
                    </StatusBadge>
                </ListViewMeta>
            </ListViewContent>
            
            <ListViewMetrics>
                <ListViewMetricItem>
                    <div className="label">Size</div>
                    <div className="value">{assetValue.index_size_mb}MB</div>
                </ListViewMetricItem>
                <ListViewMetricItem>
                    <div className="label">Avg Usage</div>
                    <div className="value">{assetValue.avg_index_usage_mb}MB</div>
                </ListViewMetricItem>
                <ListViewMetricItem>
                    <div className="label">Retention</div>
                    <div className="value">{assetValue.index_retention_period}d</div>
                </ListViewMetricItem>
            </ListViewMetrics>
            
            <ListViewActions>
                <Button size="small" appearance="primary">Details</Button>
                {/* Menu component */}
            </ListViewActions>
        </ListViewCard>
    );
};

export default {
    CompactIndexCard,
    ListViewIndexCard,
    StatusBadge,
    ProgressBar,
    TrendIndicator
};
