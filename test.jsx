import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import Modal from '@splunk/react-ui/Modal';
import { Timeline, TimelineEvent } from 'react-event-timeline';
import Calendar from '@splunk/react-icons/Calendar';
import User from '@splunk/react-icons/User';
import Button from '@splunk/react-ui/Button';
import Text from '@splunk/react-ui/Text';
import Message from '@splunk/react-ui/Message';
import WaitSpinner from '@splunk/react-ui/WaitSpinner';
import Heading from '@splunk/react-ui/Heading';
import moment from 'moment';

import { searchKVStore, insertKVStore } from '../../common/ManageKVStore';

export const HomePageHistoryModalPanelReact = forwardRef((props, _ref) => {
    const [modalHistoryOpen, setmodalHistoryOpen] = useState(false);
    const modalToggle1 = useRef(null);
    const [historyData, setHistoryData] = useState([]);
    const [indexNameModal, setIndexNameModal] = useState();
    const [timeLineColor, setTimeLineColor] = useState('#fff');
    const [comment, setComment] = useState('');
    const [infoMessage, setInfoMessage] = useState({ visible: false }); // Fixed initial state
    const [currentUser, setCurrentUser] = useState();
    const [isLoading, setIsLoading] = useState(false); // Added loading state

    const handleHistoryModalRequestClose = () => {
        setmodalHistoryOpen(false);
        setInfoMessage({ visible: false }); // Clear messages on close
        modalToggle1?.current?.focus();
    };

    const handleMessageRemove = () => {
        setInfoMessage({ visible: false });
    };

    // Pull history information from KvStore
    function getHistoryData(indexName) {
        setIsLoading(true); // Start loading
        const defaultErrorMsg = 'Error updating row. Please try again.';
        
        if (indexName) {
            searchKVStore(
                'splunk_data_catalog_history',
                '',
                `{"index_name":"${indexName}"}`,
                defaultErrorMsg
            ).then((response) => {
                setIsLoading(false); // Stop loading
                if (response.ok) {
                    response.json().then((data) => {
                        // Ensure data is an array
                        setHistoryData(Array.isArray(data) ? data : []);
                    });
                }
            }).catch(() => setIsLoading(false));
        }
    }

    useImperativeHandle(_ref, () => ({
        handleModalHistoryRequestOpen(key, indexName, currentUser, currentEmail, colorScheme) {
            setmodalHistoryOpen(true);
            setIndexNameModal(indexName);
            setCurrentUser(currentUser);
            setHistoryData([]); // Reset data before fetch
            getHistoryData(indexName);
            
            // Set contrasting colors for the bubble
            if (colorScheme === 'dark') {
                setTimeLineColor('#2D343D'); // Darker grey for dark mode
            } else {
                setTimeLineColor('#F2F4F5'); // Light grey for light mode
            }
        },
    }));

    function dateComparison(a, b) {
        const date1 = new Date(a.date);
        const date2 = new Date(b.date);
        return date2 - date1; // Newest first
    }

    function handleNewCommentSubmit() {
        if (!comment.trim()) return; // Prevent empty comments

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
                if (response.ok) {
                    getHistoryData(indexNameModal);
                    setComment("");
                    setInfoMessage({
                        visible: true,
                        type: 'success',
                        message: 'New comment added successfully',
                    });
                    setTimeout(() => setInfoMessage({ visible: false }), 2000);
                } else {
                    setInfoMessage({
                        visible: true,
                        type: 'error',
                        message: 'Error saving to KVStore. Please try again.',
                    });
                }
            })
            .catch((err) => {
                setInfoMessage({
                    visible: true,
                    type: 'error',
                    message: String(err),
                });
            });
    }

    return (
        <Modal onRequestClose={handleHistoryModalRequestClose} open={modalHistoryOpen} style={{ width: '600px' }}>
            <Modal.Header
                title={`History: ${indexNameModal}`}
                onRequestClose={handleHistoryModalRequestClose}
            />
            <Modal.Body>
                {/* 1. Message Area */}
                {infoMessage.visible && (
                    <div style={{ marginBottom: '16px' }}>
                        <Message
                            appearance="fill"
                            type={infoMessage.type || 'info'}
                            onRequestRemove={handleMessageRemove}
                        >
                            {infoMessage.message}
                        </Message>
                    </div>
                )}

                {/* 2. Add Comment Area - Styled as a clean input box */}
                <div style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    padding: '16px', 
                    borderRadius: '8px', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    marginBottom: '24px'
                }}>
                    <Heading level={4} style={{ marginBottom: '10px', fontSize: '14px' }}>Add New Activity</Heading>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ flex: 1 }}>
                            <Text
                                name="comment"
                                onChange={(e, { value }) => setComment(value)}
                                placeholder="Type a comment or status update..."
                                value={comment}
                                inline
                            />
                        </div>
                        <Button
                            label="Post"
                            appearance="primary"
                            onClick={() => handleNewCommentSubmit()}
                            disabled={!comment.trim()}
                        />
                    </div>
                </div>

                {/* 3. Timeline Area */}
                <div style={{ position: 'relative', minHeight: '200px' }}>
                    {isLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                            <WaitSpinner size="medium" />
                        </div>
                    ) : historyData.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#9AA4AE', padding: '40px', fontStyle: 'italic' }}>
                            No history found for this index.
                        </div>
                    ) : (
                        // CRITICAL FIX: Wrap ALL events inside ONE Timeline component
                        <Timeline lineColor={'rgba(255,255,255,0.2)'} style={{ width: '100%' }}>
                            {historyData.sort(dateComparison).map((historyValue) => (
                                <TimelineEvent
                                    key={historyValue._key}
                                    title={
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{historyValue.username}</span>
                                            <span style={{ fontSize: '11px', opacity: 0.6, fontWeight: 'normal' }}>
                                                {moment(historyValue.date).fromNow()}
                                            </span>
                                        </div>
                                    }
                                    createdAt={moment(historyValue.date).format('LLL')} // e.g. February 18, 2026 10:30 AM
                                    icon={<User screenReaderText={null} size={0.9} />} // Changed to User icon for variety
                                    
                                    // Style overrides for cleaner look
                                    contentStyle={{ 
                                        backgroundColor: timeLineColor, 
                                        borderRadius: '8px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                        border: 'none',
                                        padding: '10px 14px'
                                    }}
                                    bubbleStyle={{ 
                                        backgroundColor: '#65a637', // Splunk Green for the dot
                                        borderColor: '#65a637',
                                        width: '24px',
                                        height: '24px',
                                        marginLeft: '-2px' // Align correction
                                    }}
                                    iconStyle={{ 
                                        color: '#fff', 
                                        fontSize: '14px',
                                        marginTop: '4px' 
                                    }}
                                >
                                    <span style={{ fontSize: '13px', lineHeight: '1.5', color: 'inherit' }}>
                                        {historyValue.comment}
                                    </span>
                                </TimelineEvent>
                            ))}
                        </Timeline>
                    )}
                </div>
            </Modal.Body>
        </Modal>
    );
});
