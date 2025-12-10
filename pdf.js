const puppeteer = require("puppeteer");
const fs = require("fs");
const { PDFDocument } = require("pdf-lib");

async function run() {
  const url = process.argv[2];
  if (!url) {
    console.log("Usage: node pdf.js <url>");
    process.exit(1);
  }

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Force mobile viewport
  await page.setViewport({
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  await page.goto(url, { waitUntil: "networkidle2" });

  // Remove hidden elements
  await page.evaluate(() => {
    function isHidden(el) {
      const style = getComputedStyle(el);
      if (style.display === "none") return true;
      if (style.visibility === "hidden") return true;
      if (el.offsetWidth === 0 && el.offsetHeight === 0) return true;
      return false;
    }
    function clean(node) {
      for (const child of [...node.children]) {
        if (isHidden(child)) child.remove();
        else clean(child);
      }
    }
    clean(document.body);
  });

  // Disable sticky headers + animations
  await page.addStyleTag({
    content: `
      * {
        animation: none !important;
        transition: none !important;
      }
      header, .sticky, .fixed,
      [style*="position: sticky"], [style*="position:fixed"] {
        position: static !important;
        top: auto !important;
      }
    `
  });

  // Force responsive mobile layout
  await page.addStyleTag({
    content: `
      body, html {
        width: 375px !important;
        overflow-x: hidden !important;
      }
      img, video {
        max-width: 100% !important;
        height: auto !important;
      }
    `
  });

  // Allow layout to settle
  await new Promise(res => setTimeout(res, 500));

  // Measure full height
  const fullHeight = await page.evaluate(() => document.body.scrollHeight);

  // Expand viewport to full height
  await page.setViewport({
    width: 375,
    height: fullHeight,
    deviceScaleFactor: 2
  });

  // Capture full page WITHOUT stitching
  const imgBuffer = await page.screenshot({
    fullPage: false
  });

  // Save PNG
  const pngPath = "C:\\Users\\14433\\Downloads\\mobile.png";
  const pdfPath = "C:\\Users\\14433\\Downloads\\mobile.pdf";

  fs.writeFileSync(pngPath, imgBuffer);

  // Convert to PDF
  const pdfDoc = await PDFDocument.create();
  const pngImage = await pdfDoc.embedPng(imgBuffer);
  const pagePDF = pdfDoc.addPage([pngImage.width, pngImage.height]);
  pagePDF.drawImage(pngImage, {
    x: 0,
    y: 0,
    width: pngImage.width,
    height: pngImage.height
  });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(pdfPath, pdfBytes);

  console.log("✔ Perfect mobile PDF created:", pdfPath);

  await browser.close();
}

run();
