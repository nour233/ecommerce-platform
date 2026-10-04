# CommerceCraft

[Live dashboard](https://ecommerce-platform-six-mauve.vercel.app/admin) · [Storefront](https://ecommerce-platform-six-mauve.vercel.app/)

## Project Overview

CommerceCraft is a full-stack e-commerce application. Visitors can browse a catalog, search and filter products, create an account with email verification, manage a cart and wishlist, and access administration features according to their role.

## Features

- Responsive interface for mobile, tablet, and desktop, with featured collections and products
- Categories, product catalog, product details, and related products
- Dynamic search, category and price filters, and product sorting
- Registration, login, logout, and signed sessions
- Six-digit email verification before account creation
- Email-based password recovery
- Editable user profile
- Persistent cart with quantity controls, stock validation, and subtotal calculation
- Digital receipt QR code in the cart that opens a dedicated receipt page with the cart reference, total, and item count
- Persistent wishlist with duplicate prevention
- Administrator dashboard with product, category, user, cart, and wishlist management
- Claude-powered AI Store Auditor that turns inventory, cart, wishlist, and catalog-quality signals into actionable priorities, with a downloadable visual PDF report
- Claude-powered AI Product Copilot that prepares editable catalog details from an image while keeping the merchant in control of the final save
- Claude-powered AI Campaign Generator with draft, review, edit, approval, and publication stages. See [setup and workflow](docs/ai-campaigns.md).
- Claude-powered Storefront AI Shopping Stylist and product-guidance chatbot, both grounded in available catalog items
- Loading, empty, validation, error, and not-found states

## Admin Dashboard Coverage

| Requirement | Implementation |
| --- | --- |
| Dashboard overview | Live totals for products, categories, users, cart activity, wishlist saves, inventory value, and AI-driven store signals |
| Product management | Create, browse, search, filter, paginate, edit, delete, update stock including zero, upload an image, and generate editable AI product details |
| Category management | Create, browse, search, edit, delete, and inspect the products assigned to each category |
| User management | Browse and filter users; view profile, role, cart, wishlist, and related products; edit account data or remove an account |
| Cart and wishlist | Customer-level cart quantities, subtotal, saved products, and product relationships are visible from the customer detail view |
| Safe operations | Zod validation, role checks, error responses, loading states, empty states, and confirmation prompts before destructive actions |
| Responsive interface | Tailwind layouts adapt from mobile to desktop; admin data panels and editors retain usable spacing at narrow widths |

## Technologies Used

### Frontend

- Next.js 15
- React 19
- TypeScript

### Backend

- Next.js Route Handlers
- API Routes
- Server Actions
- Server-side business services

### Database

- AWS DynamoDB
- AWS SDK for JavaScript v3

### Styling

- Tailwind CSS

### Source Control

- Git
- GitHub

## Project Structure

```text
scripts/
  setup-dynamodb.mjs       Table creation and catalog seeding
src/
  app/
    actions/               Server Actions
    api/                   Route Handlers and API endpoints
    ...                    Pages, loading, error, and not-found states
  components/              Reusable UI components
  lib/
    data/                  Catalog seed data
    db/                    DynamoDB client and key definitions
    repositories/          DynamoDB CRUD operations
    services/              Business logic
    api.ts, auth.ts        Authorization and sessions
    env.ts, errors.ts      Configuration and error handling
    mail.ts                Email delivery
    validators.ts          Zod validation schemas
  types/                   Shared types and interfaces
```

## Architecture

```text
User
  -> Next.js application and React UI components
  -> Server pages, Server Actions, and API Route Handlers
  -> Validation and business services
  -> Repositories
  -> AWS DynamoDB
```

UI components never access DynamoDB directly. Services apply business rules, repositories isolate database operations, and shared types and utilities keep application behavior consistent. All AI-provider calls also stay in the server layer; browser code never receives provider credentials.

## DynamoDB Configuration

The application uses one DynamoDB table named `CommerceCraft`, with `pk` and `sk` as primary key attributes.

| Data | Partition key | Sort key |
| --- | --- | --- |
| User | `USER#{userId}` | `PROFILE` |
| Product | `PRODUCTS` | `PRODUCT#{productId}` |
| Category | `CATEGORIES` | `CATEGORY#{categoryId}` |
| Cart item | `USER#{userId}` | `CART#{productId}` |
| Wishlist item | `USER#{userId}` | `WISHLIST#{productId}` |

Repositories provide read, create, update, and delete operations. Cart and wishlist records are isolated by user. DynamoDB conditional writes prevent duplicate wishlist items.

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `AWS_REGION` | AWS region containing the DynamoDB table |
| `DYNAMODB_TABLE_NAME` | DynamoDB table name |
| `DYNAMODB_ENDPOINT` | Leave unset so local and hosted environments use the shared AWS table |
| `USE_MOCK_DB` | Optional local in-memory storage switch |
| `SESSION_SECRET` | Session cookie signing secret |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP server port |
| `SMTP_SECURE` | SMTP TLS mode |
| `SMTP_USER` | SMTP account |
| `SMTP_PASS` | SMTP password or app password |
| `MAIL_FROM` | Sender email address |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name used for image uploads |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Unsigned Cloudinary upload preset used by the admin dashboard |
| `ANTHROPIC_API_KEY` | Claude API key used server-side for text and vision AI features. |
| `ANTHROPIC_TEXT_MODEL` | Optional Claude text model override (defaults to `claude-haiku-4-5-20251001`) |
| `ANTHROPIC_VISION_MODEL` | Optional Claude vision model override (defaults to `claude-haiku-4-5-20251001`) |
| `GROQ_API_KEY` | Optional Groq text-model fallback when Claude is unavailable |
| `GROQ_TEXT_MODEL` | Optional Groq text model override (defaults to `qwen/qwen3.8-27b`) |
| `GROQ_VISION_MODEL` | Optional Groq vision model override (defaults to `qwen/qwen3.8-27b`) |
| `AWS_ACCESS_KEY_ID` | AWS access key for cloud environments |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for cloud environments |

Secrets are stored in `.env*.local` files or in the hosting provider's secret manager. Local environment files are ignored by Git. Do not commit AWS, email, or AI-provider credentials.

## Installation Instructions

```powershell
npm install
npm test
npm.cmd run dev
```

`npm test` runs six automated checks for cart and wishlist behavior as well as important data-validation rules.

The local application runs at `http://localhost:3000`. Configure the same AWS DynamoDB table and SMTP variables locally and in Vercel; this keeps accounts, carts, wishlists, password recovery, and reviews consistent across both environments.

## Final Application Screenshots


### Homepage

![Homepage](public/screenshots/home.jpg)


### Chatbot conversation


![Chatbot conversation](public/screenshots/chatbot-conversation.jpg)

### Product catalog

![Product catalog](public/screenshots/products.jpg)

### Search suggestions

![Search suggestions](public/screenshots/search.jpg)

### Product details

![Product details](public/screenshots/product-details.jpg)

### AI Shopping Stylist

![AI Shopping Stylist product set](public/screenshots/shopping-stylist.jpg)

### Mobile catalog

![Mobile catalog](public/screenshots/mobile-catalog.jpg)

### Shopping cart

![Shopping cart](public/screenshots/cart.jpg)

### Wishlist

![Wishlist](public/screenshots/wishlist.jpg)

### Administration dashboard

![Administration dashboard](public/screenshots/admin.jpg)


### Admin products

![Admin products](public/screenshots/admin-products.jpg)


### AI Product Copilot

![AI Product Copilot](public/screenshots/ai-product-copilot.jpg)



### Admin categories
![Admin categories](public/screenshots/admin-categories.jpg)

### AI Campaigns

![AI Campaigns](public/screenshots/ai-campaigns.png)





### Admin customers
![Admin customers](public/screenshots/admin-customers.jpg)

