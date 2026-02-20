import { ImageAnnotatorClient } from '@google-cloud/vision';

let visionClient: ImageAnnotatorClient | null = null;

export function getVisionClient(): ImageAnnotatorClient {
  if (visionClient) {
    return visionClient;
  }

  // Try service account first
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    visionClient = new ImageAnnotatorClient();
    return visionClient;
  }

  // Fallback to API key if available
  if (process.env.GOOGLE_VISION_API_KEY) {
    visionClient = new ImageAnnotatorClient({
      apiKey: process.env.GOOGLE_VISION_API_KEY,
    });
    return visionClient;
  }

  throw new Error(
    'Google Vision API credentials not found. Set either GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_VISION_API_KEY'
  );
}

// Alternative: Use REST API with API key (simpler for MVP)
export async function detectTextWithAPIKey(imageBase64: string): Promise<string> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_VISION_API_KEY is not set');
  }

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: imageBase64,
            },
            features: [
              {
                type: 'TEXT_DETECTION',
                maxResults: 10,
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Vision API error: ${error}`);
  }

  const data = await response.json();
  const textAnnotations = data.responses[0]?.textAnnotations || [];
  
  if (textAnnotations.length === 0) {
    return '';
  }

  // First annotation contains all detected text
  return textAnnotations[0].description || '';
}
