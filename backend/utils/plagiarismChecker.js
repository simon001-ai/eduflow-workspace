import mammoth from 'mammoth';
let pdfParse;
import Hooke from 'hookejs';
import dotenv from 'dotenv';
dotenv.config();

async function extractTextFromBuffer(fileBuffer, filename) {
  if (filename.endsWith('.pdf')) {
    if (!pdfParse) {
      pdfParse = (await import('pdf-parse')).default;
    }
    const data = await pdfParse(fileBuffer);
    return data.text;
  } else if (filename.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return result.value;
  } else {
    throw new Error('Unsupported file type. Only PDF and DOCX are supported.');
  }
}

async function checkPlagiarism(fileBuffer, filename) {
  const text = await extractTextFromBuffer(fileBuffer, filename);
  if (!text || text.length < 100) throw new Error('Document text too short for plagiarism analysis.');

  // Debug: log the first 100 chars of the text
  console.log('Checking text with HookeJs:', text.slice(0, 100));

  // Initialize HookeJs with Google Custom Search API config
  const hooke = new Hooke({
    google: {
      apiKey: process.env.G_API_KEY,
      engineId: process.env.G_ENGINE_ID,
    }
  });

  let result;
  try {
    result = await hooke.check(text);
    console.log('HookeJs result:', result);
  } catch (err) {
    console.error('HookeJs error:', err);
    throw err;
  }

  return {
    percentage: result.score,
    matches: result.matches,
  };
}

export { checkPlagiarism as submitDocumentForAnalysis };