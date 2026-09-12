const fs = require('fs');
const path = require('path');

const FIXTURES_DIR = __dirname;

function loadTextFixture(filename) {
  return fs.readFileSync(path.join(FIXTURES_DIR, filename), 'utf8');
}

/**
 * Creates a minimal valid single-page PDF binary buffer containing the specified text string.
 * Uses standard PDF 1.4 objects without external dependencies so it works universally in Node.js.
 */
function createMinimalPdfBuffer(textContent = 'BidVerify AI Test Document') {
  // Simple PDF 1.4 structure
  const escapedText = textContent.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const streamContent = `BT /F1 12 Tf 50 750 Td (${escapedText}) Tj ET`;
  const streamLength = Buffer.byteLength(streamContent, 'utf8');

  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${streamContent}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000344 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
424
%%EOF`;

  return Buffer.from(pdfString, 'binary');
}

module.exports = {
  loadTextFixture,
  createMinimalPdfBuffer,
  COMPLIANT_TEXT: loadTextFixture('cpcl_compliant_bid.txt'),
  DUMMY_TEXT: loadTextFixture('dummy_noncompliant.txt'),
  NON_CORPORATE_TEXT: loadTextFixture('non_corporate_bid.txt')
};
