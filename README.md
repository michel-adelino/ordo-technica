# Ordo Technica

AI-powered real estate listing generator. Upload property photos and get professional MLS descriptions, hashtags, and social media captions in seconds.

## Features

- **Photo Upload**: Drag-and-drop interface for up to 5 property photos (mobile-friendly)
- **AI Analysis**: 
  - Google Vision OCR extracts text from documents/floorplans
  - GPT-4o-vision analyzes visual features (granite counters, hardwood floors, pools, etc.)
  - GPT-4o-mini generates professional listing content
- **Output**: 
  - MLS listing description (200-300 words)
  - 5 targeted hashtags
  - Facebook/Instagram caption
  - Carousel post text
- **One-Click Copy**: Copy any section to clipboard instantly
- **Authentication**: Secure user authentication with Clerk
- **Subscription Management**: 
  - 2 free listings for new users
  - $39/month subscription for unlimited listings
  - Stripe-powered payment processing
- **Mobile-First**: Optimized for iOS and Android web browsers

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Authentication**: Clerk
- **Payments**: Stripe (subscriptions)
- **AI Services**: OpenAI (GPT-4o, GPT-4o-mini), Google Cloud Vision API
- **Styling**: Tailwind CSS
- **File Upload**: react-dropzone
- **Notifications**: react-hot-toast

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Clerk account (for authentication)
- Stripe account (for payments)
- OpenAI API key
- Google Cloud Vision API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ordo-technica
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `env.example` to `.env.local`
   - Fill in your API keys:
```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# OpenAI
OPENAI_API_KEY=sk-...

# Google Vision
GOOGLE_VISION_API_KEY=...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

   **Stripe Setup:**
   1. Create a Stripe account at https://stripe.com
   2. Get your API keys from Stripe Dashboard → Developers → API keys
   3. Copy Secret Key to `STRIPE_SECRET_KEY` and Publishable Key to `STRIPE_PUBLISHABLE_KEY`
   4. The subscription price ($39/month) is configured in code - no price ID needed
   5. Subscription status is synced directly from Stripe API (no webhooks required)

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
├── (auth)/              # Authentication pages
│   ├── sign-in/
│   └── sign-up/
├── dashboard/           # Main upload interface
├── results/             # Results display page
├── pricing/             # Subscription/pricing page
└── api/
    ├── process-images/  # Image processing endpoint
    └── stripe/          # Stripe API routes
        ├── checkout/    # Create checkout session
        ├── sync-subscription/  # Sync subscription after checkout
        └── subscription-status/  # Get subscription status (queries Stripe directly)
components/
├── PhotoUpload.tsx      # Photo upload component
├── ProcessingStatus.tsx # Loading states
├── ResultsDisplay.tsx   # Results display
└── CopyButton.tsx       # Clipboard functionality
lib/
├── clerk.ts            # Clerk client
├── openai.ts           # OpenAI client
├── vision.ts           # Google Vision client
└── utils.ts            # Utility functions
```

## Usage

1. **Sign Up/Sign In**: Create an account or sign in with Clerk
2. **Upload Photos**: Upload up to 5 property photos (drag-drop or click to select)
3. **Generate**: Click "Generate Listing Content" and wait ~15 seconds
4. **Copy & Use**: Copy each section (MLS description, hashtags, captions) to your clipboard

## API Endpoints

### POST `/api/process-images`
Processes uploaded images and generates listing content.

**Request**: FormData with `images` field (File[])
**Response**: 
```json
{
  "mlsDescription": "...",
  "hashtags": ["#hashtag1", ...],
  "socialCaption": "...",
  "carouselText": "..."
}
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

The app is optimized for Vercel deployment with Next.js App Router.

## Environment Variables

See `.env.local.example` for all required environment variables.

## License

Proprietary - All rights reserved. Ordo Technica LLC.
