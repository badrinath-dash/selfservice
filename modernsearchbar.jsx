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

  const styles = {
    searchContainer: {
      display: 'flex',
      alignItems: 'center',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '12px',
      padding: '2px 8px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    selectWrapper: {
      borderRight: '1px solid rgba(255, 255, 255, 0.1)',
      marginRight: '8px',
      paddingRight: '4px',
    },
    inputOverride: {
      border: 'none',
      boxShadow: 'none',
      background: 'transparent',
    },
  };

  const startAdornment =
    options.length > 0 ? (
      <div style={styles.selectWrapper}>
        <Select
          value={filterKey}
          // onChange={(_, { value }) => onFilterKeyChange?.(value)}

          onChange={(_, { value }) => {
            console.log('Select changed to:', value);
            onFilterKeyChange?.(value);
          }}

          appearance="pill"
          inline
          aria-label="Search field selector"
          style={{
            minWidth: 140,
            border: 'none',
            background: 'transparent',
          }}
        >
          {options.map((o) => (
            <Select.Option
              key={o.value}
              label={o.label}
              value={o.value}
            />
          ))}
        </Select>
      </div>
    ) : null;

  const endAdornment = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      {value?.length > 0 && (
        <Button
          appearance="flat"
          icon={<Close />}
          aria-label="Clear search"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onChange('');
            inputRef.current?.focus();
          }}
        />
      )}

      <Button
        appearance="primary"
        icon={<SearchIcon />}
        aria-label="Submit search"
        disabled={!onSubmit}
        onMouseDown={(e) => e.preventDefault()}
        onClick={onSubmit}
        style={{ borderRadius: '8px' }}
      />
    </div>
  );

  return (
    <div style={styles.searchContainer}>
      <Text
        inputRef={inputRef}
        value={value}
        name="search_input"
        placeholder={placeholder}
        aria-label="Search"
        onChange={(e, data) => onFilterKeyChange?.(e, data)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onSubmit) onSubmit();
        }}
        startAdornment={startAdornment}
        endAdornment={endAdornment}
        inline
        style={styles.inputOverride}
      />
    </div>
  );
};

export default ModernSearchBar;
