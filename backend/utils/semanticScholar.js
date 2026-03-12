import axios from 'axios';

const EXA_API_KEY = process.env.EXA_API_KEY;

/**
 * Search for research papers using Exa AI API
 * @param {string} query - The search query
 * @returns {Promise<Array>} - List of research paper results
 */
export async function recommendPapers(query) {
  const response = await axios.post(
    'https://api.exa.ai/search',
    {
      query,
      category: 'research paper',
      type: 'auto',
      num_results: 10,
      contents: {
        text: {
          max_characters: 20000
        }
      }
    },
    {
      headers: {
        'x-api-key': EXA_API_KEY,
        'Content-Type': 'application/json'
      }
    }
  );
  // Exa returns results in response.data.results
  return response.data.results || [];
}
