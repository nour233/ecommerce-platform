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

User profiles store a `role` of `customer` or `admin`. New registrations are customers. Admin pages and mutation APIs verify the role on the server, so hiding the dashboard link is not the security boundary. To bootstrap an administrator after registration, run:

```powershell
npm.cmd run admin:promote -- user@example.com
```

Pending registrations store only a password hash and an HMAC of the six-digit code. Password recovery records also store only an HMAC of the reset code. Codes expire after 10 minutes, verification is limited to five attempts, and AWS deployments enable DynamoDB TTL on `expiresAtEpoch` to clean up abandoned flows.

## Local Development with NoSQL Workbench

Use DynamoDB Local for development on Windows. This uses the DynamoDB SDK and
database records, not the in-memory mock store.

Set DYNAMODB_ENDPOINT=http://127.0.0.1:8000 and USE_MOCK_DB=false in .env.local.
Start the database with `npm.cmd run db:local` in one terminal. Java and Workbench
with DynamoDB Local must be installed. If Workbench already runs a database on
port 8000, use that instance instead of starting another one.

This command stores persistent data in .local/dynamodb (ignored by Git), uses a
shared database, and finds Java in JAVA_HOME, PATH, or an installed JetBrains
runtime. Set DYNAMODB_LOCAL_JAR for a custom Workbench installation path.
Keep the database terminal open. In a second terminal run `npm.cmd run db:setup`
once to initialize the catalog, then `npm.cmd run dev`. Open http://localhost:3000.
Re-running setup overwrites seeded catalog records but does not delete users.

To view data: Workbench -> Operation builder -> Add connection -> Local ->
port 8000 -> Connect -> Open -> CommerceCraft. The Models area is for designing
models; use Operation builder to see live records. Users, cart and wishlist
records appear when you register and use the site.

For AWS deployment, remove DYNAMODB_ENDPOINT and configure an AWS identity using
the instructions below. Local and cloud databases are separate; local records
are not automatically uploaded to AWS.

## AWS DynamoDB Setup

Prerequisites: Node.js 20 or newer, an AWS account, AWS CLI credentials with DynamoDB permissions, and npm.

1. Configure your AWS credentials locally. Do not put real credentials in Git.

```bash
aws configure
```

2. Create a production-only environment file. It is ignored by Git and keeps the
cloud settings separate from DynamoDB Local.

```powershell
Copy-Item .env.production.example .env.production.local
```

3. Replace `SESSION_SECRET` in `.env.production.local` with a long random value.
Keep `USE_MOCK_DB=false` and leave `DYNAMODB_ENDPOINT` absent for AWS.

4. Configure the AWS access key values plus `SMTP_*` and `MAIL_FROM` in
`.env.production.local`. Registration creates an account only after the user
enters the six-digit code delivered by email.

5. Install dependencies, create the table, and seed products and categories.

```bash
npm install
$env:ENV_FILE = ".env.production.local"
npm.cmd run db:setup
```

`db:setup` is idempotent: it reuses the table if it already exists and safely writes the catalog seed records.

6. Start the application.

```bash
npm run dev
```

Open `http://localhost:3000` and register a new account. That user, their cart, and their wishlist will be stored in DynamoDB.

On Windows PowerShell systems that block `npm.ps1`, use `npm.cmd run db:setup` and `npm.cmd run dev`.

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `AWS_REGION` | Yes | AWS region containing the table |
| `DYNAMODB_TABLE_NAME` | Yes | DynamoDB table name |
| `SESSION_SECRET` | Yes | Signs seven-day HTTP-only session cookies |
| `USE_MOCK_DB` | Yes | Keep `false` for AWS DynamoDB; `true` is only an optional offline development fallback |
| `SMTP_HOST` | Yes | SMTP server hostname |
| `SMTP_PORT` | Yes | SMTP port, usually `587` for STARTTLS or `465` for TLS |
| `SMTP_SECURE` | Yes | Use `true` for port `465`; otherwise `false` |
| `SMTP_USER` | Yes | SMTP account username |
| `SMTP_PASS` | Yes | SMTP password or provider app password |
| `MAIL_FROM` | Yes | Sender displayed on verification emails |
| `AWS_ACCESS_KEY_ID` | Host-dependent | Prefer the AWS CLI profile locally or the deployment platform's secret manager |
| `AWS_SECRET_ACCESS_KEY` | Host-dependent | Never commit this value |

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

### Deploy to Vercel and AWS

The deployed site must use **AWS DynamoDB**, not the local Workbench database.
Vercel cannot reach `http://127.0.0.1:8000`.

1. Create an AWS account and choose one region (for example `eu-west-1`). Create
an IAM identity with DynamoDB access restricted to the `CommerceCraft` table.
Create an access key for that identity. Keep the secret outside Git and do not
paste it into source files.
2. Follow the **AWS DynamoDB Setup** section above. In PowerShell, use
`.env.production.local` and run `npm.cmd run db:setup` once. This creates the
cloud table, enables TTL for verification codes, and seeds categories/products.
3. Go to [Vercel](https://vercel.com/new), sign in with GitHub, and import
`nour233/ecommerce-platform`. Vercel detects Next.js automatically.
4. Before deploying, open the project's **Environment Variables** section and
add the values from `.env.production.local`: `AWS_REGION`,
`DYNAMODB_TABLE_NAME`, `USE_MOCK_DB`, `SESSION_SECRET`, all `SMTP_*` variables,
`MAIL_FROM`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`. Do **not** add
`DYNAMODB_ENDPOINT`.
5. Deploy. Copy the generated `https://...vercel.app` URL and test registration,
email verification, login, products, cart, wishlist, and admin access.
6. After registering the first cloud user, promote that account using the same
production file:

```powershell
$env:ENV_FILE = ".env.production.local"
npm.cmd run admin:promote -- your-admin-email@example.com
```

7. Every later push to the `main` branch creates a new production deployment.
When changing an environment variable in Vercel, redeploy so the server uses it.

The repository contains the application source code, technical documentation, and deployment configuration.
