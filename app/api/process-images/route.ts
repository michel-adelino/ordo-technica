import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { openai, hasOpenAIKey, USE_MOCK_DATA } from '@/lib/openai';
import { detectTextWithAPIKey } from '@/lib/vision';
import { fileToBase64 } from '@/lib/utils';
import {
  canCreateListing,
  incrementListingCount,
  initializeTrial,
} from '@/lib/subscription';

interface ProcessingResult {
  mlsDescription: string;
  hashtags: string[];
  socialCaption: string;
  carouselText: string;
  ocrText?: string; // Google Vision OCR extracted text
  isRealOCR?: boolean; // Flag to indicate if OCR is from real API
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize trial for new users
    await initializeTrial(userId);

    // Check if user can create listing (subscription/paywall check)
    const accessCheck = await canCreateListing(userId);
    if (!accessCheck.allowed) {
      return NextResponse.json(
        {
          error: accessCheck.reason || 'Subscription required',
          requiresSubscription: true,
        },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      );
    }

    if (files.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 images allowed' },
        { status: 400 }
      );
    }

    // Convert images to base64
    const imageBase64Array = await Promise.all(
      files.map((file) => fileToBase64(file))
    );

    // Step 1: Extract text from all images using Google Vision OCR
    // IMPORTANT: Always use REAL Google Vision API if key is available, even when USE_MOCK_DATA=true
    // This allows clients to see real OCR results while testing with mock OpenAI data
    let extractedText = '';
    let isRealOCR = false;
    let ocrTextForDisplay = '';
    
    if (process.env.GOOGLE_VISION_API_KEY) {
      try {
        console.log('✅ Using REAL Google Vision API for OCR (even in mock mode)');
        const textPromises = imageBase64Array.map((base64) =>
          detectTextWithAPIKey(base64).catch((err) => {
            console.error('Individual OCR error:', err);
            return '';
          })
        );
        const texts = await Promise.all(textPromises);
        extractedText = texts
          .filter((text) => text.trim().length > 0)
          .join('\n\n');
        
        ocrTextForDisplay = extractedText; // Store for display
        
        if (!extractedText) {
          extractedText = 'No text detected in images.';
          ocrTextForDisplay = 'No text detected in images by Google Vision OCR.';
        } else {
          isRealOCR = true;
        }
      } catch (error) {
        console.error('Google Vision OCR error:', error);
        extractedText = 'No text detected in images.';
        ocrTextForDisplay = 'Error processing images with Google Vision OCR.';
      }
    } else {
      // Dummy extracted text for testing
      console.log('⚠️  Google Vision API key not set - using dummy OCR text');
      extractedText = `Property Details:
- Square Footage: Approximately 2,500 sq ft
- Bedrooms: 4
- Bathrooms: 2.5
- Year Built: 2015
- Lot Size: 0.25 acres

Features:
- Two-car garage
- Central air conditioning
- Hardwood floors
- Updated kitchen and bathrooms
- Energy-efficient windows`;
      ocrTextForDisplay = extractedText;
      isRealOCR = false;
    }

    // Step 2: Analyze visuals with GPT-4o-vision
    let visualAnalysis = '';
    if (USE_MOCK_DATA || !hasOpenAIKey || !openai) {
      // Dummy visual analysis for testing
      console.log('⚠️  OpenAI API key not set - using dummy visual analysis');
      visualAnalysis = `Interior Features:
- Modern kitchen with granite countertops and stainless steel appliances
- Hardwood flooring throughout main living areas
- Updated bathrooms with contemporary fixtures
- Spacious bedrooms with ample natural light
- Open floor plan connecting living, dining, and kitchen areas

Exterior Features:
- Well-maintained landscaping with mature trees
- Attached garage with driveway
- Covered front porch
- Backyard with patio area perfect for entertaining

Special Features:
- Vaulted ceilings in main living area
- Fireplace in family room
- Walk-in closets in master bedroom
- Energy-efficient windows
- Updated electrical and plumbing systems`;
    } else {
      try {
        const visionMessages = imageBase64Array.map((base64) => ({
          type: 'image_url' as const,
          image_url: {
            url: `data:image/jpeg;base64,${base64}`,
          },
        }));

        // Add timeout wrapper for vision API call
        const visionPromise = openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are a real estate expert analyzing property photos. Identify and describe:
- Interior features: countertops (granite, quartz, marble), flooring (hardwood, tile, carpet), cabinetry, appliances
- Exterior features: pool, deck, patio, landscaping, architectural style
- Room types: kitchen, bathroom, bedroom, living room, dining room
- Special features: fireplace, vaulted ceilings, skylights, built-ins
- Overall condition and quality
Be specific and professional.`,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Analyze these property photos and list all visible features, upgrades, and amenities. Focus on high-value features that would appeal to buyers.',
                },
                ...visionMessages,
              ],
            },
          ],
          max_tokens: 1000,
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Vision analysis timeout')), 30000)
        );

        const visionResponse = await Promise.race([visionPromise, timeoutPromise]) as Awaited<ReturnType<typeof visionPromise>>;
        visualAnalysis = visionResponse.choices[0]?.message?.content || '';
      } catch (error) {
        console.error('GPT-4o-vision error:', error);
        visualAnalysis = 'Unable to analyze visual features.';
      }
    }

    // Step 3: Generate MLS description, hashtags, and social captions
    const combinedContext = `
EXTRACTED TEXT FROM DOCUMENTS/IMAGES:
${extractedText}

VISUAL FEATURES IDENTIFIED:
${visualAnalysis}
`.trim();

    let result: ProcessingResult;

    if (USE_MOCK_DATA || !hasOpenAIKey || !openai) {
      // Generate dummy/mock data for testing
      console.log('⚠️  OpenAI API key not set - using dummy listing content');
      
      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      result = {
        mlsDescription: `Welcome to this stunning property that offers the perfect blend of comfort and style. This beautifully maintained home features ${files.length} thoughtfully designed spaces that create an inviting atmosphere for modern living.

The interior showcases high-quality finishes throughout, including updated flooring, contemporary fixtures, and an open floor plan that maximizes natural light. The kitchen is a chef's dream with modern appliances and ample counter space, perfect for entertaining guests or preparing family meals.

The property includes well-appointed bedrooms that provide comfortable retreats, along with updated bathrooms featuring quality fixtures and finishes. The living areas flow seamlessly, creating an ideal environment for both relaxation and entertaining.

Exterior features include attractive landscaping, outdoor living spaces, and a layout that maximizes both privacy and functionality. This home represents an excellent opportunity for those seeking a move-in-ready property with modern amenities and timeless appeal.

Located in a desirable area, this property offers convenient access to local amenities, schools, and transportation. Don't miss the chance to make this exceptional property your new home. Schedule a showing today to experience all that this wonderful property has to offer.`,
        hashtags: ['#RealEstate', '#HomeForSale', '#PropertyListing', '#DreamHome', '#NewListing'],
        socialCaption: `🏡 Beautiful property now available! This stunning home features modern updates, spacious living areas, and incredible attention to detail. Perfect for families or anyone looking for their next dream home. Contact us today to schedule a viewing! ✨ #RealEstate #HomeForSale`,
        carouselText: `Photo 1: Stunning exterior view showcasing the property's curb appeal and attractive landscaping.\nPhoto 2: Spacious living area with an open floor plan and abundant natural light.\nPhoto 3: Modern kitchen featuring updated appliances and quality finishes.\nPhoto 4: Comfortable bedroom with ample space and natural lighting.\nPhoto 5: Well-maintained outdoor space perfect for relaxation and entertaining.`,
        ocrText: ocrTextForDisplay,
        isRealOCR: isRealOCR,
      };
    } else {
      try {
        const generationPromise = openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a professional real estate copywriter. Generate compelling, accurate listing content based on property information and photos.

Generate:
1. MLS Listing Description (200-300 words): Professional, detailed, highlights key features and amenities. Use proper real estate terminology. No emojis.
2. 5 Targeted Hashtags: Relevant to the property type, location features, and target buyers. No spaces, use camelCase or underscores.
3. Facebook/Instagram Caption: Engaging, social media friendly, includes call-to-action. 2-3 sentences max. Can include emojis.
4. Carousel Text: Brief text for each photo in a carousel post. One sentence per photo, highlighting what's shown.

Return ONLY valid JSON in this exact format:
{
  "mlsDescription": "Full MLS description text here...",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"],
  "socialCaption": "Engaging caption text here...",
  "carouselText": "Brief text for carousel post here..."
}`,
            },
            {
              role: 'user',
              content: `Based on the following property information, generate the MLS listing description, hashtags, and social media content:\n\n${combinedContext}`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 1500,
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Content generation timeout')), 45000)
        );

        const generationResponse = await Promise.race([generationPromise, timeoutPromise]) as Awaited<ReturnType<typeof generationPromise>>;

        const content = generationResponse.choices[0]?.message?.content;
        if (!content) {
          throw new Error('No content generated');
        }

        try {
          result = JSON.parse(content);
        } catch (parseError) {
          console.error('Failed to parse AI response:', parseError);
          throw new Error('Invalid response format from AI service');
        }

        // Validate required fields
        if (!result.mlsDescription || !result.socialCaption || !result.carouselText) {
          throw new Error('Incomplete response from AI service');
        }

        // Validate and clean up hashtags
        if (result.hashtags && Array.isArray(result.hashtags)) {
          result.hashtags = result.hashtags
            .slice(0, 5)
            .map((tag) => {
              const cleaned = String(tag).trim();
              return cleaned.startsWith('#') ? cleaned : `#${cleaned}`;
            })
            .filter((tag) => tag.length > 1); // Remove empty hashtags
        } else {
          result.hashtags = [];
        }

        // Ensure we have at least some hashtags
        if (result.hashtags.length === 0) {
          result.hashtags = ['#RealEstate', '#Property', '#Home', '#Listing', '#ForSale'];
        }
        
        // Add OCR text to result
        result.ocrText = ocrTextForDisplay;
        result.isRealOCR = isRealOCR;
      } catch (error) {
        console.error('GPT-4o-mini generation error:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to generate listing content';
        return NextResponse.json(
          { error: errorMessage },
          { status: 500 }
        );
      }
    }

    // Increment listing count after successful processing
    await incrementListingCount(userId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Processing error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
