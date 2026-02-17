// src/components/DataCatalogueHome/ModernSearchBar.jsx
import React, { useRef } from 'react';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import Text from '@splunk/react-ui/Text';
import Select from '@splunk/react-ui/Select';
import Button from '@splunk/react-ui/Button';
import SearchIcon from '@splunk/react-icons/enterprise/Search';
import Close from '@splunk/react-icons/enterprise/Close';

/**
 * ModernSearchBar
 *
 * Props:
 * - value: string                 // current search text
 * - onChange: (string) => void    // setSearchTerm
 * - filterKey: string             // current field key
 * - onFilterKeyChange: (string)   // setSearchFilterName
 * - options: Array<{label, value}>
 * - onSubmit?: () => void         // optional explicit submit
 * - placeholder?: string
 * - label?: string                // ControlGroup label (default: 'Search')
 * - help?: string                 // ControlGroup help text
 */
const ModernSearchBar = ({
  value,
  onChange,
  filterKey,
  onFilterKeyChange,
  options,
  onSubmit,
  placeholder = 'Search…',
  label = 'Search',
  help = 'Choose a field and type to filter results',
}) => {
  const inputRef = useRef(null);

  const start = (
    <Select
      value={filterKey}
      onChange={(_, { value }) => onFilterKeyChange(value)}
      inline
      size="small"
      style={{ minWidth: 160 }}   // enough room for labels
    >
      {options.map((o) => (
        <Select.Option key={o.value} label={o.label} value={o.value} />
      ))}
    </Select>
  );

  const end = (
    <>
      {value?.length > 0 && (
        <Button
          appearance="pill"
          icon={<Close screenReaderText="Clear search" />}
          onClick={() => {
            onChange('');
            // Keep focus in the field for quick re-entry
            inputRef.current?.focus();
          }}
        />
      )}
      <Button appearance="pill" icon={<SearchIcon />} onClick={onSubmit} />
    </>
  );

  return (
    <ControlGroup label={label} labelPosition="top" help={help}>
      <Text
        ref={inputRef}
        value={value}
        name="search_input"                 // keeps your "/" shortcut focusing this input
        placeholder={placeholder}
        onChange={(_, { value }) => onChange(value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onSubmit) onSubmit();
        }}
        startAdornment={start}
        endAdornment={end}
        inline
      />
    </ControlGroup>
  );
};

export default ModernSearchBar;
