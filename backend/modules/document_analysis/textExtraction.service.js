import mammoth from 'mammoth';
import path from 'path';
import fs from 'fs/promises';
import { extractPdfText } from './pdfExtract.cjs';

// Normalize text: remove excessive whitespace, formatting chars, collapse newlines
function normalizeText(raw) {
  return raw
    .replace(/\r/g, '')
    .replace(/\n{2,}/g, '\n')
    .replace(/[\t ]+/g, ' ')
    .replace(/ +/g, ' ')
    .trim();
}

export async function extractTextFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  let rawText = '';
  
  try {
    console.log(`[TextExtraction] Extracting text from file: ${filePath} (extension: ${ext})`);
    if (ext === '.pdf') {
      // Use the CommonJS pdfExtract module which reliably handles pdf-parse
      rawText = await extractPdfText(filePath);
      console.log(`[TextExtraction] PDF extraction complete. Raw text length: ${rawText.length}`);
    } else if (ext === '.docx') {
      const buffer = await fs.readFile(filePath);
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value;
      console.log(`[TextExtraction] DOCX extraction complete. Raw text length: ${rawText.length}`);
    } else {
      throw new Error('Unsupported file type. Only PDF and DOCX are supported.');
    }
  } catch (error) {
    console.error(`Error extracting text from ${filePath}:`, error);
    throw error;
  }
  
  const normalized = normalizeText(rawText);
  console.log(`[TextExtraction] After normalization. Text length: ${normalized.length}`);
  if (normalized.length > 0) {
    console.log(`[TextExtraction] Normalized text preview (first 200 chars):`, normalized.substring(0, 200));
  } else {
    console.warn(`[TextExtraction] WARNING: Normalized text is empty!`);
  }
  return normalized;
}


