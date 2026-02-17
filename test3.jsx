import Popover from '@splunk/react-ui/Popover'; 

// --- UPDATED POPOVER COMPONENT ---
const DescriptionPopover = ({ text }) => {
    // 1. Create a state to track open/closed
    const [open, setOpen] = useState(false);
    
    // 2. Create a ref for the anchor element (the clickable text)
    const anchorRef = useRef(null);

    if (!text) return <span style={{ opacity: 0.5, fontStyle: 'italic', fontSize: '13px' }}>No description provided.</span>;

    const toggleStyle = {
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',
        cursor: 'pointer',
        borderBottom: '1px dotted rgba(255,255,255,0.5)',
        paddingBottom: '2px',
        fontSize: '13px',
        color: '#DDE3EA'
    };

    return (
        <>
            {/* The Trigger (Truncated Text) */}
            <div 
                ref={anchorRef} 
                onClick={(e) => {
                    e.stopPropagation(); 
                    setOpen(!open);
                }}
                style={toggleStyle}
                title="Click to view full description"
            >
                {text}
            </div>

            {/* The Popover (Floating above everything) */}
            {open && (
               <Popover
                   open={open}
                   anchor={anchorRef.current}
                   onRequestClose={() => setOpen(false)}
                   appearance="light"
                   autoFocus={false}
                   
                   // --- CRITICAL FIXES ---
                   // 1. Mounts the popover to the body, escaping the card's stacking context
                   mountNode={document.body}  
                   
                   // 2. Ensures standard positioning behavior
                   position="below" 
                   
                   // 3. Optional: Adds a subtle shadow for better readability
                   style={{ 
                       zIndex: 9999, 
                       boxShadow: '0 8px 24px rgba(0,0,0,0.2)' 
                   }}
               >
                   <div style={{ 
                       padding: '16px', 
                       maxWidth: '300px', 
                       maxHeight: '400px', 
                       overflowY: 'auto',
                       fontSize: '14px',
                       lineHeight: '1.5',
                       color: '#3C444D', 
                       whiteSpace: 'pre-wrap'
                   }}>
                       <div style={{ fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
                           Full Description
                       </div>
                       {text}
                   </div>
               </Popover>
            )}
        </>
    );
};
