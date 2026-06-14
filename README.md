# Titanbay Private Markets API

RESTful API for managing private market funds, investors, and investments.

This project implements the Titanbay private markets take-home task using TypeScript, Fastify, Prisma, and PostgreSQL.

## Tech Stack

* TypeScript
* Fastify
* Prisma ORM
* PostgreSQL
* Docker Compose
* Vitest

## Features

* RESTful JSON API
* PostgreSQL persistence
* Prisma migrations
* Request validation using Fastify schemas and TypeBox
* Consistent error handling
* Unit tests for validation schemas
* Integration tests using Fastify `app.inject()` and a real PostgreSQL test database

## API Resources

The API manages three resources:

* Funds
* Investors
* Investments

An investment links an investor to a fund.

## Endpoints

### Funds

| Method | Endpoint     | Description             |
| ------ | ------------ | ----------------------- |
| `GET`  | `/funds`     | List all funds          |
| `POST` | `/funds`     | Create a new fund       |
| `PUT`  | `/funds`     | Update an existing fund |
| `GET`  | `/funds/:id` | Get a fund by ID        |

### Investors

| Method | Endpoint     | Description           |
| ------ | ------------ | --------------------- |
| `GET`  | `/investors` | List all investors    |
| `POST` | `/investors` | Create a new investor |

### Investments

| Method | Endpoint                      | Description                     |
| ------ | ----------------------------- | ------------------------------- |
| `GET`  | `/funds/:fund_id/investments` | List investments for a fund     |
| `POST` | `/funds/:fund_id/investments` | Create an investment for a fund |

## Data Models

### Fund

```json
{
  "id": "uuid",
  "name": "Titanbay Growth Fund I",
  "vintage_year": 2024,
  "target_size_usd": 250000000,
  "status": "Fundraising",
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

Valid fund statuses:

* `Fundraising`
* `Investing`
* `Closed`

### Investor

```json
{
  "id": "uuid",
  "name": "CalPERS",
  "investor_type": "Institution",
  "email": "privateequity@calpers.ca.gov",
  "created_at": "2024-02-10T09:15:00.000Z"
}
```

Valid investor types:

* `Individual`
* `Institution`
* `Family Office`

### Investment

```json
{
  "id": "uuid",
  "investor_id": "uuid",
  "fund_id": "uuid",
  "amount_usd": 75000000,
  "investment_date": "2024-09-22"
}
```

## Prerequisites

You will need:

* Node.js
* npm
* Docker
* Docker Compose

## Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://titanbay:titanbay@localhost:5432/titanbay_private_markets"
PORT=3000
```

For tests, use a separate database:

```env
TEST_DATABASE_URL="postgresql://titanbay:titanbay@localhost:5432/titanbay_private_markets_test"
```

A sample `.env.example` file is included.

## Setup

Install dependencies:

```bash
npm install
```

Start PostgreSQL:

```bash
docker compose up -d
```

Run database migrations:

```bash
npx prisma migrate dev
```

Generate Prisma client:

```bash
npx prisma generate
```

## Running the API

Start the development server:

```bash
npm run dev
```

The API should be available at:

```text
http://localhost:3000
```

Health check:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok"
}
```

## Example Requests

### Create a fund

```bash
curl -X POST http://localhost:3000/funds \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Titanbay Growth Fund I",
    "vintage_year": 2024,
    "target_size_usd": 250000000,
    "status": "Fundraising"
  }'
```

### List funds

```bash
curl http://localhost:3000/funds
```

### Get a fund by ID

```bash
curl http://localhost:3000/funds/<fund_id>
```

### Update a fund

```bash
curl -X PUT http://localhost:3000/funds \
  -H "Content-Type: application/json" \
  -d '{
    "id": "<fund_id>",
    "name": "Titanbay Growth Fund I",
    "vintage_year": 2024,
    "target_size_usd": 300000000,
    "status": "Investing"
  }'
```

### Create an investor

```bash
curl -X POST http://localhost:3000/investors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CalPERS",
    "investor_type": "Institution",
    "email": "privateequity@calpers.ca.gov"
  }'
```

### List investors

```bash
curl http://localhost:3000/investors
```

### Create an investment

```bash
curl -X POST http://localhost:3000/funds/<fund_id>/investments \
  -H "Content-Type: application/json" \
  -d '{
    "investor_id": "<investor_id>",
    "amount_usd": 75000000,
    "investment_date": "2024-09-22"
  }'
```

### List investments for a fund

```bash
curl http://localhost:3000/funds/<fund_id>/investments
```

## Validation

The API validates:

* Required request fields
* UUID path parameters
* Fund status enum values
* Investor type enum values
* Email format
* Positive monetary amounts
* Investment date format
* Unexpected extra request fields

Invalid requests return `400 Bad Request`.

## Error Responses

Errors use a consistent JSON shape:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Fund not found"
  }
}
```

Common statuses:

| Status | Meaning                                    |
| ------ | ------------------------------------------ |
| `400`  | Invalid request input                      |
| `404`  | Fund or investor not found                 |
| `409`  | Conflict, such as duplicate investor email |
| `500`  | Unexpected server error                    |

## Testing

This project includes unit and integration tests.

Unit tests cover validation schemas.

Integration tests cover the API routes using Fastify `app.inject()` and a real PostgreSQL test database.

Create the test database:

```bash
docker exec titanbay-postgres sh -c 'createdb -U titanbay titanbay_private_markets_test || true'
```

Run migrations against the test database:

```bash
DATABASE_URL="postgresql://titanbay:titanbay@localhost:5432/titanbay_private_markets_test" npx prisma migrate deploy
```

Run tests:

```bash
DATABASE_URL="postgresql://titanbay:titanbay@localhost:5432/titanbay_private_markets_test" npm test
```

## Design Decisions

### Fastify

Fastify was chosen over a more minimal Express setup because validation is a key requirement of the task. Fastify supports route-level schemas for request bodies, route parameters, and responses, making it easier to keep validation close to each endpoint.

### TypeBox

TypeBox works naturally with Fastify’s JSON Schema validation model. It allows request and response schemas to be defined once and reused for runtime validation while still giving TypeScript useful type inference.

### Prisma

Prisma was chosen as the PostgreSQL access layer because it provides a clean TypeScript API, schema migrations, generated types, and safer database interactions than writing raw SQL throughout the route handlers.

### Vitest

Vitest was chosen for testing because it works well with TypeScript and supports both fast unit tests and integration tests. The integration tests use Fastify’s `app.inject()` to test real HTTP routes without needing to start a separate server process.
### API field naming

The API uses `snake_case` field names to match the provided API specification.

### Investment relationship

Investments are modelled as records linking one investor to one fund.

### `PUT /funds`

The API follows the provided specification and implements `PUT /funds` with the fund `id` in the request body, rather than using `PUT /funds/:id`.

## Assumptions

* Authentication and authorization are out of scope.
* Delete endpoints are out of scope because they are not included in the provided API specification.
* Pagination, filtering, and sorting are out of scope.
* Investor emails should be unique.
* Multiple investments from the same investor into the same fund are allowed unless otherwise specified.
* Monetary values are stored as decimals in PostgreSQL and returned as numbers in API responses.
* `investment_date` is returned in `YYYY-MM-DD` format.
* `created_at` is returned as an ISO date-time string.

## AI Usage

AI tools were used to support development planning, clarify private markets terminology, reason through REST API design, compare TypeScript/PostgreSQL framework options, design validation and testing requirements, and troubleshoot implementation issues.

The implementation decisions, code structure, validation rules, tests, and final code were reviewed and adapted manually to fit the provided API specification.
