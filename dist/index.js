"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpDockClient = void 0;
const BASE_URL = 'https://api.otpdock.com';
const DEFAULT_TIMEOUT = 10000;
const DEFAULT_INTERVAL = 1000;
const DEFAULT_SINCE = Date.now();
class OtpDockClient {
    constructor(apiKey, config) {
        if (!apiKey)
            throw new Error('API key is required');
        this.apiKey = apiKey;
        this.debug = config?.debug ?? false;
    }
    async getOtp(options) {
        const { inbox, timeout = DEFAULT_TIMEOUT, interval = DEFAULT_INTERVAL, since = DEFAULT_SINCE, extractOtp, } = options;
        if (!inbox)
            throw new Error('Inbox is required');
        const endTime = Date.now() + timeout;
        while (Date.now() < endTime) {
            const response = await fetch(`${BASE_URL}/emails/latest?inbox=${inbox}&since=${since}`, {
                headers: {
                    'x-api-key': this.apiKey,
                },
            });
            if (response && response.ok) {
                const { body } = await response.json();
                const otp = extractOtp
                    ? extractOtp(body)
                    : this.extractWithDefaultRegex(body);
                if (otp)
                    return otp;
                if (this.debug) {
                    console.warn(`[OtpDock] OTP not found. Full email body:\n${body}`);
                }
                else {
                    const preview = body.slice(0, 500);
                    console.warn(`[OtpDock] OTP not found. Email preview:\n${preview}`);
                }
                throw new Error('[OtpDock] Email received, but OTP could not be extracted.');
            }
            else if (response && response.status !== 404) {
                throw new Error(`[OtpDock] API request failed: ${response.status} ${response.statusText}`);
            }
            await this.sleep(interval);
        }
        throw new Error('[OtpDock] OTP email not received in time.');
    }
    extractWithDefaultRegex(body) {
        // Match possible code patterns (6 digits, with optional separators OR 6-char alphanumeric)
        const patterns = [
            /(?:\b|["'\[])?(\d[\d\-\.\s]{4,}[\d])(?:\b|["'\]])?/,
            /(?:\b|["'\[])?([A-Z0-9]{6})(?:\b|["'\]])?/i // Alphanumeric code (e.g. A1B2C3)
        ];
        for (const regex of patterns) {
            const match = body.match(regex);
            if (match) {
                return match[1].replace(/[\s\-\.]/g, ''); // Remove separators
            }
        }
        return null; // Nothing found
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.OtpDockClient = OtpDockClient;
