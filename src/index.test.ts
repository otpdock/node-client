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
        body: 'Your verification code is: 123456'
      },
      {
        subject: 'Security Code',
        body: 'Use this code to verify your account: 987654'
      },
      {
        subject: 'One-Time Password',
        body: 'Here is your OTP: 456789. Valid for 5 minutes.'
      },
      {
        subject: '2FA Code',
        body: 'Your two-factor authentication code is 234567'
      },
      {
        subject: 'Sign-in code',
        body: 'Enter this code to complete sign in: 876543'
      },
      {
        subject: 'Verification Required',
        body: 'To complete your action, enter code: 345678'
      },
      {
        subject: 'Account Security',
        body: `
          Hello,
          
          We received a request to verify your account.
          
          Your verification code is: 567890
          
          If you didn't request this code, please ignore this email.
          
          Thanks,
          Security Team
        `
      },
      {
        subject: 'Complete Your Registration',
        body: 'Welcome! Please use 789012 to complete your registration.'
      },
      {
        subject: 'Login Attempt',
        body: 'We detected a login attempt. Use code 901234 to verify it was you.'
      },
      {
        subject: 'Password Reset',
        body: 'Your password reset code is 432109. This code will expire in 15 minutes.'
      }
    ];

    it('should extract OTP from various email formats', async () => {
      for (const email of commonOtpEmails) {
        const mockFetch = jest.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ body: email.body })
        });

        global.fetch = mockFetch;
        const client = new OtpDockClient('test-api-key');
        
        const otp = await client.getOtp({ inbox: 'test123' });
        expect(otp).toMatch(/^\d{6}$/); // Should extract 6-digit OTP
      }
    });

    it('should handle various OTP formats', async () => {
      const otpVariations = [
        { body: 'Your code is 123-456', expected: '123456' },
        { body: 'Code: 123 456', expected: '123456' },
        { body: 'Enter 12.34.56', expected: '123456' },
        { body: 'OTP: A1B2C3', expected: 'A1B2C3' },  // Alphanumeric
        { body: 'Use code 123456.', expected: '123456' },
        { body: 'CODE=123456;', expected: '123456' },
        { body: '123456 is your code', expected: '123456' },
        { body: '[123456]', expected: '123456' },
        { body: 'Your OTP is "123456"', expected: '123456' },
        { body: '123456 expires in 5 minutes', expected: '123456' }
      ];

      for (const { body, expected } of otpVariations) {
        const mockFetch = jest.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ body })
        });

        global.fetch = mockFetch;
        const client = new OtpDockClient('test-api-key');
        
        const otp = await client.getOtp({ inbox: 'test123' });
        expect(otp).toBe(expected);
      }
    });

    it('should throw error if inbox is not provided', async () => {
      await expect(client.getOtp({ inbox: '' })).rejects.toThrow('Inbox is required');
    });

    it('should use default values for optional parameters', async () => {
      // Mock the fetch function
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ body: 'Your OTP is 123456' }),
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
          json: () => Promise.resolve({ body: 'this is your otp: 123456' })
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