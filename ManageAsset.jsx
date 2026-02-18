import React from 'react';
import { useState, useEffect } from 'react';
import Button from '@splunk/react-ui/Button';
import Message from '@splunk/react-ui/Message';
import Text from '@splunk/react-ui/Text';
import RadioList from '@splunk/react-ui/RadioList';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import Date from '@splunk/react-ui/Date';
import CollapsiblePanel from '@splunk/react-ui/CollapsiblePanel';
import { includes, without } from 'lodash';
import SplunkThemeProvider from '@splunk/themes/SplunkThemeProvider';
import queryString from 'query-string';
import Select from '@splunk/react-ui/Select';
import Multiselect from '@splunk/react-ui/Multiselect';
import Card from '@splunk/react-ui/Card';
import Heading from '@splunk/react-ui/Heading';
import Dropdown from '@splunk/react-ui/Dropdown';
import moment from 'moment';
// Related to Form Rows
import FormRows from '@splunk/react-ui/FormRows';
import WaitSpinner from '@splunk/react-ui/WaitSpinner';

// Custom Function imports
import { searchKVStore, updateKVStore } from './Common/ManageKVStore';
import {
    IndexClusterDropDownOptions,
    // ArchitectDropDownOptions,
    IndexTypeOptions,
    IndexClassificationOptions,
    IndexCustomerSegmentOptions,
    ContactTypeOptions,
    URLTypeOptions,
    IndexActiveOptions,
    IndexUsedOptions
} from './Common/DropDownData';
// import { validateAssetRegistryFormInput } from './FormValidate';
import { getUserRoleDetails } from './Common/GetUserDetails';

