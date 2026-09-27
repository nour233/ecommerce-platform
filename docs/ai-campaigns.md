# Hosted AI Campaign Generator

Generation now uses Gemini from the Next.js server. Ollama and local model downloads are no longer required.

## Deploy

Add GEMINI_API_KEY in your hosting provider's server-side environment settings and redeploy. This is the same key used by Product Copilot. The optional GEMINI_CAMPAIGN_MODEL defaults to gemini-3.8-flash. Never expose the key with a NEXT_PUBLIC_ prefix. Your local .env.local is not automatically uploaded to Vercel.

Use a Google AI Studio project on the Free Tier to avoid API charges. Free usage is quota-limited. A key from a billed project may incur charges; the app cannot determine the billing tier. This integration does not enable billing and does not fall back to a paid provider. Pricing: https://ai.google.dev/gemini-api/docs/pricing

The campaign brief and up to 60 in-stock catalog candidates are sent to Google; no customer data is sent. Interactions history storage is disabled, but Google's free-tier data terms still apply. The request timeout is 50 seconds; allow at least 60 seconds on your hosting function.

## Workflow

Admin > AI Campaigns > Generate > Edit > Approve > Publish.

The AI creates a title, description, banner text, social caption and selection of up to six products. The banner uses existing product photos. Saving edits resets approval. Published campaigns appear on the storefront and /campaigns/{id}. Unpublish returns a campaign to draft. Social captions are copied manually, not posted automatically.

Campaigns persist in the existing DynamoDB table under partition CAMPAIGNS. Configure production DynamoDB credentials on your host. USE_MOCK_DB=true uses temporary memory and is unsuitable for durable hosting. All admin endpoints require an administrator; draft pages return 404 publicly. Product availability and versions are checked before publication.
