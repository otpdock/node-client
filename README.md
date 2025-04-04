# @otpdock/client

<p align="center">
  <img src="https://docs.otpdock.com/logo.png" alt="OTPDock Logo" width="200"/>
</p>

<p align="center">
  Official Node.js client for <a href="https://otpdock.com">OTPDock</a> - Disposable Email Service for E2E Testing
</p>

<p align="center">
  <a href="https://github.com/otpdock/node-client/actions"><img src="https://github.com/otpdock/node-client/workflows/Test/badge.svg" alt="Build Status"></a>
  <a href="https://github.com/otpdock/node-client/actions/workflows/release.yml"><img src="https://github.com/otpdock/node-client/workflows/Release/badge.svg" alt="Release Status"></a>
  <a href="https://www.npmjs.com/package/@otpdock/client"><img src="https://img.shields.io/npm/v/@otpdock/client.svg" alt="Version"></a>
  <a href="https://www.npmjs.com/package/@otpdock/client"><img src="https://img.shields.io/npm/dm/@otpdock/client.svg" alt="Downloads"></a>
  <a href="https://www.npmjs.com/package/@otpdock/client"><img src="https://img.shields.io/npm/types/@otpdock/client.svg" alt="Types"></a>
  <a href="https://github.com/otpdock/node-client/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@otpdock/client.svg" alt="License"></a>
  <a href="https://github.com/otpdock/node-client/pulls"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome"></a>
  <a href="https://bundlephobia.com/result?p=@otpdock/client"><img src="https://img.shields.io/bundlephobia/minzip/@otpdock/client.svg" alt="Bundle Size"></a>
  <a href="https://www.npmjs.com/package/@otpdock/client"><img src="https://img.shields.io/node/v/@otpdock/client.svg" alt="Node Version"></a>
</p>

## Overview

The OTPDock Client is the official Node.js library for interacting with [OTPDock](https://otpdock.com). It provides a simple and reliable way to fetch OTPs from your disposable email inboxes during end-to-end testing.

> 🔑 To use this client, you'll need an API key from your [OTPDock Dashboard](https://otpdock.com/dashboard). Don't have an account? [Sign up here](https://otpdock.com/signup).

## Features

- 🚀 Simple and intuitive API
- 🔄 Automatic retries with configurable intervals
- ⏱️ Configurable timeouts
- 📦 TypeScript support out of the box
- 🔒 Secure API key authentication

## Installation

```bash
npm install @otpdock/client
```

## Quick Start

First, get your API key from your [OTPDock Dashboard](https://otpdock.com/dashboard).

```typescript
import { OtpDockClient } from '@otpdock/client';

// Initialize the client with your API key
const client = new OtpDockClient('your_api_key_here');

// Generate a temporary inbox
const inbox = await client.generateTemporaryInbox({
  prefix: 'e2e-test' // Optional prefix for the email address
});

// Get the email address for your test
console.log(inbox.email); // e.g. e2e-test-abc123@otpdock.com

// Wait for and retrieve the OTP code
const otp = await inbox.getOtp({
  timeout: 20000, // Maximum time to wait (default: 10000ms)
  interval: 1000  // Polling interval (default: 1000ms)
});
```

## Usage with Testing Frameworks

### Playwright

```typescript
import { test, expect } from '@playwright/test';
import { OtpDockClient } from '@otpdock/client';

const client = new OtpDockClient('your_api_key_here');

test('sign-up with email verification', async ({ page }) => {
  // Generate a temporary inbox
  const inbox = await client.generateTemporaryInbox();

  // Fill out the registration form
  await page.goto('/sign-up');
  await page.getByLabel(/Email/i).fill(inbox.email);
  await page.getByLabel(/Password/i).fill('Test123!@#');
  await page.getByRole('button', { name: /Create Account/i }).click();

  // Wait for and retrieve the OTP code
  const otp = await inbox.getOtp({ timeout: 20000 });
  
  // Complete verification
  await page.getByLabel(/Verification code/i).fill(otp);
  await page.getByRole('button', { name: /Verify/i }).click();
});
```

### Cypress

```typescript
import { OtpDockClient } from '@otpdock/client';

const client = new OtpDockClient('your_api_key_here');

describe('Sign Up Flow', () => {
  it('completes sign-up with email verification', () => {
    // Generate a temporary inbox
    cy.wrap(client.generateTemporaryInbox()).then((inbox) => {
      // Fill out the registration form
      cy.visit('/sign-up');
      cy.get('[data-cy=email-input]').type(inbox.email);
      cy.get('[data-cy=password-input]').type('Test123!@#');
      cy.get('[data-cy=submit-button]').click();

      // Wait for and retrieve the OTP code
      cy.wrap(inbox.getOtp({ timeout: 20000 })).then((otp) => {
        // Complete verification
        cy.get('[data-cy=otp-input]').type(otp);
        cy.get('[data-cy=verify-button]').click();
      });
    });
  });
});
```

## API Reference

### OtpDockClient

#### Constructor

```typescript
new OtpDockClient(apiKey: string, config?: Config)
```

#### Methods

- `generateTemporaryInbox(options?: GenerateInboxOptions): Promise<TemporaryInbox>`
  - Creates a new temporary email inbox for testing
  - Options:
    - `prefix?: string` - Prefix for the generated email address

### TemporaryInbox

#### Properties

- `email: string` - The email address of this inbox

#### Methods

- `getOtp(options?: GetOtpOptions): Promise<string>`
  - Waits for and retrieves an OTP code from the inbox
  - Options:
    - `timeout?: number` - Maximum time to wait in milliseconds (default: 10000)
    - `interval?: number` - Polling interval in milliseconds (default: 1000)
    - `since?: number` - Only check emails after this timestamp (default: Date.now())
    - `extractOtp?: (emailBody: string) => string | null` - Custom function to extract OTP

## Documentation

For detailed documentation and examples, visit [docs.otpdock.com](https://docs.otpdock.com).

> 💡 You can find your API key in your [OTPDock Settings](https://app.otpdock.com/settings).

## Best Practices

1. **Use Unique Inboxes**: Generate unique inbox names for parallel test runs
2. **Handle Timeouts**: Always set appropriate timeouts for your test environment
3. **Clean Up**: Delete test emails after your tests complete
4. **Secure API Keys**: Never commit API keys to your repository. Get your API key from [otpdock.com/dashboard](https://otpdock.com/dashboard).

## Support

- 📚 [Official Documentation](https://docs.otpdock.com)
- 💬 [Contact Support](mailto:support@otpdock.com)
- 🐛 [Report Issues](https://github.com/otpdock/node-client/issues)

## Security

For security issues, please email support@otpdock.com instead of using the issue tracker.

## License

Copyright (c) OTPDock. All rights reserved.

