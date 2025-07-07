import React, { useEffect, useState,useCallback} from 'react';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Grid from '@mui/material/Grid';
import OutlinedInput from '@mui/material/OutlinedInput';
import { styled } from '@mui/material/styles';
import Button from '@splunk/react-ui/Button';
import Message from '@splunk/react-ui/Message';
import Text from '@splunk/react-ui/Text';
import RadioList from '@splunk/react-ui/RadioList';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import { variables, mixins } from '@splunk/themes';
import ColumnLayout from '@splunk/react-ui/ColumnLayout';
import TextArea from '@splunk/react-ui/TextArea';
import Select from '@splunk/react-ui/Select';
import Typography from '@splunk/react-ui/Typography';
import WaitSpinner from '@splunk/react-ui/WaitSpinner';
import { searchKVStore } from '../../common/ManageKVStore';
import useFetchOptions, { isMovieOption } from './ApplicationFetch';

const FormGrid = styled(Grid)(() => ({
  display: 'flex',
  flexDirection: 'column',
  color: 'white'
}));

export default function ApplicationDetailsForm() {



  const [options, setOptions] = useState([]);
  const [applicationLists, setApplicationLists] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [fullCount, setFullCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
    
  const [selectedValue, setSelectedValue] = useState('');
  const { fetch, getFullCount, getOption, stop } = useFetchOptions();

  // Replace with your real API
  const API_URL = 'https://jsonplaceholder.typicode.com/users';
  const handleFetch = useCallback(
        (keyword = '') => {
            setIsLoading(true);
            fetch(keyword)
                .then((newOptions) => {
                    setIsLoading(false);
                    setOptions(newOptions);
                    setFullCount(getFullCount());
                })
                .catch((error) => {
                    if (!error.isCanceled) {
                        throw error;
                    }
                });
        },
        [fetch, getFullCount]
    );

  function getApplicationDetails() {
    const defaultErrorMsg =
      'There is some error in data retrival from SPLUNK KVStore, please try again or refresh this page';
    searchKVStore('ability_app_details_collection', '', '', defaultErrorMsg)
      .then((response) => {
        if (response.ok) {
          response.json().then((data) => {
            //console.log(data); //Print the data from KVStore
            setApplicationLists(data);
          });
        } else {
          setApplicationLists('No Applications found')
        }
      })
      .catch((defaultErrorMsg) => {
        console.error('Error fetching data:', defaultErrorMsg);
      });
  }

  useEffect(() => {
    getApplicationDetails();
    handleFetch();
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

  const handleChange = useCallback((e, { value: newValue }) => {
        setSelectedValue(newValue);
    }, []);

    const handleFilterChange = useCallback(
        (e, { keyword }) => {
            handleFetch(keyword);
        },
        [handleFetch]
    );


  const createOption = (movie, isSelected = false) => (
        /**
         * Filtering is done server-side and the `matchRanges` prop would be either
         * be provided by the server, deduced based on the match algorithm, or omitted.
         * To simplify this example, the search value only matches the beginning of the title.
         */
        <Select.Option
            hidden={!!isSelected}
            key={isSelected ? `selected-${movie.id}` : movie.id}
            label={movie.title}
            matchRanges={isMovieOption(movie) ? movie.matchRanges : undefined}
            value={movie.id}
        />
  );

  const generateOptions = useCallback(() => {
        let selectedOption;
        if (selectedValue) {
            const selectedMovie = getOption(selectedValue);
            if (selectedMovie) {
                selectedOption = createOption(selectedMovie, true);
            }
        }

        if (isLoading) {
            // Only return the selected item
            return selectedOption;
        }

        const list = options.map((movie) => createOption(movie));
        if (selectedOption) {
            list.push(selectedOption);
        }
        return list;
    }, [selectedValue, isLoading, options, getOption]);

  
  const footerMessage = useCallback(() => {
        if (fullCount > options.length && !isLoading) {
            return _('%1 of %2 movies')
                .replace('%1', options.length.toString())
                .replace('%2', fullCount.toString());
        }
        return null;
    }, [fullCount, options.length, isLoading]);

  return (

    <Grid container spacing={3}>
      <div style={{ width: 400, padding: 20 }}>
        <Typography variant="label">Select an Application</Typography>

        {loading ? (
          <WaitSpinner size="medium" />
        ) : (
          <Select value={selected} onChange={handleChange} inline>
            {options.map((opt) => (
              <Select.Option key={opt.value} label={opt.label} value={opt.value} />
            ))}
          </Select>
        )}


      </div>
      <FormGrid size={{ xs: 6 }}>
        <ControlGroup
          label="Application Name"
          tooltip="Provide Application Name"
        >
          <Select 
          filter="controlled"
            placeholder={_('Select an Application...')}
            menuStyle={{ width: 300 }}
            onChange={handleChange}
            onFilterChange={handleFilterChange}
            isLoadingOptions={isLoading}
            footerMessage={footerMessage()}
            >
            {generateOptions()}
          </Select>
        </ControlGroup>
      </FormGrid>
      <FormGrid size={{ xs: 12 }}>

        <ControlGroup
          label="Email Address of Requestor"
          tooltip="Email Address"
        >
          <Text
            name="EmailAddress"

          />
        </ControlGroup>
      </FormGrid>


      <FormGrid size={{ xs: 12 }}>
        <ControlGroup
          label="Business Justification"
          tooltip="Provide a Brief Business Justification"
        >
          <TextArea
            name="BusinessJustification"

          />
        </ControlGroup>
      </FormGrid>

      <FormGrid size={{ xs: 6 }}>
        <ControlGroup
          label="Ability AppID"
          tooltip="Enter Ability AppID"
        >
          <Text
            name="AbilityAppID"

          />
        </ControlGroup>
      </FormGrid>
      <FormGrid size={{ xs: 6 }}>

        <ControlGroup
          label="Data Owner"
          tooltip="DataOwner"
        >
          <Text
            name="DataOwner"

          />
        </ControlGroup>

      </FormGrid>
      <FormGrid size={{ xs: 6 }}>
        <ControlGroup
          label="Technical Contact Email"
          tooltip="Technical Contact of your team"
        >
          <Text
            name="TechnicalContact"

          />
        </ControlGroup>
      </FormGrid>
      <FormGrid size={{ xs: 12 }}>
        <ControlGroup
          label="Support Contact Email"
          tooltip="Support Contact Details"
        >
          <Text
            name="SupportContactEmail"

          />
        </ControlGroup>
      </FormGrid>
    </Grid>
  );
}
