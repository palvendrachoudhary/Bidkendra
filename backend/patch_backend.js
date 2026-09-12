const fs = require('fs');

const realOcrServicePath = 'backend/src/services/realOcrService.js';
let ocrContent = fs.readFileSync(realOcrServicePath, 'utf8');

// Return extractedText in the output payload
if (!ocrContent.includes('extractedText: extractedText,')) {
    ocrContent = ocrContent.replace(
        'textPreview: textPreview || \'[Binary or unreadable content. No raw text detected.]\',',
        'textPreview: textPreview || \'[Binary or unreadable content. No raw text detected.]\',\n    extractedText: extractedText,'
    );
    fs.writeFileSync(realOcrServicePath, ocrContent, 'utf8');
    console.log("Updated realOcrService.js to return extractedText");
}

const verificationControllerPath = 'backend/src/controllers/verificationController.js';
let vcContent = fs.readFileSync(verificationControllerPath, 'utf8');

if (!vcContent.includes('const aiService = require')) {
    vcContent = vcContent.replace(
        "const { generateId } = require('../utils/helpers');",
        "const { generateId } = require('../utils/helpers');\nconst aiService = require('../services/aiService');"
    );
}

// Update verifyDocument to include AI service calls
if (!vcContent.includes('const summary = await aiService.generateSummary')) {
    const scanResultUsage = `
    const scanResult = await scanAndVerifyDocument(fileBuffer, fileName, mimeType);

    // AI Enrichment
    const textForAI = scanResult.extractedText || "No text available";
    const summary = await aiService.generateSummary(textForAI);
    const translation = await aiService.translateDocument(textForAI, 'hi'); // Defaulting to Hindi
    const emailDraft = await aiService.generateEmailDraft({ verdict: scanResult.verdict.split(':')[0], checksDetail: scanResult.checksDetail }, req.body.companyName || "Vendor");

    scanResult.aiSummary = summary;
    scanResult.aiTranslation = translation;
    scanResult.emailDraft = emailDraft;
    
    // Clean up potentially large extracted text before sending to client
    delete scanResult.extractedText;
`;
    vcContent = vcContent.replace('const scanResult = await scanAndVerifyDocument(fileBuffer, fileName, mimeType);', scanResultUsage);
}

// Add processBulkDocuments
if (!vcContent.includes('exports.processBulkDocuments')) {
    const bulkMethod = `

exports.processBulkDocuments = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return sendResponse(res, 400, false, null, 'No files uploaded');
    }

    const results = [];
    
    for (const file of req.files) {
      const fileName = file.originalname || file.filename;
      const mimeType = file.mimetype;
      const fileBuffer = fs.readFileSync(file.path);
      
      // Clean up temp file
      try { fs.unlinkSync(file.path); } catch (e) {}

      const scanResult = await scanAndVerifyDocument(fileBuffer, fileName, mimeType);

      // AI Enrichment
      const textForAI = scanResult.extractedText || "No text available";
      const summary = await aiService.generateSummary(textForAI);
      const translation = await aiService.translateDocument(textForAI, 'hi');
      const emailDraft = await aiService.generateEmailDraft({ verdict: scanResult.verdict.split(':')[0], checksDetail: scanResult.checksDetail }, req.body.companyName || "Vendor");

      scanResult.aiSummary = summary;
      scanResult.aiTranslation = translation;
      scanResult.emailDraft = emailDraft;
      delete scanResult.extractedText;

      results.push(scanResult);
      
      // We could also log these to the DB as bulk audit logs, but keeping it simple for the batch return.
    }

    sendResponse(res, 200, true, results, \`Successfully processed \${results.length} documents\`);
  } catch (err) {
    next(err);
  }
};
`;
    vcContent += bulkMethod;
    fs.writeFileSync(verificationControllerPath, vcContent, 'utf8');
    console.log("Updated verificationController.js with AI and bulk upload support");
}

const verificationRoutesPath = 'backend/src/routes/verificationRoutes.js';
let routeContent = fs.readFileSync(verificationRoutesPath, 'utf8');

if (!routeContent.includes('processBulkDocuments')) {
    routeContent = routeContent.replace(
        "verifyDocument, getComplianceScore } = require('../controllers/verificationController');",
        "verifyDocument, getComplianceScore, processBulkDocuments } = require('../controllers/verificationController');"
    );
    routeContent = routeContent.replace(
        "router.post('/document', upload.single('document'), verifyDocument);",
        "router.post('/document', upload.single('document'), verifyDocument);\nrouter.post('/bulk', upload.array('documents', 10), processBulkDocuments);"
    );
    fs.writeFileSync(verificationRoutesPath, routeContent, 'utf8');
    console.log("Updated verificationRoutes.js with /bulk endpoint");
}
