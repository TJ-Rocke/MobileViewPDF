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
  const VIEWPORT_WIDTH = 375;
  const VIEWPORT_HEIGHT = 667;

  await page.setViewport({
    width: VIEWPORT_WIDTH,
    height: VIEWPORT_HEIGHT,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  await page.goto(url, { waitUntil: "networkidle2" });

  // Remove hidden elements (desktop / unused)
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
        width: ${VIEWPORT_WIDTH}px !important;
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

  // Only stack "image + text" flex rows, leave comparison rows alone
  await page.evaluate(() => {
    const isMediaContainer = el => {
      return !!el.querySelector("img, picture, video");
    };

    document.querySelectorAll("*").forEach(el => {
      const style = getComputedStyle(el);
      if (style.display === "flex" && style.flexDirection === "row") {
        const children = Array.from(el.children);
        const hasMediaChild = children.some(c => isMediaContainer(c) || c.tagName === "IMG");

        // Only stack 2-child flex rows with media (typical hero / image+copy sections)
        if (children.length === 2 && hasMediaChild) {
          el.style.flexDirection = "column";
          el.style.alignItems = "stretch";
        }
      }
    });
  });

  // Scroll through the page once to trigger lazy loading and load all images
  await page.evaluate(async () => {
    const delay = ms => new Promise(r => setTimeout(r, ms));
    const viewportHeight = window.innerHeight || 667;
    let current = 0;
    let maxHeight = document.body.scrollHeight;

    while (current + viewportHeight < maxHeight) {
      window.scrollTo(0, current);
      await delay(300);
      current += viewportHeight;
      maxHeight = document.body.scrollHeight;
    }

    // final pass at absolute bottom
    window.scrollTo(0, maxHeight);
    await delay(300);

    // go back to top for the capture
    window.scrollTo(0, 0);
  });

  // Small extra wait for any pending image loads / network
  await new Promise(res => setTimeout(res, 800));

  // Get full scroll height after everything has loaded
  const fullHeight = await page.evaluate(() => document.body.scrollHeight);

  // Capture the page in multiple 667px-tall slices
  const screenshots = [];
  let offset = 0;

  while (offset < fullHeight) {
    await page.evaluate(y => window.scrollTo(0, y), offset);
    await new Promise(res => setTimeout(res, 250));

    const buffer = await page.screenshot({
      fullPage: false // current viewport only
    });

    screenshots.push(buffer);
    offset += VIEWPORT_HEIGHT;
  }

  // Save first slice as PNG (optional)
  const pngPath = "C:\\Users\\14433\\Downloads\\mobile.png";
  fs.writeFileSync(pngPath, screenshots[0]);

  // Build PDF from all slices (each slice = one page)
  const pdfDoc = await PDFDocument.create();

  for (const shot of screenshots) {
    const pngImage = await pdfDoc.embedPng(shot);
    const pagePDF = pdfDoc.addPage([pngImage.width, pngImage.height]);
    pagePDF.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: pngImage.width,
      height: pngImage.height
    });
  }

  const pdfBytes = await pdfDoc.save();
  const pdfPath = "C:\\Users\\14433\\Downloads\\mobile.pdf";
  fs.writeFileSync(pdfPath, pdfBytes);

  console.log("✔ Mobile PDF (full page, smart responsive layout) created:", pdfPath);

  await browser.close();
}

run();
