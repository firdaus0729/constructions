const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function convertHtmlToPdf() {
  const htmlPath = path.join(__dirname, 'load-tests', 'load-test-report-fr.html');
  const pdfPath = path.join(__dirname, 'load-tests', 'Load-Test-Report-FR.pdf');

  // Read the HTML file
  if (!fs.existsSync(htmlPath)) {
    console.error(`HTML file not found: ${htmlPath}`);
    process.exit(1);
  }

  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  const fileUrl = `file://${htmlPath.replace(/\\/g, '/')}`;

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Load the HTML file
    await page.goto(fileUrl, { waitUntil: 'networkidle2' });
    
    // Generate PDF
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true,
      preferCSSPageSize: true
    });

    await browser.close();

    // Get file size
    const stats = fs.statSync(pdfPath);
    const fileSizeInKB = (stats.size / 1024).toFixed(2);

    console.log(`✓ PDF generated successfully!`);
    console.log(`  File: Load-Test-Report-FR.pdf`);
    console.log(`  Size: ${fileSizeInKB} KB`);
    console.log(`  Location: ${pdfPath}`);
  } catch (error) {
    console.error('Error converting HTML to PDF:', error);
    process.exit(1);
  }
}

convertHtmlToPdf();
