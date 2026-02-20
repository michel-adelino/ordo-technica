import OpenAI from 'openai';

// Check if we should use mock data (force mock mode or no API key)
export const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true' || !process.env.OPENAI_API_KEY;

// Only create OpenAI client if API key is available and not forcing mock mode
export const openai = !USE_MOCK_DATA && process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export const hasOpenAIKey = !USE_MOCK_DATA && !!process.env.OPENAI_API_KEY;
