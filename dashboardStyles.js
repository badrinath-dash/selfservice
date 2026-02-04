// HomeDashboardCardStyles.js
import styled from 'styled-components';
import { variables, mixins } from '@splunk/themes';
import Card from '@splunk/react-ui/Card';
import DL from '@splunk/react-ui/DefinitionList';

/** Card shell: rounded, subtle border, hover elevation, focus ring */
export const StyledCard = styled(Card)`
    ${mixins.reset()};
    border-radius: ${variables.borderRadius};
    border: 1px solid ${variables.colorNeutral200};
    background: ${variables.backgroundColorSection};
    box-shadow: ${variables.overlayShadow};
    transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;

    &:hover {
        transform: translateY(-1px);
        box-shadow: ${variables.overlayShadowHigh};
        border-color: ${variables.colorNeutral300};
    }

    &:focus-within {
        outline: 2px solid ${variables.focusColor};
        outline-offset: 2px;
    }
`;

/** Toolbar row for your DisplayIndex* icons */
export const IconRow = styled.div`
    ${mixins.reset('flex')};
    justify-content: flex-end;
    align-items: center;
    gap: ${variables.spacingSmall};
    padding: 0 ${variables.spacingMedium} ${variables.spacingXSmall} ${variables.spacingMedium};

    /* Make icon sizes consistent */
    & > svg {
        width: 18px;
        height: 18px;
    }
`;

/** KPI pills container */
export const KPIGrid = styled.div`
    ${mixins.reset('grid')};
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: ${variables.spacingSmall};
    padding: ${variables.spacingXSmall} ${variables.spacingMedium} ${variables.spacingMedium} ${variables.spacingMedium};
`;

/** Single KPI pill */
export const KPI = styled.div`
    ${mixins.reset()};
    background: ${variables.backgroundColorElevated};
    border: 1px solid ${variables.colorNeutral200};
    border-radius: ${variables.borderRadius};
    padding: ${variables.spacingSmall} ${variables.spacingMedium};

    .label {
        font-size: ${variables.fontSizeXSmall};
        color: ${variables.textColorMuted};
    }
    .value {
        margin-top: ${variables.spacingXSmall};
        font-size: ${variables.fontSizeMedium};
        font-weight: ${variables.fontWeightSemibold};
        color: ${variables.textColor};
    }
`;

/** 2-column definition list for secondary metrics */
export const DLGrid = styled(DL)`
    ${mixins.reset()};
    padding: ${variables.spacingXSmall} ${variables.spacingMedium} ${variables.spacingMedium} ${variables.spacingMedium};
    display: grid !important;
    grid-template-columns: 1fr auto;
    gap: ${variables.spacingXSmall} ${variables.spacingMedium};

    dt {
        color: ${variables.textColorMuted};
        font-size: ${variables.fontSizeSmall};
    }
    dd {
        margin: 0;
        text-align: right;
        color: ${variables.textColor};
        font-weight: ${variables.fontWeightMedium};
        font-size: ${variables.fontSizeSmall};
    }
`;

/** Footer bar that balances utility info and primary CTA */
export const CardFooterBar = styled.div`
    ${mixins.reset('flex')};
    justify-content: space-between;
    align-items: center;
    padding: ${variables.spacingMedium};
    border-top: 1px solid ${variables.colorNeutral200};
`;

/** Status dot to the left of the title */
export const StatusDot = styled.span`
    ${mixins.reset()};
    width: 8px;
    height: 8px;
    border-radius: 999px;
    margin-right: ${variables.spacingXSmall};
    display: inline-block;
    background: ${(p) => (p.$active ? variables.statusColorPositive : variables.colorNeutral400)};
    box-shadow: ${(p) =>
        p.$active
            ? `0 0 0 2px ${variables.statusColorPositiveTransparent}`
            : 'none'};
`;
