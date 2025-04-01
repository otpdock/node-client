import { OtpDockClient } from './index';

describe('OtpDockClient', () => {
  let client: OtpDockClient;
  
  beforeEach(() => {
    client = new OtpDockClient('test-api-key');
  });

  describe('constructor', () => {
    it('should create instance with api key', () => {
      expect(client).toBeInstanceOf(OtpDockClient);
    });

    it('should throw error if api key is not provided', () => {
      expect(() => new OtpDockClient('')).toThrow('API key is required');
    });
  });

  describe('getOtp', () => {
    const commonOtpEmails = [
      {
        subject: 'Your verification code',
        text: 'Your verification code is: 123456',
        html: '<p>Your verification code is: 123456</p>'
      },
      {
        subject: 'Security Code',
        text: 'Use this code to verify your account: 987654',
        html: '<p>Use this code to verify your account: 987654</p>'
      },
      {
        subject: 'One-Time Password',
        text: 'Here is your OTP: 456789. Valid for 5 minutes.',
        html: '<p>Here is your OTP: 456789. Valid for 5 minutes.</p>'
      },
      {
        subject: '2FA Code',
        text: 'Your two-factor authentication code is 234567',
        html: '<p>Your two-factor authentication code is 234567</p>'
      },
      {
        subject: 'Sign-in code',
        text: 'Enter this code to complete sign in: 876543',
        html: '<p>Enter this code to complete sign in: 876543</p>'
      },
      {
        subject: 'Verification Required',
        text: 'To complete your action, enter code: 345678',
        html: '<p>To complete your action, enter code: 345678</p>'
      },
      {
        subject: 'Account Security',
        text: `
          Hello,
          
          We received a request to verify your account.
          
          Your verification code is: 567890
          
          If you didn't request this code, please ignore this email.
          
          Thanks,
          Security Team
        `,
        html: `
          <p>Hello,</p>
          <p>We received a request to verify your account.</p>
          <p>Your verification code is: 567890</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <p>Thanks,<br>Security Team</p>
        `
      },
      {
        subject: 'Complete Your Registration',
        text: 'Welcome! Please use 789012 to complete your registration.',
        html: '<p>Welcome! Please use 789012 to complete your registration.</p>'
      },
      {
        subject: 'Login Attempt',
        text: 'We detected a login attempt. Use code 901234 to verify it was you.',
        html: '<p>We detected a login attempt. Use code 901234 to verify it was you.</p>'
      },
      {
        subject: 'Password Reset',
        text: 'Your password reset code is 432109. This code will expire in 15 minutes.',
        html: '<p>Your password reset code is 432109. This code will expire in 15 minutes.</p>'
      }
    ];

    it('should extract OTP from various email formats', async () => {
      for (const email of commonOtpEmails) {
        // Test with text content
        const mockFetchText = jest.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ contentPreview: email.text })
        });

        global.fetch = mockFetchText;
        const clientText = new OtpDockClient('test-api-key');
        
        const otpFromText = await clientText.getOtp({ inbox: 'test123' });
        expect(otpFromText).toMatch(/^\d{6}$/); // Should extract 6-digit OTP

        // Test with HTML content
        const mockFetchHtml = jest.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ contentPreview: email.html })
        });

        global.fetch = mockFetchHtml;
        const clientHtml = new OtpDockClient('test-api-key');
        
        const otpFromHtml = await clientHtml.getOtp({ inbox: 'test123' });
        expect(otpFromHtml).toMatch(/^\d{6}$/); // Should extract 6-digit OTP

        // Both should match
        expect(otpFromText).toBe(otpFromHtml);
      }
    });

    it('should handle various OTP formats', async () => {
      const otpVariations = [
        { text: 'Your code is 123-456', html: '<p>Your code is 123-456</p>', expected: '123456' },
        { text: 'Code: 123 456', html: '<p>Code: 123 456</p>', expected: '123456' },
        { text: 'Enter 12.34.56', html: '<p>Enter 12.34.56</p>', expected: '123456' },
        { text: 'OTP: A1B2C3', html: '<p>OTP: A1B2C3</p>', expected: 'A1B2C3' },  // Alphanumeric
        { text: 'Use code 123456.', html: '<p>Use code 123456.</p>', expected: '123456' },
        { text: 'CODE=123456;', html: '<p>CODE=123456;</p>', expected: '123456' },
        { text: '123456 is your code', html: '<p>123456 is your code</p>', expected: '123456' },
        { text: '[123456]', html: '<p>[123456]</p>', expected: '123456' },
        { text: 'Your OTP is "123456"', html: '<p>Your OTP is "123456"</p>', expected: '123456' },
        { text: '123456 expires in 5 minutes', html: '<p>123456 expires in 5 minutes</p>', expected: '123456' }
      ];

      for (const { text, html, expected } of otpVariations) {
        const mockFetch = jest.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ contentPreview: text })
        });

        global.fetch = mockFetch;
        const client = new OtpDockClient('test-api-key');
        
        const otp = await client.getOtp({ inbox: 'test123' });
        expect(otp).toBe(expected);
      }
    });

    it('should extract OTP when only text content is available', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ contentPreview: 'Your code is 123456' })
      });

      global.fetch = mockFetch;
      const client = new OtpDockClient('test-api-key');
      
      const otp = await client.getOtp({ inbox: 'test123' });
      expect(otp).toBe('123456');
    });

    it('should extract OTP when only html content is available', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ contentPreview: '<p>Your code is 123456</p>' })
      });

      global.fetch = mockFetch;
      const client = new OtpDockClient('test-api-key');
      
      const otp = await client.getOtp({ inbox: 'test123' });
      expect(otp).toBe('123456');
    });

    it('should throw error if inbox is not provided', async () => {
      await expect(client.getOtp({ inbox: '' })).rejects.toThrow('Inbox is required');
    });

    it('should use default values for optional parameters', async () => {
      // Mock the fetch function
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ contentPreview: 'Your OTP is 123456' }),
        } as Response)
      );

      const result = await client.getOtp({ inbox: 'test123' });
      
      expect(result).toBe('123456');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('test123'),
        expect.any(Object)
      );
    });

    it('should handle API errors', async () => {
      // Mock API error response
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
        } as Response)
      );

      await expect(client.getOtp({ inbox: 'test123' })).rejects.toThrow('API request failed: 401 Unauthorized');
    });

    it('should handle timeout', async () => {
      global.fetch = jest.fn(() => new Promise(resolve => setTimeout(resolve, 4500)));

      const otpPromise = client.getOtp({ 
        inbox: 'test123',
        timeout: 2000,
        interval: 100
      });

      await expect(otpPromise).rejects.toThrow('OTP email not received in time.');
    });

    it('should retry until OTP is found', async () => {
      const mockFetch = jest.fn()
        .mockImplementationOnce(() => Promise.resolve({
          ok: false,
          status: 404
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: false,
          status: 404
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: false,
          status: 404
        }))
        .mockImplementationOnce(() => Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ contentPreview: 'this is your otp: 123456' })
        }));

      global.fetch = mockFetch;

      const result = await client.getOtp({ 
        inbox: 'test123',
        interval: 100 
      });

      expect(result).toBe('123456');
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });
}); 