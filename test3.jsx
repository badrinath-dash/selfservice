import Popover from '@splunk/react-ui/Popover'; // Make sure to add this import

// --- New Component: Handles the Popover State ---
const DescriptionPopover = ({ text }) => {
    const [open, setOpen] = useState(false);
    const anchorRef = useRef(null);

    // 1. Safety check for empty text
    if (!text) return <span style={{ opacity: 0.5, fontStyle: 'italic' }}>No description provided.</span>;

    // 2. Style for the "Collapsed" view (Truncated)
    const toggleStyle = {
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',
        cursor: 'pointer', // Indicates it is clickable
        borderBottom: '1px dotted rgba(255,255,255,0.3)', // Visual cue for interaction
        paddingBottom: '2px'
    };

    return (
        <>
            {/* The Trigger (Truncated Text) */}
            <div 
                ref={anchorRef} 
                onClick={(e) => {
                    e.stopPropagation(); // Prevent clicking the card behind it
                    setOpen(!open);
                }}
                style={toggleStyle}
                title="Click to view full description" // Helper tooltip
            >
                {text}
            </div>

            {/* The Popover (Full Text) */}
            <Popover
                open={open}
                anchor={anchorRef.current}
                onRequestClose={() => setOpen(false)}
                appearance="light" // Use 'light' for contrast against the dark card
                autoFocus={false}  // Prevents jumping focus
            >
                <div style={{ 
                    padding: '16px', 
                    maxWidth: '300px', 
                    maxHeight: '400px', 
                    overflowY: 'auto',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    color: '#3C444D', // Dark text for light popover
                    whiteSpace: 'pre-wrap' // Preserves newlines if any
                }}>
                    <strong>Full Description:</strong>
                    <div style={{ marginTop: '8px' }}>
                        {text}
                    </div>
                </div>
            </Popover>
        </>
    );
};
