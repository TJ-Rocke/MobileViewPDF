# MobileViewToPDF

MobileViewToPDF is a Node.js tool that captures a perfect, fully responsive mobile screenshot of any webpage (including Funnelish funnels) and exports it as a single long PDF. It forces a true mobile viewport, freezes dynamic layout, removes desktop-only elements, scroll-captures the page in segments, stitches them seamlessly, and converts the final stitched image into a PDF. The output PDF looks exactly like viewing the page on a real 375px-wide mobile device.

## Features

- True mobile rendering (375px width)
- Fully responsive layout capture
- Removes sticky headers, desktop content, and animations
- Freezes all JavaScript to prevent layout shifting
- Scroll-based segmented screenshotting (no tearing or duplication)
- Seamless pixel-perfect stitching
- Exports as PNG and PDF
- Saves directly to your Downloads folder

## Requirements

Node.js 16 or higher  
npm  
Install dependencies by running:  
npm install puppeteer sharp pdf-lib  
(Puppeteer downloads Chromium automatically on first install.)

## Usage

Run the tool with:  
node pdf.js "https://your-url-here.com"  
The script outputs:  
C:\Users\14433\Downloads\mobile.png  
C:\Users\14433\Downloads\mobile.pdf

## Project Structure

/MobileViewToPDF  
├── pdf.js  
├── package.json  
├── package-lock.json  
├── node_modules/  
├── .gitignore  
└── README.md

## Notes

- The viewport stays locked at 375 × 667 to preserve true mobile layout.
- All JavaScript is removed after hydration to freeze the page.
- Sticky headers, animations, and desktop-only sections are stripped.
- The page is captured in segments to avoid Chrome raster overflow.
- Each segment is stitched into one clean final image before PDF export.
- This method guarantees the full page is captured without tearing, duplication, misalignment, or layout jumps.
