import React, { useState, useRef } from 'react';
import Popover from '@splunk/react-ui/Popover'; 
import Button from '@splunk/react-ui/Button'; 
import Close from '@splunk/react-icons/enterprise/Close';

const DescriptionPopover = ({ text }) => {
    const [open, setOpen] = useState(false);
    const anchorRef = useRef(null);

    // 1. Safety check
    if (!text) return <span style={{ opacity: 0.5, fontStyle: 'italic', fontSize: '13px' }}>No description provided.</span>;

    // 2. Styles for the clickable "Link" in the card
    const linkStyle = {
        cursor: 'pointer',
        color: '#65a637', // Splunk Green for visibility
        fontSize: '13px',
        fontWeight: '600',
        textDecoration: 'underline',
        display: 'inline-block',
        marginTop: '4px'
    };

    // 3. Styles for the TRUNCATED text preview
    const truncatedTextStyle = {
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',
        marginBottom: '4px',
        opacity: 0.9
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            
            {/* The Truncated Text Preview */}
            <div style={truncatedTextStyle} title={text}>
                {text}
            </div>

            {/* The Trigger Link */}
            <div 
                ref={anchorRef} 
                onClick={(e) => {
                    e.stopPropagation(); 
                    setOpen(!open);
                }}
                style={linkStyle}
            >
                {open ? 'Close' : 'Show Full Description'}
            </div>

            {/* The Robust Popover */}
            {open && (
                <Popover
                    open={open}
                    anchor={anchorRef.current}
                    onRequestClose={() => setOpen(false)}
                    // We manually style, so appearance is less critical, but 'light' is safe
                    appearance="light" 
                    mountNode={document.body}  
                    position="right" // Tries to put it to the right, falls back to best fit
                    style={{ zIndex: 99999 }} // Ensures it sits on top of everything
                >
                    {/* INNER CONTENT: High Contrast Styles */}
                    <div style={{ 
                        backgroundColor: '#ffffff',  // Force White Background
                        color: '#333333',            // Force Dark Text
                        width: '320px',              // Fixed width for readability
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.5)', // Deep shadow to separate from background
                        border: '1px solid #ccc',
                        position: 'relative'
                    }}>
                        {/* Header */}
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

                        {/* Scrollable Text Body */}
                        <div style={{ 
                            maxHeight: '300px', 
                            overflowY: 'auto', 
                            whiteSpace: 'pre-wrap', // Preserves paragraphs/formatting
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
