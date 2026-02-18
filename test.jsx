import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import Modal from '@splunk/react-ui/Modal';
import { Timeline, TimelineEvent } from 'react-event-timeline';
import Card from '@splunk/react-ui/Card';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import Calendar from '@splunk/react-icons/Calendar';
import P from '@splunk/react-ui/Paragraph';
import Plus from '@splunk/react-icons/Plus';
import Button from '@splunk/react-ui/Button';
import Text from '@splunk/react-ui/Text';
import Message from '@splunk/react-ui/Message';
import moment from 'moment';

import { searchKVStore, insertKVStore } from '../../common/ManageKVStore';

export const HomePageHistoryModalPanelReact = forwardRef((props, _ref) => {
    const [modalHistoryOpen, setmodalHistoryOpen] = useState(false);
    const modalToggle1 = useRef(null);
    const [historyData, setHistoryData] = useState([]);
    const [indexNameModal, setIndexNameModal] = useState();
    const [timeLineColor,setTimeLineColor]=useState();
    const [comment, setComment] = useState('');
    const [infoMessage, setInfoMessage] = useState([]);
    const [currentUser, setCurrentUser] = useState();


    const handleHistoryModalRequestClose = () => {
        setmodalHistoryOpen(false);
        modalToggle1?.current?.focus(); // Return focus to the invoking element on close
    };

    const handleMessageRemove = () => {
        setInfoMessage({ visible: false });
    };


 /// Pull history information from KvStore
    function getHistoryData(indexName) {
        // event.preventDefault();
        const defaultErrorMsg = 'Error updating row. Please try again.';
        if (Object.keys(indexName).length !== 0) {
            searchKVStore(
                'splunk_data_catalog_history',
                '',
                // eslint-disable-next-line camelcase
                `{"index_name":"${indexName}"}`,
                defaultErrorMsg
            ).then((response) => {
                if (response.ok) {
                    response.json().then((data) => {
                        setHistoryData(data);
                        // Replace with a Spinner
                        // setInfoMessage({
                        //     visible: true,
                        //     type: 'success',
                        //     message: 'Successfully retrieved history from SPLUNK KVStore',
                        // });
                        // setTimeout(() => {
                        //     setInfoMessage({
                        //         visible: false,
                        //     });
                        // }, 1000);
                    });
                }
            });
        }

    }

    useImperativeHandle(_ref, () => ({
        handleModalHistoryRequestOpen(key, indexName, currentUser, currentEmail,colorScheme) {
            setmodalHistoryOpen(true);
            setIndexNameModal(indexName);
            setCurrentUser(currentUser);
            getHistoryData(indexName);
            setTimeLineColor(colorScheme);
            if (colorScheme === 'dark') {
                setTimeLineColor('#3c444d');
            }
            else{
                setTimeLineColor('#f4f4f4');
            }
        },
    }));



    function dateComparison(a, b) {
        const date1 = new Date(a.date)
        const date2 = new Date(b.date)

        return date2 - date1;
    }

    const sortedResults = historyData.sort(dateComparison)


    const HistoryDataTimeline = sortedResults
        // .sort((a, b) => (new Date(a.date) - new Date(b.date) ))
        .map((historyValue) => (
                <Timeline style={{ fontSize: '100%'}} key={historyValue._key}>
                    <TimelineEvent
                        title={historyValue.username}
                        titleStyle={{ fontWeight: 'bold' }}
                        createdAt={historyValue.date}
                        // style={{ fontSize: '100%' }}
                        container="card"
                        icon={<Calendar screenReaderText={null} />}
                        contentStyle={{ background:timeLineColor }}
                        bubbleStyle={{ background:timeLineColor }}
                    >
                        {historyValue.comment}
                    </TimelineEvent>
                </Timeline>

        ));

    function handleNewCommentSubmit() {
        // event.preventDefault();
        // Date format needs to be 2022-01-29T14:48:00.000Z
        const defaultErrorMsg = 'Error updating row. Please try again.';
        const today = moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ');
        insertKVStore(
            'splunk_data_catalog_history',
            '',
            {
                "index_name": indexNameModal,
                "comment": comment,
                "username": currentUser,
                "date": today
            },
            defaultErrorMsg
        )
            .then((response) => {
                console.log(response);
                if (response.ok) {
                    getHistoryData(indexNameModal);
                    setComment(" ");
                    setInfoMessage({
                        visible: true,
                        type: 'success',
                        message: 'New comment added successfully',
                    });
                    setTimeout(() => {
                        setInfoMessage({
                            visible: false,
                        });
                    }, 1000);
                    // eslint-disable-next-line no-undef
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
                setTimeout(() => {
                    setInfoMessage({
                        visible: false,
                    });
                }, 1000);
            });
    }

    return (
        <>
            <Modal onRequestClose={handleHistoryModalRequestClose} open={modalHistoryOpen}>
                <Modal.Header
                    title={`Change Activity for Index ${indexNameModal}`}
                    onRequestClose={handleHistoryModalRequestClose}
                />
                <Modal.Body>
                {infoMessage.visible && (
                        <Message
                            appearance="fill"
                            type={infoMessage.type || 'info'}
                            onRequestRemove={handleMessageRemove}
                        >
                            {infoMessage.message}
                        </Message>
                    )}
                    <ControlGroup label="">
                        <Text
                            name="comment"
                            onChange={(event, { value }) => {
                                setComment(value);
                            }}

                            placeholder="Add a brief comment"
                            value={comment}
                        />
                        <Button
                            icon={<Plus screenReaderText={null} />}
                            label="Add"
                            appearance="primary"
                            onClick={() => handleNewCommentSubmit()}
                        />
                    </ControlGroup>
                    {HistoryDataTimeline}
                </Modal.Body>
            </Modal>
        </>
    );
});
