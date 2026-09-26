# CommerceCraft

CommerceCraft is a production-style full-stack e-commerce application built for a Software Engineering internship project. Customers can browse and search a responsive catalog, create an account, and manage a persistent cart and wishlist. The application uses a typed Next.js server layer and stores application data in AWS DynamoDB.

## Features

- Responsive homepage, category pages, product listing, and product detail pages
- Search, category and price filters, sorting, and related products
- User registration, login, logout, password hashing, and signed HTTP-only sessions
- Email verification with expiring one-time codes before account creation
- Password recovery by email with expiring, attempt-limited one-time codes
- Protected member profile with editable name, email, and password
- Role-based access control with a protected administration dashboard
- Admin CRUD for products and categories, plus user role and account management
- Persistent per-user cart with quantity updates, removal, stock validation, and subtotal calculation
- Persistent per-user wishlist with duplicate prevention
- Loading, empty, validation, API error, and not-found states
- Reusable TypeScript components and a separated service/repository architecture

## Tech Stack

- Frontend: Next.js 15, React 19, TypeScript
- Backend: Next.js Route Handlers, API routes, server actions, and server-side services
- Database: AWS DynamoDB with the AWS SDK for JavaScript v3
- Styling: Tailwind CSS
- Validation: Zod
- Version control: Git and GitHub

## Architecture

```text
User
  -> Next.js pages and React components
  -> Route Handlers (/api/*)
  -> validation and business services
  -> repositories
  -> AWS DynamoDB
```

The browser never accesses DynamoDB directly. Route Handlers validate incoming data and identify the authenticated user. Services apply business rules such as stock limits, subtotal calculation, and wishlist uniqueness. Repositories own all database access, keeping AWS-specific code out of UI and business logic.

## Project Structure

```text
scripts/
  setup-dynamodb.mjs       Create the AWS table and seed catalog data
src/
  app/                     Pages, loading/not-found states, and API routes
  components/              Reusable UI and client interaction components
  lib/
    data/                  Catalog seed data
    db/                    DynamoDB client and single-table keys
    repositories/          Database CRUD operations
    services/              Authentication, catalog, cart, and wishlist logic
    auth.ts                Password hashing and signed sessions
    mail.ts                SMTP delivery for registration and password reset codes
    validators.ts          Zod request schemas
  types/                   Shared domain interfaces
```

## DynamoDB Design

CommerceCraft uses one table named `CommerceCraft` by default. It has a string partition key named `pk` and a string sort key named `sk`. On-demand billing is used so no read/write capacity needs to be provisioned.

| Entity | Partition key (`pk`) | Sort key (`sk`) |
| --- | --- | --- |
| User | `USER#{sha256(normalizedEmail)}` | `PROFILE` |
| Email lookup | `EMAIL#{normalizedEmail}` | `USER` |
| Pending registration | `VERIFICATION#{sha256(normalizedEmail)}` | `REGISTRATION` |
| Pending password reset | `PASSWORD_RESET#{userId}` | `PASSWORD_RESET` |
| Product | `PRODUCTS` | `PRODUCT#{productId}` |
| Category | `CATEGORIES` | `CATEGORY#{categoryId}` |
| Cart item | `USER#{userId}` | `CART#{productId}` |
| Wishlist item | `USER#{userId}` | `WISHLIST#{productId}` |

### Access Patterns and CRUD

| Operation | DynamoDB access |
| --- | --- |
| Register/read a user | Conditional `PutItem` and `GetItem` using `USER#... / PROFILE` |
| Find or update a profile by email | `GetItem` using `EMAIL#... / LOOKUP`, then the stable user ID |
| Request/verify registration | `PutItem`, `GetItem`, and `DeleteItem` using `VERIFICATION#... / REGISTRATION` |
| Request/verify password reset | `PutItem`, `GetItem`, and `DeleteItem` using `PASSWORD_RESET#... / VERIFICATION` |
| List/read products | `Query` on `PRODUCTS`, or `GetItem` using the product sort key |
| List categories | `Query` on `CATEGORIES` |
| Read a user's cart | `Query` on `USER#{userId}` with sort-key prefix `CART#` |
| Add/update a cart item | `PutItem` at `USER#{userId} / CART#{productId}` |
| Remove a cart item | `DeleteItem` using the cart item's full key |
| Read a user's wishlist | `Query` with sort-key prefix `WISHLIST#` |
| Add a wishlist item | Conditional `PutItem`; the composite key prevents duplicates |
| Remove a wishlist item | `DeleteItem` using the wishlist item's full key |

Products are joined to cart and wishlist records in the service layer. User passwords are never stored in plain text; each password is hashed with Node.js `scrypt` and a unique random salt.

User profiles store a `role` of `customer` or `admin`. New registrations are customers. Admin pages and mutation APIs verify the role on the server, so hiding the dashboard link is not the security boundary. Administrator promotion is available through the following maintenance command:

```powershell
npm.cmd run admin:promote -- user@example.com
```

Pending registrations store only a password hash and an HMAC of the six-digit code. Password recovery records also store only an HMAC of the reset code. Codes expire after 10 minutes, verification is limited to five attempts, and AWS deployments enable DynamoDB TTL on `expiresAtEpoch` to clean up abandoned flows.

