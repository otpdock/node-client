type Config = {
  debug?: boolean;
};

type GenerateInboxOptions = {
  prefix?: string;
};

type GetOtpOptions = {
  timeout?: number;
  interval?: number;
  since?: number; // timestamp (ms)
  extractOtp?: (emailBody: string) => string | null;
};

const BASE_URL = 'https://ci-api.otpdock.com';
const DEFAULT_TIMEOUT = 10_000;
const DEFAULT_INTERVAL = 1000;
const DEFAULT_SINCE = Date.now();

class TemporaryInbox {
  private createdAt: number;
  public email: string;

  constructor(
    email: string,
    private inboxId: string,
    private client: OtpDockClient
  ) {
    this.email = email;
    this.createdAt = Date.now();
  }

  async getOtp(options: GetOtpOptions = {}): Promise<string> {
    return this.client.getOtp({
      ...options,
      since: options.since ?? this.createdAt,
      inbox: this.inboxId
    });
  }

  getEmail(): string {
    return this.email;
  }
}

export class OtpDockClient {
  private apiKey: string;
  private debug: boolean;

  constructor(apiKey: string, config?: Config) {
    if (!apiKey) throw new Error('API key is required');
    this.apiKey = apiKey;
    this.debug = config?.debug ?? false;
  }

  async generateTemporaryInbox(options: GenerateInboxOptions = {}): Promise<TemporaryInbox> {
    const url = `${BASE_URL}/inboxes/generate`;

    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ prefix: options.prefix }),
      headers: {
        'x-api-key': this.apiKey,
      },
    });
    const { email, inboxId } = await response.json() as { email: string; inboxId: string };
    return new TemporaryInbox(email, inboxId, this);
  }

  async getOtp(options: GetOtpOptions & { inbox: string }): Promise<string> {
    const {
      inbox,
      timeout = DEFAULT_TIMEOUT,
      interval = DEFAULT_INTERVAL,
      since = DEFAULT_SINCE,
      extractOtp,
    } = options;

    if (!inbox) throw new Error('Inbox is required');

    const endTime = Date.now() + timeout;

    while (Date.now() < endTime) {
      const response = await fetch(`${BASE_URL}/emails?inbox=${inbox}&since=${since}`, {
        headers: {
          'x-api-key': this.apiKey,
        },
      });
      if (response && response.ok) {
        const { contentPreview } = await response.json() as { contentPreview: string };

        const otp = extractOtp
          ? extractOtp(contentPreview)
          : this.extractWithDefaultRegex(contentPreview);

        if (otp) return otp;

        if (this.debug) {
          console.warn(`[OtpDock] OTP not found. Full email body:\n${contentPreview}`);
        } else {
          const preview = contentPreview.slice(0, 500);
          console.warn(`[OtpDock] OTP not found. Email preview:\n${preview}`);
        }

        throw new Error('[OtpDock] Email received, but OTP could not be extracted.');
      } else if (response && response.status !== 404) {
        throw new Error(`[OtpDock] API request failed: ${response.status} ${response.statusText}`);
      }
      await this.sleep(interval);
    }
    throw new Error('[OtpDock] OTP email not received in time.');
  }

  private extractWithDefaultRegex(body: string): string | null {
    // Match possible code patterns (6 digits, with optional separators OR 6-char alphanumeric)
    const patterns = [
      /(?:\b|["'\[])?(\d[\d\-\.\s]{4,}[\d])(?:\b|["'\]])?/,    // Numeric code w/ possible separators (e.g. 123-456, 12.34.56)
      /(?:\b|["'\[])?([A-Z0-9]{6})(?:\b|["'\]])?/i              // Alphanumeric code (e.g. A1B2C3)
    ];

    for (const regex of patterns) {
      const match = body.match(regex);
      if (match) {
        return match[1].replace(/[\s\-\.]/g, ''); // Remove separators
      }
    }

    return null; // Nothing found
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}