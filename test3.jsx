import React, { useState, useRef, useLayoutEffect } from 'react';
import Popover from '@splunk/react-ui/Popover';
import Button from '@splunk/react-ui/Button';
import Close from '@splunk/react-icons/enterprise/Close';

const DescriptionPopover = ({ text }) => {
    const [open, setOpen] = useState(false);
    const [isTruncated, setIsTruncated] = useState(false);
    const textRef = useRef(null);
    const anchorRef = useRef(null);

    // 1. Safety check
    if (!text) return <span style={{ opacity: 0.5, fontStyle: 'italic', fontSize: '13px' }}>No description provided.</span>;

    // 2. Measure the text on render to see if it overflows
    useLayoutEffect(() => {
        const element = textRef.current;
        if (element) {
            // If the content (scrollHeight) is taller than the visible box (clientHeight), it's truncated.
            // We verify scrollHeight > clientHeight OR if the text is simply very long (fallback)
            const truncated = element.scrollHeight > element.clientHeight || element.scrollHeight > 60; 
            setIsTruncated(truncated);
        }
    }, [text]);

    // 3. Styles
    const linkStyle = {
        cursor: 'pointer',
        color: '#65a637', // Splunk Green
        fontSize: '12px',
        fontWeight: '600',
        textDecoration: 'none',
        marginTop: '4px',
        display: 'inline-flex',
        alignItems: 'center'
    };

    const textStyle = {
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',
        marginBottom: '4px',
        opacity: 0.9,
        fontSize: '13px',
        lineHeight: '1.5', // Important for calculation
        maxHeight: '4.5em' // 1.5 lineHeight * 3 lines = 4.5em max height
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            
            {/* The Text Preview */}
            <div ref={textRef} style={textStyle} title={isTruncated ? text : ''}>
                {text}
            </div>

            {/* CONDITIONAL RENDER: Only show this link if text is actually truncated */}
            {isTruncated && (
                <div 
                    ref={anchorRef} 
                    onClick={(e) => {
                        e.stopPropagation(); 
                        setOpen(!open);
                    }}
                    style={linkStyle}
                    role="button"
                >
                    {open ? 'Close' : 'Show Full Description ›'}
                </div>
            )}

            {/* The Popover Logic (Identical to before) */}
            {open && (
                <Popover
                    open={open}
                    anchor={anchorRef.current}
                    onRequestClose={() => setOpen(false)}
                    appearance="light"
                    mountNode={document.body}  
                    position="right"
                    style={{ zIndex: 99999 }}
                >
                    <div style={{ 
                        backgroundColor: '#ffffff',
                        color: '#333333',
                        width: '320px',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                        border: '1px solid #ccc',
                        position: 'relative'
                    }}>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: '12px',
                            borderBottom: '1px solid #eee',
                            paddingBottom: '8px'
                        }}>
                            <span style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', color: '#000' }}>
                                Full Description
                            </span>
                            <Button 
                                appearance="flat" 
                                icon={<Close />} 
                                onClick={() => setOpen(false)} 
                                style={{ minWidth: 'auto', padding: '4px' }}
                            />
                        </div>
                        <div style={{ 
                            maxHeight: '300px', 
                            overflowY: 'auto', 
                            whiteSpace: 'pre-wrap',
                            fontSize: '14px',
                            lineHeight: '1.6'
                        }}>
                            {text}
                        </div>
                    </div>
                </Popover>
            )}
        </div>
    );
};