function ManageAssetRegistryReact() {
    // FormInput values

    const [FormInputvalues, setFormInputValues] = useState({
        asset_type: 'index',
        application_desc: '',
        index_name: '',
        index_description: '',
        index_type: 'event',
        index_created_date: '',
        ags_entitlement_name: '',
        ability_app_name: '',
        splunk_role_name: '',
        index_size_mb: '100',
        index_created_by: '',
        index_retention_period: '',
        // 19/07/2022 BD, Included in the Nested form
        // source_application_contact: '',
        // source_itam_bsa: '',
        // source_data_owner: '',
        pow_number: '',
        index_customer_segment: '',
        index_classification: '',
        index_cluster: [],
        addtn_documentation: [],
        addtn_contact: [{ contact_type: '2', contact_value: '' }],
        last_updated_date: '',
        last_updated_by: '',
        index_used:'Y',
        index_active:'Y',
        avg_index_usage_mb:'0',
        index_breach:"0",
        _key: '',
    });

    const [isLoading, setIsLoading] = useState(true);
    const [contactPanelLoading, setContactPanelLoading] = useState(false);
    const [infoMessage, setInfoMessage] = useState({ visible: false });
    const [open, setOpen] = useState([]);
    const [inputDisabled, setinputDisabled] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [editButtonDisabled, setEditButtongDisabled] = useState(false);
    const [checkButtonDisabled, setcheckButtonDisabled] = useState(true);
    const [InputValues, setInputValues] = useState(['1', '2']);
    const [activePanelId, setActivePanelId] = useState('one');
    const [density, setDensity] = useState('compact');
    const [indexNameDisabled, setIndexNameDisabled] = useState(false);

    // User Related Variables
    const [currentUser, setCurrentUser] = useState();
    const [currentEmail, setCurrentEmail] = useState();
    const [isSplunkAdmin, setIsSplunkAdmin] = useState(false);
    const [saveButtonDisabled, setSaveButtonDisabled] = useState(true);

    // const childStateRef = useRef();
    const closeReasons = without(Dropdown.possibleCloseReasons, 'contentClick');
    const toggle = <Button appearance="toggle" label="Customized Options" isMenu />;
    const [colorScheme, setColorScheme] = useState('dark');
    const [colorFamily, setColorFamily] = useState('prisma');
    const [ArchitectDropDownOptions,setArchitectDropDownOptions] = useState([])



    const handleMessageRemove = () => {
        setInfoMessage({ visible: false });
    };


 // 23-Mar-2022 Functions related to Documentation Form which stores into an array
    const URLFormheader = (
        <div>
            <span
                style={{
                    display: 'inline-block',
                    width: 160,
                    marginLeft: 140,
                }}
                id="header-key"
            >
                URL Type
            </span>
            <span style={{ display: 'inline-block', width: 160 }} id="header-value">
                URL Value
            </span>
            <span style={{ display: 'inline-block', width: 160 }} id="header-value">
                URL Comment
            </span>
        </div>
    );

    const handleDocumentFormRowChange = (i, e, data) => {
        const {name, value } = data;
        const newFormValues = [...FormInputvalues.addtn_documentation];
        newFormValues[i][name] = value;
        setFormInputValues({ ...FormInputvalues, addtn_documentation: newFormValues });
    };



    const addDocumentFormFields = () => {
        const newFormValues = [
            ...FormInputvalues.addtn_documentation,
            { url_type: '', url_value: '', url_comment: '' },
        ];

        setFormInputValues({ ...FormInputvalues, addtn_documentation: newFormValues });
    };



    const removeDocumentFormFields = (i) => {
        const newFormValues = [...FormInputvalues.addtn_documentation];
        newFormValues.splice(i, 1);
        setFormInputValues({ ...FormInputvalues, addtn_documentation: newFormValues });
    };


    // 23-Mar-2022 Functions related to Documentation Form which stores into an array
    // Contact Form Changes, Look at later on combining both Conact and URL form later

    const ContactFormHeader = (
        <div>
            <span
                style={{
                    display: 'inline-block',
                    width: 230,
                    marginLeft: 140,
                }}
                id="header-key"
            >
                Contact Type
            </span>
            <span style={{ display: 'inline-block', width: 160 }} id="header-value">
                Contact Value
            </span>
        </div>
    );

    const handleContactFormRowChange = (i, e, data) => {
        const {name, value } = data;
        const newFormValues = [...FormInputvalues.addtn_contact];
        newFormValues[i][name] = value;
               // eslint-disable-next-line no-undef
        setFormInputValues({ ...FormInputvalues, addtn_contact: newFormValues });
    };

    const addContactFormFields = () => {
        const newFormValues = [
            ...FormInputvalues.addtn_contact,
            { contact_type: '', contact_value: '' },
        ];
        setFormInputValues({ ...FormInputvalues, addtn_contact: newFormValues });
    };

    const removeContactFormFields = (i) => {
        const newFormValues = [...FormInputvalues.addtn_contact];
        newFormValues.splice(i, 1);
        setFormInputValues({ ...FormInputvalues, addtn_contact: newFormValues });
    };

    // Custom Code ends here //
     // 23-Mar-2022, Badri, Not Needed any more as generic function works with additional parameter
    // const handleDateChange = (event, { value }) => {
    //     setFormInputValues({ ...FormInputvalues, index_created_date: value });
    // };

    const handleRequestClose = ({ panelId }) => {
        setOpen(without(open, panelId));
    };

    const handleRequestOpen = ({ panelId }) => {
        setOpen(open.concat(panelId));
    };

    const handleInputChange = (event,data) => {
        const { name, value } = data;
        // const { name, value } = event.target;
        setFormInputValues({ ...FormInputvalues, [name]: value });
    };

    const handleEdit = (event) => {
        setinputDisabled(false);
        setEditButtongDisabled(true);
        setFormInputValues({
            ...FormInputvalues,
            last_updated_by: currentUser,
            last_updated_date: moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
        });
    };

    // This function need consultation as does not work when needs to be changed

    // const handleNewAssetRedirect = (key) => {
    //      // Browser Reload
    //      const history = useHistory()
    //     // history('/manage-asset?key=${key}');
    //     //history.go(0)
    //     history.push("/manage-asset?key=${key}");
    //     // Redirect to={`manage-asset?key=${key}`}

    // }

    // const handleNewAssetRedirect = (key)=>{
    //     const history = useHistory();
    //     const location = useLocation();

    //     const {name, value} = event?.target;
    //     const params = new URLSearchParams({[key]: key });
    //     history.replace({ pathname: location.pathname, search: params.toString() });

    //  }

    function refreshPage(key) {
        // window.location.reload+= '&key={key}';
        window.location.href = window.location.href + key;
    }

    // 23-Mar-2022, Badri, Not Needed any more as generic function works with additional parameter
    // function handleDropDownChange(e, { value }) {
    //     setFormInputValues({ ...FormInputvalues, index_created_by: value });
    //     // console.log(FormInputvalues);
    // }

    const handleDropDownIndexClusterChange = (e, { values }) => {
        setFormInputValues({ ...FormInputvalues, index_cluster: values });
    };


// 23-Mar-2022 , Toast Notification still does not work because of version compatible
    // const [toast, setToast]= useState({type: TOAST_TYPES.INFO,
    //     message: 'This is a toast message',
    //     autoDismiss: true,
    //     dismissOnActionClick: true,
    //     showAction: false});

    // handleToast = () => {
    //     createToast({
    //         ...toast,
    //         action: toast.showAction
    //             ? {
    //                   label: 'Close on click',
    //                   callback: () => {},
    //               }
    //             : undefined,
    //     });
    // };

    // Function to validate data inputs and Set Error Message Accodirngly

    function validateAssetRegistryFormInput(values) {
        const errors = [];

        if (!values.index_name) {
            errors.index_name_error = "Index Name is required";
            errors.index_name_Invalid = true;
            setInfoMessage({
                visible: true,
                type: 'error',
                message: "Index Name is required"

            });

        }
        else if (!values.index_description) {
            errors.index_description_error = "Index Description is required"
            errors.index_description_Invalid = true;
            setInfoMessage({
                visible: true,
                type: 'error',
                message: "Index Description is required"

            });
        }
        else if (!values.index_type) {
            errors.index_type_error = "Index Type is required"
            errors.index_type_Invalid = true;
            setInfoMessage({
                visible: true,
                type: 'error',
                message: "Index Type is required"

            });
        }
        else if (!values.index_created_date) {
            errors.index_created_date_error = "Index Created Date is required"
            errors.index_created_date_Invalid = true;
            setInfoMessage({
                visible: true,
                type: 'error',
                message: "Index Created Date is required"

            });
        }
        else if (!values.ags_entitlement_name) {
            errors.ags_entitlement_name_error = "AGS Entitlement Name is required"
            errors.ags_entitlement_name_Invalid = true;
            setInfoMessage({
                visible: true,
                type: 'error',
                message: "AGS Entitlement Name is required"

            });
        }
        else if (!values.splunk_role_name) {
            errors.splunk_role_name_error = "Splunk Role Name is required"
            errors.splunk_role_name_Invalid = true;
            setInfoMessage({
                visible: true,
                type: 'error',
                message: "Splunk Role Name is required"

            });
        }
        else if (!values.index_size_mb) {
            errors.index_size_mb_error = "Index Size is required"
            errors.index_size_mb_Invalid = true;
            setInfoMessage({
                visible: true,
                type: 'error',
                message: "Index Size is required"

            });
        }
        else if (!values.index_created_by) {
            errors.index_created_by_error = "Index Created by is required";
            errors.index_created_by_Invalid = true;
            setInfoMessage({
                visible: true,
                type: 'error',
                message: "Index Created by is required"

            });
        }
        else if (!values.index_retention_period) {
            errors.index_retention_period_error = "Index Retention Period is required"
            errors.index_retention_period_Invalid = true;
            setInfoMessage({
                visible: true,
                type: 'error',
                message: "Index Retention Period is required"

            });
        }
        // eslint-disable-next-line no-restricted-globals
        else if (values.index_retention_period && isNaN(Number(values.index_retention_period)) ) {
            errors.index_retention_period_error = "Index Retention Period Should be a Number"
            errors.index_retention_period_Invalid = true;
            setInfoMessage({
                visible: true,
                type: 'error',
                message: "Index Retention Period Should be a valid Number, don't add additional suffix"

            });
        }
        else if (values.pow_number && isNaN(Number(values.pow_number))) {
            errors.pow_number_error = "POW Number should be a valid Number"
            errors.pow_number_Invalid = true;
            setInfoMessage({
                visible: true,
                type: 'error',
                message: "POW Number should be a number and not string"

            });

    }

        else if (values.addtn_contact) {
            for (let i = 0; i < values.addtn_contact.length; i++) {
                const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                const ContactType = values.addtn_contact[i].contact_type

                if (ContactType === "application-contact" &&  !re.test(values.addtn_contact[i].contact_value) ) {
                    errors.addtn_contact_owner_error = "Application Contact selected is not a valid Email address"
                    setInfoMessage({
                        visible: true,
                        type: 'error',
                        message: "Application Contact Details, Application Contact selected is not a valid Email address, please enter a valid email address"

                    });
                }
                if (ContactType === "data-owner" &&  !re.test(values.addtn_contact[i].contact_value) ) {
                    errors.addtn_contact_owner_error = "Data Owner selected is not a valid Email address"
                    setInfoMessage({
                        visible: true,
                        type: 'error',
                        message: "Application Contact Details, Data Owner selected is not a valid Email address, please enter a valid email address"

                    });
                }
                if (ContactType === "business-analyst" &&  !re.test(values.addtn_contact[i].contact_value) ) {
                    errors.addtn_contact_owner_error = "Application Contact selected is not a valid Email address"
                    setInfoMessage({
                        visible: true,
                        type: 'error',
                        message: "Application Contact Details, Business Analyst  selected is not a valid Email address"

                    });
                }
                if (ContactType === "source-escalation-contact" &&  !re.test(values.addtn_contact[i].contact_value) ) {
                    errors.addtn_contact_owner_error = "Application Contact selected is not a valid Email address"
                    setInfoMessage({
                        visible: true,
                        type: 'error',
                        message: "Application Contact Details, Source System Escalation Contact selected is not a valid Email address"

                    });
                }

            }
        }
        if (values.addtn_documentation) {
            for (let i = 0; i < values.addtn_documentation.length; i++) {
                const re = /(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
                const URLType = values.addtn_documentation[i].url_type

                if (!re.test(values.addtn_documentation[i].url_value) ) {
                    errors.addtn_documentation_error = "Additional Documentation, Should be a valid URL"
                    setInfoMessage({
                        visible: true,
                        type: 'error',
                        message: "Additional Documentation, Should be a valid URL"

                    });
                }


            }
        }

        return errors
    }


    function getUserContext() {
        const defaultErrorMsg =
            'There is some error in data retrival from SPLUNK KVStore, please try again or refresh this page';
        getUserRoleDetails(defaultErrorMsg).then((response) => {
            if (response.ok) {
                response.json().then((data) => {
                    setCurrentUser(data.entry[0].content.realname);

                    setCurrentEmail(data.entry[0].content.email);
                    // setRoleArray(data.entry[0].content.roles);
                    if (data.entry[0].content.roles.includes('admin')) {
                        // setIsSplunkAdmin("admin");
                        setIsSplunkAdmin(true);
                        setSaveButtonDisabled(false);
                    } else {
                        setEditButtongDisabled(true);
                        setIsSplunkAdmin(false);
                        setSaveButtonDisabled(true);
                    }
                });
            }
        });
    }

    function getAssetRegistryData(event) {
        let queries = queryString.parse(location.search);
        const defaultErrorMsg =
            'There is some error in data retrival, please try again or refresh this page';
        searchKVStore('splunk_data_catalog_collection', queries.key, '', defaultErrorMsg)
            .then((response) => {
                if (response.ok) {
                    response.json().then((data) => {
                        console.log(data); // Enable during debug to display the data returned from SPLUNK KVStore
                        setFormInputValues(data);
                        // setContactPanelLoading(true);
                        setinputDisabled(true);
                        setIsLoading(false);
                    });
                    // 02/03/2021 Badri  In Future Replace with a Spinner
                    // setInfoMessage({
                    //     visible: true,
                    //     type: 'success',
                    //     message: 'Successfully retrieved the data from SPLUNK KVStore',
                    // });
                    // setTimeout(() => {
                    //     setInfoMessage({
                    //         visible: false,
                    //     });
                    // }, 1000);
                } else {
                    setInfoMessage({
                        visible: true,
                        type: 'error',
                        message:
                            'Error in data Retrival from SPLUNK KVStore, please refresh the page',
                    });
                    setTimeout(() => {
                        setInfoMessage({
                            visible: false,
                        });
                    }, 1000);
                }
            })
            .catch((defaultErrorMsg) => {
                setInfoMessage({
                    visible: true,
                    type: 'error',
                    message: defaultErrorMsg,
                });
            });
    }


    function getArchictDropDownData(event) {
        
        const defaultErrorMsg =
            'There is some error in data retrival, please try again or refresh this page';
        searchKVStore('splunk_data_catalog_meta_index_created_by_collection', '', '', defaultErrorMsg)
            .then((response) => {
                if (response.ok) {
                    response.json().then((data) => {
                        console.log(data); // Enable during debug to display the data returned from SPLUNK KVStore
                        setArchitectDropDownOptions(data);
                        // setContactPanelLoading(true);

                    });

                } else {
                    setInfoMessage({
                        visible: true,
                        type: 'error',
                        message:
                            'Error in data Retrival from SPLUNK KVStore for Architect Data, please refresh the page',
                    });
                    setTimeout(() => {
                        setInfoMessage({
                            visible: false,
                        });
                    }, 1000);
                }
            })
            .catch((defaultErrorMsg) => {
                setInfoMessage({
                    visible: true,
                    type: 'error',
                    message: defaultErrorMsg,
                });
            });
    }

    useEffect(() => {
        let queries = queryString.parse(location.search);
        var openPanel = [1, 2, 3, 4, 5];

        if (queries.key.length === 0) {
            const today = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ');
            setOpen(open.concat(openPanel));
            setcheckButtonDisabled(false);
            setEditButtongDisabled(true);
            setFormInputValues({ ...FormInputvalues, index_created_date: today });
            setIsLoading(false);
            setSaveButtonDisabled(true);
            getArchictDropDownData();
            // setContactPanelLoading(true);
        } else {
            getUserContext();
            setIndexNameDisabled(true);
            console.log(queries.key.length);
            getAssetRegistryData();
            setOpen(open.concat(openPanel));
            getArchictDropDownData();

        }


    }, []);

    useEffect(() => {
        if (isLoading === false) {
            if (FormInputvalues.asset_type === undefined) {
                setFormInputValues({ ...FormInputvalues, asset_type: 'index' });
            }
            if (FormInputvalues.index_description === undefined) {
                setFormInputValues({ ...FormInputvalues, index_description: '' });
            }
            if (FormInputvalues.application_desc === undefined) {
                setFormInputValues({ ...FormInputvalues, application_desc: '' });
            }
            if (FormInputvalues.index_type === undefined) {
                setFormInputValues({ ...FormInputvalues, index_type: 'event' });
            }
            if (FormInputvalues.ags_entitlement_name === undefined) {
                setFormInputValues({ ...FormInputvalues, ags_entitlement_name: '' });
            }
            if (FormInputvalues.ability_app_name === undefined) {
                setFormInputValues({ ...FormInputvalues, ability_app_name: '' });
            }
            if (FormInputvalues.splunk_role_name === undefined) {
                setFormInputValues({ ...FormInputvalues, splunk_role_name: '' });
            }
            if (FormInputvalues.index_created_by === undefined) {
                setFormInputValues({ ...FormInputvalues, index_created_by: 'NA' });
            }
            if (FormInputvalues.index_retention_period === undefined) {
                setFormInputValues({ ...FormInputvalues, index_retention_period: '' });
            }
            if (FormInputvalues.source_application_contact === undefined) {
                setFormInputValues({
                    ...FormInputvalues,
                    source_application_contact: '',
                });
            }
            // if (FormInputvalues.source_itam_bsa === undefined) {
            //     setFormInputValues({ ...FormInputvalues, source_itam_bsa: '' });
            // }
            // if (FormInputvalues.source_data_owner === undefined) {
            //     setFormInputValues({ ...FormInputvalues, source_data_owner: '' });
            // }
            if (FormInputvalues.pow_number === undefined) {
                setFormInputValues({ ...FormInputvalues, pow_number: '' });
            }
            if (FormInputvalues.index_customer_segment === undefined) {
                setFormInputValues({ ...FormInputvalues, index_customer_segment: '' });
            }
            if (FormInputvalues.index_classification === undefined) {
                setFormInputValues({ ...FormInputvalues, index_classification: '' });
            }
            if (FormInputvalues.index_cluster === undefined) {
                setFormInputValues({ ...FormInputvalues, index_cluster: [] });
            }
            if (
                FormInputvalues.addtn_documentation === undefined ||
                FormInputvalues.addtn_documentation === null
            ) {
                setFormInputValues({ ...FormInputvalues, addtn_documentation: [] });
            }
            if (FormInputvalues.addtn_contact === undefined) {
                setFormInputValues({ ...FormInputvalues, addtn_contact: [] });
            }
            if (FormInputvalues.last_updated_date === undefined) {
                setFormInputValues({ ...FormInputvalues, last_updated_date: '' });
            }
            if (FormInputvalues.avg_index_usage_mb === undefined) {
                setFormInputValues({ ...FormInputvalues, avg_index_usage_mb: '' });
            }
            if (FormInputvalues.index_used === undefined) {
                setFormInputValues({ ...FormInputvalues, index_used: '' });
            }
            if (FormInputvalues.index_breach === undefined) {
                setFormInputValues({ ...FormInputvalues, index_breach: '' });
            }
            if (FormInputvalues.index_active === undefined) {
                setFormInputValues({ ...FormInputvalues, index_active: '' });
            }

        }
    }, [FormInputvalues,isLoading]);

    function handleSubmit(event) {
        const queries = queryString.parse(location.search);
        const defaultErrorMsg = 'Error updating row. Please try again.';
        const InputformErrors = validateAssetRegistryFormInput(FormInputvalues,()=>setInfoMessage);
        setFormErrors(InputformErrors);

        if (Object.keys(InputformErrors).length !== 0) {
        //    setInfoMessage({
        //     visible: true,
        //     type: 'error',
        //     message: "There are some errors in the form, please check and fix it"

        // });
        }
        else if (Object.keys(InputformErrors).length === 0) {
            if (queries.key.length === 0) {
                updateKVStore(
                    'splunk_data_catalog_collection',
                    queries.key,
                    FormInputvalues,
                    defaultErrorMsg
                )
                    .then((response) => {
                        console.log(response);
                        if (response.ok) {
                            response.json().then((data) => {
                                setInfoMessage({
                                    visible: true,
                                    type: 'success',
                                    message: 'New Asset Created Successfully',
                                });
                                setTimeout(() => {
                                    setInfoMessage({
                                        visible: false,
                                    });
                                }, 1000);

                                refreshPage(data._key);
                            });
                        } else {
                            setInfoMessage({
                                visible: true,
                                type: 'error',
                                message:
                                    'There are some error from the Backend Splunk KVStore, Please try again',
                            });
                        }
                    })
                    .catch((err) => {
                        setInfoMessage({
                            visible: true,
                            type: 'error',
                            message: err,
                        });
                    });
            } else {
                updateKVStore(
                    'splunk_data_catalog_collection',
                    queries.key,
                    FormInputvalues,
                    defaultErrorMsg
                )
                    .then((response) => {
                        console.log(response);
                        if (response.ok) {
                            setInfoMessage({
                                visible: true,
                                type: 'success',
                                message: 'Asset has been updated successfully',
                            });
                            setTimeout(() => {
                                setInfoMessage({
                                    visible: false,
                                });
                            }, 1000);
                            //refreshPage();
                            getAssetRegistryData();
                            setinputDisabled(true);
                            setEditButtongDisabled(false);
                        } else {
                            setInfoMessage({
                                visible: true,
                                type: 'error',
                                message:
                                    'There are some error from the Backend Splunk KVStore, Please try again',
                            });
                            setTimeout(() => {
                                setInfoMessage({
                                    visible: false,
                                });
                            }, 1000);
                        }
                    })
                    .catch((err) => {
                        setInfoMessage({
                            visible: true,
                            type: 'error',
                            message: err,
                        });
                    });
            }
        }
    }

    /* This function is to validate if an Index exist  */
    function handleIndexValidate(event) {
        const defaultErrorMsg = 'There are some errors from the SPLUNK KVStore';
        if (Object.keys(FormInputvalues.index_name).length !== 0) {
            searchKVStore(
                'splunk_data_catalog_collection',
                '',
                `{"index_name":"${FormInputvalues.index_name}"}`,
                defaultErrorMsg
            )
                .then((response) => {
                    if (response.ok) {
                        response.json().then((data) => {
                            console.log(response.json());
                            if (data.length !== 0) {
                                setInfoMessage({
                                    visible: true,
                                    type: 'error',
                                    message:
                                        'There is alredy an entry exist for this name, please select a new name',
                                });
                            } else {
                                setInfoMessage({
                                    visible: true,
                                    type: 'success',
                                    message: 'No entry exist for this index',
                                });
                                setSaveButtonDisabled(false);
                                setTimeout(() => {
                                    setInfoMessage({
                                        visible: false,
                                    });
                                }, 1000);
                            }
                        });
                    }
                })
                .catch((defaultErrorMsg) => {
                    setInfoMessage({
                        visible: true,
                        type: 'error',
                        message: defaultErrorMsg,
                    });
                });
        } else {
            setInfoMessage({
                visible: true,
                type: 'error',
                message: 'Please enter a value in index name field before clicking check button',
            });
        }
    }

    if (isLoading === true) {
        return (
            <SplunkThemeProvider family={colorFamily} colorScheme={colorScheme} density={density}>
                <Card style={{ minWidth: '100%' }}>
                    <Card.Body>
                        <WaitSpinner size="large" />
                    </Card.Body>
                </Card>
            </SplunkThemeProvider>
        );
    }
    return (
        <SplunkThemeProvider family={colorFamily} colorScheme={colorScheme} density={density}>
            <Card style={{ minWidth: '100%' }}>
                <Heading>Splunk Data Catalog Manage Asset</Heading>
                <Card.Body>
                    {infoMessage.visible && (
                        <Message
                            appearance="fill"
                            type={infoMessage.type || 'info'}
                            onRequestRemove={handleMessageRemove}
                        >
                            {infoMessage.message}
                        </Message>
                    )}

                    <ControlGroup label="" style={{ float: 'right' }}>
                        <Dropdown toggle={toggle} retainFocus closeReasons={closeReasons}>
                            <div style={{ padding: 20, width: 300 }}>
                                <ControlGroup label="Color" labelPosition="top">
                                    <RadioList
                                        name="color_scheme"
                                        value={colorScheme}
                                        onChange={(event, { value }) => {
                                            setColorScheme(value);
                                        }}
                                    >
                                        <RadioList.Option value="light">Light</RadioList.Option>
                                        <RadioList.Option value="dark">Dark</RadioList.Option>
                                    </RadioList>
                                </ControlGroup>
                                <ControlGroup ControlGroup label="Family" labelPosition="top">
                                    <RadioList
                                        name="color_family"
                                        value={colorFamily}
                                        onChange={(event, { value }) => {
                                            setColorFamily(value);
                                        }}
                                    >
                                        <RadioList.Option value="prisma">Prisma</RadioList.Option>
                                        <RadioList.Option value="enterprise">
                                            EnterPrise
                                        </RadioList.Option>
                                    </RadioList>
                                </ControlGroup>
                                <ControlGroup ControlGroup label="Density" labelPosition="top">
                                    <RadioList
                                        name="density"
                                        value={density}
                                        onChange={(event, { value }) => {
                                            setDensity(value);
                                        }}
                                    >
                                        <RadioList.Option value="compact">Compact</RadioList.Option>
                                        <RadioList.Option value="comfortable">
                                            Comfortable
                                        </RadioList.Option>
                                    </RadioList>
                                </ControlGroup>
                            </div>
                        </Dropdown>
                    </ControlGroup>

                    <ControlGroup label="" style={{ float: 'right' }}>
                        <Button
                            label="Save"
                            appearance="primary"
                            type="submit"
                            value="Submit"
                            // eslint-disable-next-line react/jsx-no-bind
                            onClick={handleSubmit}
                            disabled={saveButtonDisabled}
                        />
                        <Button
                            label="Edit"
                            appearance="primary"
                            type="edit"
                            value="Edit"
                            onClick={handleEdit}
                            disabled={editButtonDisabled}
                        >
                            {' '}
                        </Button>
                    </ControlGroup>
                    <CollapsiblePanel
                        title="Index Overview"
                        onRequestClose={handleRequestClose}
                        onRequestOpen={handleRequestOpen}
                        open={includes(open, 1)}
                        description="Basic details of the index"
                        panelId={1}
                    >
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
                                // eslint-disable-next-line react/jsx-no-bind
                                onClick={handleIndexValidate}
                            />
                        </ControlGroup>
                        <ControlGroup
                            label="Index Description (*)"
                            tooltip="Provide a brief description of the index and keep it short"

                        >
                            <Text
                                multiline
                                name="index_description"
                                inline
                                rowsMax={3}
                                onChange={(e,data)=> handleInputChange(e,data)}
                                value={FormInputvalues.index_description}
                                placeholder="e.g. This index contains << application | Security | Privacy | Sensitive >> data for OneSplunk Application"
                                error={formErrors.index_description_Invalid}
                                disabled={inputDisabled}
                            />
                        </ControlGroup>
                        <ControlGroup
                            label="Role Name (*)"
                            tooltip="Splunk Role Name that provides access to the data, if not created enter TBC"

                        >
                            <Text
                                name="splunk_role_name"
                                placeholder="splunk role name"
                                value={FormInputvalues.splunk_role_name}
                                onChange={(e,data)=> handleInputChange(e,data)}
                                error={formErrors.splunk_role_name_Invalid}
                                disabled={inputDisabled}
                            />
                        </ControlGroup>
                        <ControlGroup
                            label="Ability App Name"
                            tooltip="Ability App Name for the application (e.g. ONESPLUNK)"
                        >
                            <Text
                                name="ability_app_name"
                                placeholder="Ability App name"
                                value={FormInputvalues.ability_app_name}
                                onChange={(e,data)=> handleInputChange(e,data)}
                                disabled={inputDisabled}
                            />
                        </ControlGroup>
                        <ControlGroup
                            label="Application Description"
                            tooltip="Provide a brief description of the Application, keep it short"
                            // help={formErrors.application_desc_error}
                        >
                            <Text
                                multiline
                                name="application_desc"
                                inline
                                rowsMax={5}
                                onChange={(e,data)=> handleInputChange(e,data)}
                                value={FormInputvalues.application_desc}
                                placeholder="e.g. PCI compliant AMP environment to host an automated IVR to process credit card payments"
                                // error={formErrors.application_desc_Invalid}
                                disabled={inputDisabled}
                            />
                        </ControlGroup>
                        <ControlGroup
                            label="AGS Entitlement Name (*)"
                            tooltip="AGS Entitlement Name for Accessing this index as defined in AGS, if not enter NA"
                        >
                            <Text
                                name="ags_entitlement_name"
                                placeholder="AGS Entitlement Name"
                                value={FormInputvalues.ags_entitlement_name}
                                onChange={(e,data)=> handleInputChange(e,data)}
                                disabled={inputDisabled}
                            />
                        </ControlGroup>
                    </CollapsiblePanel>
                    <CollapsiblePanel
                        title="Index Size &amp; Retentention Overview"
                        onRequestClose={handleRequestClose}
                        onRequestOpen={handleRequestOpen}
                        open={includes(open, 2)}
                        description="Index sizing details"
                        panelId={2}
                    >
                        <ControlGroup
                            label="Index Size Per day in MB (*)"
                            tooltip="Index Size in MB Per day"

                        >
                            <Text
                                name="index_size_mb"
                                placeholder="Index Size in MB"
                                endAdornment={<div style={{ padding: '0 8px' }}>MB</div>}
                                value={FormInputvalues.index_size_mb.toString()}
                                onChange={(e,data)=> handleInputChange(e,data)}
                                error={formErrors.index_size_mb_Invalid}
                                disabled={inputDisabled}
                            />
                        </ControlGroup>
                        <ControlGroup
                            label="Index Created By (*)"
                            help={formErrors.index_created_by_error}
                        >
                            <Select
                                name="index_created_by"
                                value={FormInputvalues.index_created_by}
                                onChange={(e,data)=> handleInputChange(e,data)}
                                error={formErrors.index_created_by_Invalid}
                                disabled={inputDisabled}
                            >
                                {ArchitectDropDownOptions.map((ArchitectDropDownOption) => (
                                    <Select.Option
                                        key={ArchitectDropDownOption._key}
                                        label={ArchitectDropDownOption.index_created_by_label}
                                        value={ArchitectDropDownOption.index_created_by_value}
                                    />
                                ))}
                            </Select>
                        </ControlGroup>
                        <ControlGroup label="Index Type (*)" >
                            <RadioList
                                name="index_type"
                                value={FormInputvalues.index_type}
                                onChange={(e,data)=> handleInputChange(e,data)}
                                error={formErrors.index_type_Invalid}
                                disabled={inputDisabled}
                            >
                                {IndexTypeOptions.map((IndexTypeOption) => (
                                    <RadioList.Option
                                        key={IndexTypeOption.label}
                                        value={IndexTypeOption.value}
                                    >
                                        {IndexTypeOption.label}
                                    </RadioList.Option>
                                ))}
                            </RadioList>
                        </ControlGroup>
                        <ControlGroup
                            label="Index Created Date (*)"
                            tooltip="Index Creation Date"

                        >
                            <Date
                                name="index_created_date"
                                value={FormInputvalues.index_created_date}
                                onChange={(e,data)=> handleInputChange(e,data)}
                                error={formErrors.index_created_date_Invalid}
                                disabled={inputDisabled}
                            />
                        </ControlGroup>
                        <ControlGroup
                            label="Index Retention Period (*)"
                            tooltip="Index Retention in days"

                        >
                            <Text
                                name="index_retention_period"
                                placeholder="Index Retention Period"
                                endAdornment={<div style={{ padding: '0 8px' }}>Days</div>}
                                value={FormInputvalues.index_retention_period}
                                onChange={(e,data)=> handleInputChange(e,data)}
                                error={formErrors.index_retention_period_Invalid}
                                disabled={inputDisabled}
                            />
                        </ControlGroup>
                        <ControlGroup
                            label="Index Active"
                            tooltip="Index Active or InActive"

                        >
                            <RadioList
                                direction="row"
                                name="index_active"
                                value={FormInputvalues.index_active}
                                onChange={(e,data)=> handleInputChange(e,data)}
                                error={formErrors.index_type_Invalid}
                                disabled={inputDisabled}

                            >
                                {IndexActiveOptions.map((IndexActiveOption) => (
                                    <RadioList.Option
                                        key={IndexActiveOption.label}
                                        value={IndexActiveOption.value}
                                    >
                                        {IndexActiveOption.label}
                                    </RadioList.Option>
                                ))}
                            </RadioList>
                        </ControlGroup>
                        <ControlGroup
                            label="Index Usage"
                            tooltip="Average Last 7 days Usage"

                        >
                            <Text
                                name="avg_index_usage_mb"
                                placeholder="Index Usage"
                                endAdornment={<div style={{ padding: '0 8px' }}>MB</div>}
                                value={FormInputvalues.avg_index_usage_mb}
                                onChange={(e,data)=> handleInputChange(e,data)}
                                error={formErrors.avg_index_usage_mb}
                                disabled={inputDisabled}
                            />
                        </ControlGroup>
                        <ControlGroup
                            label="Index Used"
                            tooltip="Index Used or Unused"

                        >
                            <RadioList
                                direction="row"
                                name="index_used"
                                value={FormInputvalues.index_used}
                                onChange={(e,data)=> handleInputChange(e,data)}

                                disabled={inputDisabled}

                            >
                                {IndexUsedOptions.map((IndexUsedOption) => (
                                    <RadioList.Option
                                        key={IndexUsedOption.label}
                                        value={IndexUsedOption.value}
                                    >
                                        {IndexUsedOption.label}
                                    </RadioList.Option>
                                ))}
                            </RadioList>
                        </ControlGroup>
                    </CollapsiblePanel>
                    <CollapsiblePanel
                        title="Application Contact Details"
                        onRequestClose={handleRequestClose}
                        onRequestOpen={handleRequestOpen}
                        open={includes(open, 3)}
                        description="Contact Details"
                        panelId={3}
                    >
                        {/* <ControlGroup
                            label="Source Application Contact"
                            tooltip="Application Support Contact Group/Support Email address"
                        >
                            <Text
                                name="source_application_contact"
                                placeholder="Source Application Contact Email/ Support Email Address"
                                value={FormInputvalues.source_application_contact}
                                onChange={(e,data)=> handleInputChange(e,data)}
                                disabled={inputDisabled}
                            />
                        </ControlGroup>
                        <ControlGroup
                            label="Source ITAM BSA Name"
                            tooltip="ITAM BSA for the Product as Defined in ITAM/ONECM"
                        >
                            <Text
                                name="source_itam_bsa"
                                placeholder="Souce ITAM BSA"
                                value={FormInputvalues.source_itam_bsa}
                                onChange={(e,data)=> handleInputChange(e,data)}
                                disabled={inputDisabled}
                            />
                        </ControlGroup>
                        <ControlGroup
                            label="Source System Data Owner (*)"
                            tooltip="Data Owner responsible for the Data and will receive notification"
                            help={formErrors.source_data_owner_error}
                        >
                            <Text
                                name="source_data_owner"
                                placeholder="Souce Data Owner Email"
                                value={FormInputvalues.source_data_owner}
                                onChange={(e,data)=> handleInputChange(e,data)}
                                disabled={inputDisabled}
                                error={formErrors.source_data_owner_error_Invalid}
                            />
                        </ControlGroup> */}

                        <FormRows
                            addLabel="Add Additional Contact Info"
                            onRequestAdd={() => addContactFormFields()}
                            header={ContactFormHeader}
                            disabled={inputDisabled}
                            help={formErrors.addtn_contact_owner}
                        >
                            {FormInputvalues.addtn_contact &&
                                FormInputvalues.addtn_contact.map((element, index) => (
                                    <FormRows.Row
                                        index={index}
                                        key={index}
                                        onRequestRemove={() => removeContactFormFields(index)}


                                    >
                                        <ControlGroup label="">
                                            {/* <Text
                                            name="contact_type"
                                            placeholder="Addtn Contact Type"
                                            value={element.contact_type}
                                            onChange={(e) => handleContactFormRowChange(index, e)}
                                            disabled={inputDisabled}
                                        /> */}
                                            <Select
                                                name="contact_type"
                                                onChange={(event, data) =>
                                                    handleContactFormRowChange(
                                                        index,
                                                        event,
                                                        data
                                                    )
                                                }
                                                value={element.contact_type}
                                                disabled={inputDisabled}
                                            >
                                                {ContactTypeOptions.map((ContactTypeOption) => (
                                                    <Select.Option
                                                        key={ContactTypeOption.label}
                                                        label={ContactTypeOption.label}
                                                        value={ContactTypeOption.value}
                                                    />
                                                ))}
                                            </Select>
                                            <Text
                                                name="contact_value"
                                                placeholder="Contact Email"
                                                value={element.contact_value}
                                                onChange={(e,data) =>
                                                    handleContactFormRowChange(index, e, data)
                                                }
                                                disabled={inputDisabled}
                                                error={formErrors.addtn_contact_owner_Invalid}
                                            />
                                        </ControlGroup>
                                    </FormRows.Row>
                                ))}
                        </FormRows>
                    </CollapsiblePanel>
                    <CollapsiblePanel
                        title="External Documentation"
                        onRequestClose={handleRequestClose}
                        onRequestOpen={handleRequestOpen}
                        open={includes(open, 4)}
                        description="External reference"
                        panelId={4}
                    >
                        <ControlGroup
                            label="POW Number"
                            tooltip="POW Request Number as per SPLUNK Engagement Portal"
                            help={formErrors.pow_number_error}
                        >
                            <Text
                                name="pow_number"
                                placeholder="POW/Engagement Number e.g. 1100"
                                value={FormInputvalues.pow_number}
                                onChange={(e,data)=> handleInputChange(e,data)}
                                disabled={inputDisabled}
                                error={formErrors.pow_number_Invalid}
                            />
                        </ControlGroup>
                        <FormRows
                            addLabel="Add Additional URL"
                            onRequestAdd={() => addDocumentFormFields()}
                            header={URLFormheader}
                            disabled={inputDisabled}
                        >
                            {FormInputvalues.addtn_documentation &&
                                FormInputvalues.addtn_documentation.map((element, index) => (
                                    <FormRows.Row
                                        index={index}
                                        key={index}
                                        onRequestRemove={() => removeDocumentFormFields(index)}
                                    >
                                        <ControlGroup label="">
                                            {/* <Text
                                                name="url_type"
                                                placeholder="URL Type"
                                                value={element.url_type}
                                                onChange={(e) => handleDocumentFormRowChange(index, e)}
                                                disabled={inputDisabled}
                                            /> */}
                                            <Select
                                                name="url_type"
                                                onChange={(event, data) =>
                                                    handleDocumentFormRowChange(
                                                        index,
                                                        event,
                                                        data
                                                    )
                                                }
                                                value={element.url_type}
                                                disabled={inputDisabled}
                                            >
                                                {URLTypeOptions.map((URLTypeOption) => (
                                                    <Select.Option
                                                        key={URLTypeOption.label}
                                                        label={URLTypeOption.label}
                                                        value={URLTypeOption.value}
                                                    />
                                                ))}
                                            </Select>
                                            <Text
                                                name="url_value"
                                                placeholder="URL"
                                                value={element.url_value}
                                                onChange={(event,data) => handleDocumentFormRowChange(index, event,data)}
                                                disabled={inputDisabled}
                                            />
                                            <Text
                                                name="url_comment"
                                                placeholder="comment"
                                                value={element.url_comment}
                                                onChange={(event,data) => handleDocumentFormRowChange(index, event,data)}
                                                disabled={inputDisabled}
                                            />
                                        </ControlGroup>
                                    </FormRows.Row>
                                ))}
                        </FormRows>
                    </CollapsiblePanel>
                    <CollapsiblePanel
                        title="Data Classification"
                        onRequestClose={handleRequestClose}
                        onRequestOpen={handleRequestOpen}
                        open={includes(open, 5)}
                        description="Classification of data"
                        panelId={5}
                    >
                        <ControlGroup
                            label="Customer Segment"
                            tooltip="Classify the index based on the data it contains"
                        >
                            <RadioList
                                direction="row"
                                name="index_customer_segment"
                                value={FormInputvalues.index_customer_segment}
                                onChange={(e,data)=> handleInputChange(e,data)}
                                disabled={inputDisabled}
                            >
                                {IndexCustomerSegmentOptions.map((IndexCustomerSegmentOption) => (
                                    <RadioList.Option
                                        key={IndexCustomerSegmentOption.label}
                                        value={IndexCustomerSegmentOption.value}
                                    >
                                        {IndexCustomerSegmentOption.label}
                                    </RadioList.Option>
                                ))}
                            </RadioList>
                        </ControlGroup>
                        <ControlGroup
                            label="Index Classification"
                            tooltip="Classify the index based engagement type"
                        >
                            <RadioList
                                direction="row"
                                name="index_classification"
                                value={FormInputvalues.index_classification}
                                onChange={(e,data)=> handleInputChange(e,data)}
                                disabled={inputDisabled}
                            >
                                {IndexClassificationOptions.map((IndexClassificationOption) => (
                                    <RadioList.Option
                                        key={IndexClassificationOption.label}
                                        value={IndexClassificationOption.value}
                                    >
                                        {IndexClassificationOption.label}
                                    </RadioList.Option>
                                ))}
                            </RadioList>
                        </ControlGroup>
                        <ControlGroup
                            label="Index Cluster"
                            tooltip="Select the Index Cluster where the index is created"
                        >
                            <Multiselect
                                //defaultValues={defaultValues}
                                disabled={inputDisabled}
                                name="index_cluster"
                                values={FormInputvalues.index_cluster}
                                onChange={handleDropDownIndexClusterChange}
                                inline
                            >
                                {IndexClusterDropDownOptions.map((IndexClusterDropDownOption) => (
                                    <Multiselect.Option
                                        key={IndexClusterDropDownOption.label}
                                        label={IndexClusterDropDownOption.label}
                                        value={IndexClusterDropDownOption.value}
                                    />
                                ))}
                            </Multiselect>
                        </ControlGroup>
                    </CollapsiblePanel>
                </Card.Body>
            </Card>
        </SplunkThemeProvider>
    );
}

export default ManageAssetRegistryReact;
