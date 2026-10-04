# Hosted AI Campaign Generator

Campaign generation runs in the Next.js server layer. Claude powers generation through the server-side `ANTHROPIC_API_KEY`; Groq can be configured only as a secure fallback. Local model downloads are not required.

## Deploy

Configure `ANTHROPIC_API_KEY` in the hosting provider's server-side environment settings and redeploy. `GROQ_API_KEY` is optional as a fallback. Never expose a provider key with a `NEXT_PUBLIC_` prefix. Your local `.env.local` file is not automatically uploaded to Vercel.

The campaign brief and up to 60 in-stock catalog candidates are sent to the configured provider. Customer names, email addresses, and other personal data are excluded. The request timeout is 50 seconds; allow at least 60 seconds on the hosting function.

## Workflow

Admin > AI Campaigns > Generate > Edit > Approve > Publish.

The AI creates a title, description, banner text, social caption and selection of up to six products. The banner uses existing product photos. Saving edits resets approval. Published campaigns appear on the storefront and /campaigns/{id}. Unpublish returns a campaign to draft. Social captions are copied manually, not posted automatically.

Campaigns persist in the existing DynamoDB table under partition CAMPAIGNS. Configure production DynamoDB credentials on your host. USE_MOCK_DB=true uses temporary memory and is unsuitable for durable hosting. All admin endpoints require an administrator; draft pages return 404 publicly. Product availability and versions are checked before publication.
