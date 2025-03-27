# @otpdock/client

<p align="center">
  <img src="https://otpdock.com/logo.png" alt="OTPDock Logo" width="200"/>
</p>

<p align="center">
  Official Node.js client for <a href="https://otpdock.com">OTPDock</a> - Disposable Email Service for E2E Testing
</p>

<p align="center">
  <a href="https://github.com/otpdock/node-client/actions"><img src="https://github.com/otpdock/node-client/workflows/Test/badge.svg" alt="Build Status"></a>
  <a href="https://github.com/otpdock/node-client/actions/workflows/release.yml"><img src="https://github.com/otpdock/node-client/workflows/Release/badge.svg" alt="Release Status"></a>
  <a href="https://codecov.io/gh/otpdock/node-client"><img src="https://codecov.io/gh/otpdock/node-client/branch/main/graph/badge.svg" alt="Coverage Status"></a>
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

const otpClient = new OtpDockClient('your-api-key');

const otp = await otpClient.getOtp({
  inbox: 'test123',
  since: Date.now() - 60_000, // optional: only check emails from last minute
  timeout: 10000,             // optional: timeout after 10 seconds
  interval: 1000              // optional: check every second
});

console.log('Received OTP:', otp);
```

## Usage with Testing Frameworks

### Playwright

```typescript
import { test, expect } from '@playwright/test';
import { OtpDockClient } from '@otpdock/client';

test('user registration flow', async ({ page }) => {
  const otpClient = new OtpDockClient(process.env.OTPDOCK_API_KEY);
  const testEmail = 'test123@xyz.otpdock.com';  // Your inbox at otpdock.com

  // Fill registration form
  await page.fill('[name="email"]', testEmail);
  await page.click('#submit-registration');

  // Wait for and retrieve OTP
  const otp = await otpClient.getOtp({
    inbox: 'test123',
    timeout: 15000
  });

  // Enter OTP
  await page.fill('[name="otp"]', otp);
  await page.click('#verify-otp');

  await expect(page.locator('.success-message')).toBeVisible();
});
```

### Cypress

```typescript
import { OtpDockClient } from '@otpdock/client';

Cypress.Commands.add('getOtp', (inbox: string) => {
  const client = new OtpDockClient(Cypress.env('OTPDOCK_API_KEY'));
  return client.getOtp({ inbox });
});

it('completes email verification', () => {
  const testEmail = 'test123@xyz.otpdock.com';  // Your inbox at otpdock.com
  
  cy.visit('/register');
  cy.get('[name="email"]').type(testEmail);
  cy.get('#submit-registration').click();
  
  cy.getOtp('test123').then(otp => {
    cy.get('[name="otp"]').type(otp);
    cy.get('#verify-otp').click();
    cy.get('.success-message').should('be.visible');
  });
});
```

## API Reference

### `OtpDockClient`

#### Constructor

```typescript
constructor(apiKey: string)
```

Creates a new OTPDock client instance.

#### Methods

##### `getOtp(options: GetOtpOptions): Promise<string>`

Fetches an OTP from the specified inbox.

Options:
- `inbox: string` - The inbox name (required)
- `since?: number` - Unix timestamp to filter emails (optional)
- `timeout?: number` - Maximum time to wait in ms (default: 30000)
- `interval?: number` - Polling interval in ms (default: 1000)

Returns: Promise resolving to the OTP string

## Configuration

The client can be configured through environment variables:

```bash
OTPDOCK_API_KEY=your-api-key
OTPDOCK_TIMEOUT=30000    # Optional: Default timeout in ms
OTPDOCK_INTERVAL=1000    # Optional: Default polling interval in ms
```

> 💡 You can find your API key in your [OTPDock Dashboard](https://otpdock.com/dashboard) under API Settings.

## Best Practices

1. **Use Unique Inboxes**: Generate unique inbox names for parallel test runs
2. **Handle Timeouts**: Always set appropriate timeouts for your test environment
3. **Clean Up**: Delete test emails after your tests complete
4. **Secure API Keys**: Never commit API keys to your repository. Get your API key from [otpdock.com/dashboard](https://otpdock.com/dashboard).

## Error Handling

```typescript
try {
  const otp = await client.getOtp({ inbox: 'test123' });
} catch (error) {
  if (error.message.includes('timeout')) {
    console.error('OTP not received in time');
  } else if (error.status === 401) {
    console.error('Invalid API key');
  }
}
```

## Support

- 📚 [Official Documentation](https://docs.otpdock.com)
- 💬 [Contact Support](https://otpdock.com/support)
- 🐛 [Report Issues](https://github.com/otpdock/node-client/issues)

## Security

For security issues, please email support@otpdock.com instead of using the issue tracker.

## License

Copyright (c) OTPDock. All rights reserved.

Licensed under the [MIT License](./LICENSE).
