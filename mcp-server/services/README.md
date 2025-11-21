# MCP Server Services

This directory is reserved for service modules that encapsulate business logic.

## Recommended Structure

```
services/
├── database.ts       # Database operations (Prisma wrapper)
├── notifications.ts  # Email/SMS notifications (SendGrid, Twilio)
├── encryption.ts     # PII encryption/decryption utilities
├── validation.ts     # Additional validation logic
└── analytics.ts      # Event tracking and analytics
```

## Guidelines

- Keep services stateless and focused on a single domain
- Export functions or classes that tools can consume
- Handle errors gracefully with proper error messages
- Use environment variables for configuration
- Log important operations for audit trails

## Example

```typescript
// database.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createLead(data: LeadInput) {
  return await prisma.lead.create({ data });
}

export async function getLeadByEmail(email: string) {
  return await prisma.lead.findUnique({ where: { email } });
}
```

## Integration

Import services in `server.ts` tool handlers:

```typescript
import { createLead } from "./services/database.js";

// In tool handler:
const lead = await createLead(validated);
```
