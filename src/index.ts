type Config = {
  debug?: boolean;
};

type GetOtpOptions = {
  inbox: string; // The inbox name (part before @ in inbox@org.otpdock.com)
  timeout?: number;
  interval?: number;
  since?: number; // timestamp (ms)
  extractOtp?: (emailBody: string) => string | null;
};

const BASE_URL = 'https://ci-api.otpdock.com';
const DEFAULT_TIMEOUT = 10_000;
const DEFAULT_INTERVAL = 1000;
const DEFAULT_SINCE = Date.now();

export class OtpDockClient {
  private apiKey: string;
  private debug: boolean;

  constructor(apiKey: string, config?: Config) {
    if (!apiKey) throw new Error('API key is required');
    this.apiKey = apiKey;
    this.debug = config?.debug ?? false;
  }

  async getOtp(options: GetOtpOptions): Promise<string> {
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
      const response = await fetch(`${BASE_URL}/emails/latest?inbox=${inbox}&since=${since}`, {
        headers: {
          'x-api-key': this.apiKey,
        },
      });
      if (response && response.ok) {
        const { content } = await response.json() as { content: { text: string, html: string } };

        const text = content.text
        const html = content.html?.replace(/<[^>]*>/g, '') // Strip HTML tags

        const otp = extractOtp
          ? extractOtp(text || html)
          : this.extractWithDefaultRegex(text || html);

        if (otp) return otp;

        if (this.debug) {
          console.warn(`[OtpDock] OTP not found. Full email body:\n${text || html}`);
        } else {
          const preview = (text || html).slice(0, 500);
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