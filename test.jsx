<div style={{ 
    // 1. Structure & Spacing
    padding: '40px', 
    maxWidth: '1600px', 
    margin: '0 auto',
    minHeight: '100vh', // Ensures background fills the screen even if content is short

    // 2. Background Image Logic
    // REPLACE 'your_app_name' and 'your_image.jpg' below:
    backgroundImage: `
        linear-gradient(to bottom, rgba(14, 17, 23, 0.85), rgba(14, 17, 23, 0.95)), 
        url("/static/app/your_app_name/your_image.jpg")
    `,
    
    // 3. Background Positioning
    backgroundSize: 'cover',      // Scales image to fill container
    backgroundPosition: 'center', // Centers the image
    backgroundAttachment: 'fixed' // Keeps background static while scrolling (Parallax effect)
}}>
