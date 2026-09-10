const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const FONT_PATH = path.join(__dirname, 'fonts', 'Roboto-Regular.ttf');

const ensureContractsDirectory = () => {
  const targetDir = path.join(__dirname, '..', 'uploads', 'contracts');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  return targetDir;
};

/**
 * Generate a professional-looking contract PDF with full Unicode/Vietnamese support.
 * @param {Object}   options
 * @param {string}   options.fileName  – e.g. "CTR-1234567890.pdf"
 * @param {string[]} options.lines     – array of text lines to render
 * @returns {string} absolute file path of the generated PDF
 */
const generateContractPdf = ({ fileName, lines }) => {
  const directory = ensureContractsDirectory();
  const filePath = path.join(directory, fileName);

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 60, bottom: 60, left: 50, right: 50 },
  });

  // Register Roboto font (supports Vietnamese diacritics)
  doc.registerFont('Roboto', FONT_PATH);

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // ── Header band ──
  doc
    .rect(0, 0, doc.page.width, 100)
    .fill('#2563eb');

  doc
    .font('Roboto')
    .fontSize(26)
    .fillColor('#ffffff')
    .text('NoDirt', 50, 30, { align: 'left' });

  doc
    .fontSize(11)
    .fillColor('#dbeafe')
    .text('Recurring Service Contract', 50, 62, { align: 'left' });

  // ── Contract title ──
  const title = lines[0] || 'Service Contract';
  doc
    .fillColor('#111827')
    .fontSize(18)
    .text(title, 50, 130, { align: 'center', width: doc.page.width - 100 });

  // ── Divider ──
  doc
    .moveTo(50, 165)
    .lineTo(doc.page.width - 50, 165)
    .strokeColor('#e5e7eb')
    .lineWidth(1)
    .stroke();

  // ── Body lines ──
  doc
    .font('Roboto')
    .fontSize(12)
    .fillColor('#374151');

  let y = 185;
  const contentLines = lines.slice(1).filter(l => l !== '');

  for (const line of contentLines) {
    // Detect label:value pattern
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0 && colonIdx < 30) {
      const label = line.substring(0, colonIdx + 1);
      const value = line.substring(colonIdx + 1).trim();

      doc
        .fontSize(11)
        .fillColor('#6b7280')
        .text(label, 50, y, { continued: true })
        .fillColor('#111827')
        .text(' ' + value);
    } else {
      doc
        .fontSize(12)
        .fillColor('#374151')
        .text(line, 50, y);
    }
    y += 24;
  }

  // ── Footer ──
  const footerY = doc.page.height - 80;
  doc
    .moveTo(50, footerY)
    .lineTo(doc.page.width - 50, footerY)
    .strokeColor('#e5e7eb')
    .lineWidth(0.5)
    .stroke();

  doc
    .font('Roboto')
    .fontSize(9)
    .fillColor('#9ca3af')
    .text(
      `Created on ${new Date().toLocaleDateString('en-GB')} | NoDirt Cleaning Service`,
      50,
      footerY + 10,
      { align: 'center', width: doc.page.width - 100 }
    );

  doc.end();

  // Return path synchronously — pdfkit writes async but file handle is ready
  return filePath;
};

module.exports = {
  generateContractPdf,
};
