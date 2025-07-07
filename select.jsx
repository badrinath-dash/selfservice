import React, { useEffect, useState } from 'react';
import Select from '@splunk/react-ui/Select';
import Spinner from '@splunk/react-ui/Spinner';
import Typography from '@splunk/react-ui/Typography';

export default function APIDrivenSelect() {
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);

  // Replace with your real API
  const API_URL = 'https://jsonplaceholder.typicode.com/users';

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await fetch(API_URL);
        const data = await res.json();
        const formatted = data.map((item) => ({
          label: item.name,
          value: item.id,
        }));
        setOptions(formatted);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  const handleChange = (e, { value }) => {
    setSelected(value);
  };

  return (
    <div style={{ width: 400, padding: 20 }}>
      <Typography variant="label">Select a User</Typography>

      {loading ? (
        <Spinner size="medium" />
      ) : (
        <Select value={selected} onChange={handleChange} inline>
          {options.map((opt) => (
            <Select.Option key={opt.value} label={opt.label} value={opt.value} />
          ))}
        </Select>
      )}

      {selected && (
        <div style={{ marginTop: 20 }}>
          <Typography variant="body">
            You selected:{" "}
            {options.find((opt) => opt.value === selected)?.label || 'Unknown'}
          </Typography>
        </div>
      )}
    </div>
  );
}
