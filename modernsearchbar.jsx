import React, { useRef } from 'react';
import Text from '@splunk/react-ui/Text';
import Select from '@splunk/react-ui/Select';
import Button from '@splunk/react-ui/Button';
import SearchIcon from '@splunk/react-icons/enterprise/Search';
import Close from '@splunk/react-icons/enterprise/Close';

const ModernSearchBar = ({
  value,
  onChange,
  filterKey,
  onFilterKeyChange,
  options = [],
  onSubmit,
  placeholder = 'Search…',
}) => {
  const inputRef = useRef(null);

  // Modern styles for a "Seamless" look
  const styles = {
    searchContainer: {
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '2px 8px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'border-color 0.2s ease',
    },
    selectWrapper: {
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        marginRight: '8px',
        paddingRight: '4px',
    },
    // We remove the default Splunk Text borders via style overrides
    inputOverride: {
        border: 'none',
        boxShadow: 'none',
        background: 'transparent',
    }
  };

  const start = (
    <div style={styles.selectWrapper}>
        <Select
            value={filterKey}
            onChange={(_, { value }) => onFilterKeyChange(value)}
            appearance="pill" // Softer look
            inline
            style={{ 
                minWidth: 140, 
                border: 'none', // Remove the box around the dropdown
                background: 'transparent' 
            }}
        >
            {options.map((o) => (
                <Select.Option key={o.value} label={o.label} value={o.value} />
            ))}
        </Select>
    </div>
  );

  const end = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      {value?.length > 0 && (
        <Button
          appearance="flat" // Flat is more modern than pill for internal buttons
          icon={<Close />}
          onClick={() => {
            onChange('');
            inputRef.current?.focus();
          }}
        />
      )}
      <Button 
        appearance="primary" 
        icon={<SearchIcon />} 
        onClick={onSubmit}
        style={{ borderRadius: '8px' }} // Square-ish rounded is the 2026 trend
      />
    </div>
  );

  return (
    <div style={styles.searchContainer} className="modern-search-bar-focus-detect">
      <Text
        ref={inputRef}
        value={value}
        name="search_input"
        placeholder={placeholder}
        onChange={(_, { value }) => onChange(value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onSubmit) onSubmit();
        }}
        startAdornment={start}
        endAdornment={end}
        inline
        style={styles.inputOverride} // Removes the double-border look
      />
    </div>
  );
};

export default ModernSearchBar;
