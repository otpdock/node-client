type Config = {
    apiKey: string;
    baseUrl?: string;
    debug?: boolean;
};
type GetOtpOptions = {
    inbox: string;
    timeout?: number;
    interval?: number;
    since?: number;
    extractOtp?: (emailBody: string) => string | null;
};
export declare class OtpDockClient {
    private apiKey;
    private debug;
    constructor(apiKey: string, config?: Config);
    getOtp(options: GetOtpOptions): Promise<string>;
    private extractWithDefaultRegex;
    private sleep;
}
export {};
