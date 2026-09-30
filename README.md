# GGI Backend Task

REST API with two modules: an AI chat (with a mocked OpenAI response) and subscription bundles. Built with TypeScript, Express, Prisma and PostgreSQL.

## Setup

Needs Node 20+ and a running PostgreSQL.

```bash
npm install
cp .env.example .env      # then set DATABASE_URL
npm run db:migrate
npm run build
npm start
```

Server runs on port 3000 by default.

`.env` values:

- `DATABASE_URL` - postgres connection string
- `FREE_MESSAGES_PER_MONTH` - default 3
- `MOCK_OPENAI_DELAY_MS` - fake delay for the OpenAI call, default 750
- `PAYMENT_FAILURE_RATE` - chance a renewal payment fails, default 0.15

`npm run lint` and `npm run format` run ESLint and Prettier.

## Structure

```text
src/
  chat/
    controllers/
    services/
    domain/
    repositories/
  subscriptions/
    controllers/
    services/
    domain/
    repositories/
  common/        config, errors, validation, prisma client
```

Controllers only read the request and send the response. Business rules are in the services and domain classes. Prisma is only used inside the repositories.

## How it works

**Chat**

- Every user gets 3 free messages a month. Free usage is stored per `YYYY-MM`, so a new month starts a new row and the count is back to 0 on the 1st. No cron job is needed for this.
- After the free messages are used, the message is charged to one of the user's bundles. If the user has more than one, the bundle with the most messages left is used first. Enterprise counts as unlimited.
- If nothing is left the API returns `402` with code `QUOTA_EXCEEDED`.
- Quota is updated with a conditional update (`used < limit`), so two requests at the same time can't both use the last message.
- The question, answer and token counts are saved in `chat_messages`.

**Subscriptions**

| Tier       | Messages  | Monthly | Yearly |
| ---------- | --------- | ------- | ------ |
| basic      | 10        | $9      | $90    |
| pro        | 100       | $29     | $290   |
| enterprise | unlimited | $199    | $1990  |

- Renewal runs every hour inside the server (and can be triggered with the `renewals/process` endpoint). Bundles with auto-renew on and a `renewalDate` in the past are renewed. The payment fails randomly, and a failed payment marks the bundle `inactive`.
- Cancelling turns auto-renew off and sets the status to `cancelled`. The bundle can still be used until `endDate`, and its usage and messages are not deleted.

## Endpoints

| Method | Path                              | Body / query                                 |
| ------ | --------------------------------- | -------------------------------------------- |
| POST   | `/chat/messages`                  | `{ userId, question }`                       |
| GET    | `/chat/messages`                  | `?userId=&limit=`                            |
| GET    | `/usage/monthly`                  | `?userId=`                                   |
| POST   | `/subscriptions`                  | `{ userId, tier, billingCycle, autoRenew? }` |
| GET    | `/subscriptions`                  | `?userId=&limit=`                            |
| PATCH  | `/subscriptions/:id/auto-renew`   | `{ autoRenew }`                              |
| PATCH  | `/subscriptions/:id/cancel`       |                                              |
| POST   | `/subscriptions/renewals/process` |                                              |

Errors look like this:

```json
{
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "You have used your 3 free messages for this month. A valid subscription bundle is required."
  }
}
```

Codes: `VALIDATION_ERROR` (400), `QUOTA_EXCEEDED` (402), `NOT_FOUND` (404), `CONFLICT` (409), `INTERNAL_ERROR` (500).

There is no auth, so `userId` is passed in the request.
