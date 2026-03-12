import axios from 'axios';

const WINSTON_API_KEY = process.env.WINSTON_API_KEY;
const BASE_URL = 'https://api.gowinston.ai/v2';

function getAuthHeaders() {
  if (!WINSTON_API_KEY) {
    throw new Error('WINSTON_API_KEY is not configured in environment variables');
  }
  return {
    Authorization: `Bearer ${WINSTON_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

export async function detectAIContent(text) {
  const url = `${BASE_URL}/ai-content-detection`;
  
  // Validate input
  if (!text) {
    throw new Error('Text is required for AI content detection');
  }
  if (typeof text !== 'string') {
    throw new Error('Text must be a string');
  }
  if (text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }
  // Winston API requires at least 300 characters
  if (text.trim().length < 300) {
    throw new Error(`Text too short: Winston AI requires at least 300 characters. Your document has ${text.trim().length} characters.`);
  }
  
  const body = {
    text,
    version: 'latest',
    sentences: true,
    language: 'auto',
  };
  
  console.log('[Winston AI] Sending detectAIContent request...');
  console.log('[Winston AI] Text length:', text.length);
  console.log('[Winston AI] URL:', url);
  
  try {
    const { data } = await axios.post(url, body, { headers: getAuthHeaders() });
    console.log('[Winston AI] detectAIContent success');
    return data;
  } catch (error) {
    if (error.response) {
      console.error('[Winston AI] detectAIContent error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
      throw new Error(`Winston API returned ${error.response.status}: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error('[Winston AI] detectAIContent no response from server:', error.request);
      throw new Error('No response received from Winston API');
    } else {
      console.error('[Winston AI] detectAIContent error:', error.message);
      throw error;
    }
  }
}

export async function checkPlagiarism(text, excluded_sources = [], language = 'auto', country = 'us') {
  const url = `${BASE_URL}/plagiarism`;
  const body = {
    text,
    excluded_sources,
    language,
    country,
  };
  const { data } = await axios.post(url, body, { headers: getAuthHeaders() });
  return data;
}

export async function compareTexts(first_text, second_text) {
  const url = `${BASE_URL}/text-compare`;
  
  // Validate inputs
  if (!first_text || !second_text) {
    throw new Error('Both first_text and second_text are required');
  }
  if (typeof first_text !== 'string' || typeof second_text !== 'string') {
    throw new Error('Both texts must be strings');
  }
  if (first_text.trim().length === 0 || second_text.trim().length === 0) {
    throw new Error('Both texts must be non-empty');
  }
  
  const body = {
    first_text,
    second_text,
  };
  
  console.log('[Winston AI] Sending compareTexts request...');
  console.log('[Winston AI] First text length:', first_text.length);
  console.log('[Winston AI] Second text length:', second_text.length);
  
  try {
    const { data } = await axios.post(url, body, { headers: getAuthHeaders() });
    console.log('[Winston AI] compareTexts success');
    return data;
  } catch (error) {
    if (error.response) {
      console.error('[Winston AI] compareTexts error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
      throw new Error(`Winston API returned ${error.response.status}: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error('[Winston AI] compareTexts error:', error.message);
      throw error;
    }
  }
}