## Runtime Configuration

Local development uses DynamoDB Local through the AWS SDK, with persistent data stored in `.local/dynamodb`. The local environment uses `DYNAMODB_ENDPOINT=http://127.0.0.1:8000` and `USE_MOCK_DB=false`; Java and DynamoDB Local from NoSQL Workbench provide the local database runtime.

The relevant local commands are `npm.cmd run db:local`, `npm.cmd run db:setup`, and `npm.cmd run dev`. The setup script is idempotent: it creates the table when needed and seeds products and categories without removing existing users.

Cloud environments use AWS DynamoDB with `DYNAMODB_ENDPOINT` absent, an IAM identity restricted to the application table, and values from `.env.production.example`. Local and cloud databases are separate. The production database setup uses `ENV_FILE=.env.production.local` together with `npm.cmd run db:setup`.

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `AWS_REGION` | Yes | AWS region containing the table |
| `DYNAMODB_TABLE_NAME` | Yes | DynamoDB table name |
| `SESSION_SECRET` | Yes | Signs seven-day HTTP-only session cookies |
| `USE_MOCK_DB` | Yes | `false` for AWS DynamoDB; `true` is an optional offline development fallback |
| `SMTP_HOST` | Yes | SMTP server hostname |
| `SMTP_PORT` | Yes | SMTP port, usually `587` for STARTTLS or `465` for TLS |
| `SMTP_SECURE` | Yes | `true` for port `465`; otherwise `false` |
| `SMTP_USER` | Yes | SMTP account username |
| `SMTP_PASS` | Yes | SMTP password or provider app password |
| `MAIL_FROM` | Yes | Sender displayed on verification emails |
| `AWS_ACCESS_KEY_ID` | Host-dependent | Prefer the AWS CLI profile locally or the deployment platform's secret manager |
| `AWS_SECRET_ACCESS_KEY` | Host-dependent | Stored only in the local environment or deployment secret manager |

The AWS SDK uses its standard credential provider chain, so local AWS CLI profiles and IAM roles work without hardcoding keys.

## API Routes

| Method and route | Purpose |
| --- | --- |
| `POST /api/auth/register` | Validate registration details and email a verification code |
| `POST /api/auth/register/verify` | Verify the code, create the user, and create a session |
| `POST /api/auth/register/resend` | Send a replacement verification code |
| `POST /api/auth/login` | Authenticate and create a session |
| `POST /api/auth/logout` | Clear the session |
| Server Action `logoutAction` | Clear the session through the logout form without a client-side API call |
| `GET /api/auth/session` | Read the current session user |
| `POST /api/auth/password-reset/request` | Email a password recovery code without exposing account existence |
| `POST /api/auth/password-reset/confirm` | Verify the recovery code and replace the password |
| `GET /api/products` | Search, filter, sort, and list products |
| `GET /api/products/:id` | Read one product |
| `GET /api/categories` | List categories |
| `GET /api/users/current` | Read the authenticated user |
| `PATCH /api/users/current` | Update the authenticated user's name or email |
| `PATCH /api/users/current/password` | Change the password after verifying the current password |
| `POST /api/admin/products` | Admin: create a product |
| `PATCH`, `DELETE /api/admin/products/:id` | Admin: update or delete a product |
| `POST /api/admin/categories` | Admin: create a category |
| `PATCH`, `DELETE /api/admin/categories/:id` | Admin: update or delete a category |
| `PATCH`, `DELETE /api/admin/users/:id` | Admin: change a role or delete an account |
| `GET`, `POST /api/cart` | Read the cart or add an item |
| `PATCH`, `DELETE /api/cart/:productId` | Update quantity or remove an item |
| `GET`, `POST /api/wishlist` | Read the wishlist or add an item |
| `DELETE /api/wishlist/:productId` | Remove a wishlist item |

API responses use a consistent `{ data }` success shape and structured `{ error, code }` failures. Zod validates important request data. Authentication, malformed JSON, stock conflicts, missing records, and DynamoDB availability are handled with suitable HTTP status codes.

## Quality Checks

```bash
npm run typecheck
npm run build
```

## Screenshots

The application includes the following main views:

- Responsive homepage with featured collections and products
- Product catalog with dynamic search, category, price, and sort filters
- Product detail page with stock, tags, cart actions, wishlist actions, and related products
- Authenticated cart with quantity management and calculated subtotal
- Authenticated wishlist with persistent saved products

## Deployment

The production topology is Vercel for the Next.js runtime and AWS DynamoDB for persistent data. Vercel receives the production environment variables `AWS_REGION`, `DYNAMODB_TABLE_NAME`, `USE_MOCK_DB`, `SESSION_SECRET`, `SMTP_*`, `MAIL_FROM`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`; `DYNAMODB_ENDPOINT` remains absent because localhost is only available during local development.

The cloud table is created and seeded by `npm.cmd run db:setup` with the production environment file. DynamoDB TTL cleans up expired email-verification and password-recovery records. Deployments are produced from the `main` branch of the GitHub repository.

The repository contains the application source code, technical documentation, and deployment configuration.
