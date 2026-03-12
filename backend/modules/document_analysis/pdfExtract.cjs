// CommonJS module for PDF extraction using pdfjs-dist legacy build for Node.js
const fs = require('fs/promises');

console.log('[pdfExtract.cjs] Using pdfjs-dist legacy build for Node.js PDF extraction');

/**
 * Extract text from a PDF file (buffer or file path)
 * @param {Buffer|string} input - Buffer or file path
 * @returns {Promise<string>} - Extracted text
 */
async function extractPdfText(input) {
  let buffer;
  if (Buffer.isBuffer(input)) {
    buffer = input;
  } else if (typeof input === 'string') {
    buffer = await fs.readFile(input);
  } else {
    throw new Error('Input must be a Buffer or file path');
  }
  
  try {
    // Dynamically import pdfjs-dist (ESM module)
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const { getDocument } = pdfjsLib;
    
    console.log('[pdfExtract.cjs] pdfjs-dist imported successfully');
    
    // Load PDF from buffer
    const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
    console.log('[pdfExtract.cjs] PDF loaded, pages:', pdf.numPages);
    
    let fullText = '';
    let textExtracted = false;
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Debug: log what we're getting from page
      console.log(`[pdfExtract.cjs] Page ${pageNum} - items count:`, textContent.items.length);
      console.log(`[pdfExtract.cjs] Page ${pageNum} - textContent keys:`, Object.keys(textContent));
      
      if (textContent.items.length > 0) {
        console.log(`[pdfExtract.cjs] Page ${pageNum} - first 3 items:`, textContent.items.slice(0, 3));
      }
      
      // Extract text - handle both text property and str property
      let pageText = '';
      textContent.items.forEach((item, index) => {
        if (item.str) {
          pageText += item.str;
          textExtracted = true;
        } else if (item.text) {
          const text = Array.isArray(item.text) ? item.text.join('') : item.text;
          pageText += text;
          textExtracted = true;
        }
        // Add space or newline based on positioning
        if (index < textContent.items.length - 1 && item.width && item.hasEOL) {
          pageText += '\n';
        } else if (index < textContent.items.length - 1) {
          pageText += ' ';
        }
      });
      
      console.log(`[pdfExtract.cjs] Page ${pageNum} - extracted text length:`, pageText.length);
      if (pageText.length > 0) {
        console.log(`[pdfExtract.cjs] Page ${pageNum} - text preview:`, pageText.substring(0, 150));
      }
      
      fullText += pageText + '\n';
    }
    
    console.log('[pdfExtract.cjs] Successfully extracted text from', pdf.numPages, 'pages');
    console.log('[pdfExtract.cjs] Total text length:', fullText.length);
    console.log('[pdfExtract.cjs] Text extracted:', textExtracted);
    if (fullText.length > 0) {
      console.log('[pdfExtract.cjs] Text preview (first 300 chars):', fullText.substring(0, 300));
    } else {
      console.warn('[pdfExtract.cjs] WARNING: No text extracted from PDF');
      console.warn('[pdfExtract.cjs] This PDF might be scanned or have text embedded as images');
    }
    
    // If no text was extracted, throw an error with helpful message
    if (!textExtracted || fullText.trim().length === 0) {
      throw new Error('No extractable text found in PDF. This might be a scanned PDF or an image-based PDF. Please ensure the PDF contains selectable text.');
    }
    
    return fullText;
  } catch (error) {
    console.error('[pdfExtract.cjs] pdfjs-dist extraction failed:', error.message);
    throw new Error(`Failed to extract PDF text using pdfjs-dist: ${error.message}`);
  }
}

module.exports = { extractPdfText };
