export default class FetchWrapper {
    private baseURL;
    private timeout;
    defaults: FetchDefaults;
    constructor(baseURL?: string, timeout?: number);
    addHeaders(newHeaders: Record<string, string>): void;
    request(endpoint: string, options?: RequestInit): Promise<FetchResponse>;
    get(endpoint: string, options?: RequestInit): Promise<Response>;
    post(endpoint: string, body: any, options?: RequestInit): Promise<FetchResponse>;
    delete(endpoint: string, data: any): Promise<Response>;
    put(endpoint: string, body: any, options?: RequestInit): Promise<FetchResponse>;
    private stringifyBodyIfJson;
    private createTimeoutPromise;
    private setHeaderIfJson;
    private handleResponseError;
}
export interface FetchDefaults {
    headers: Record<string, string>;
}
export interface FetchResponse extends Response {
    data?: any;
}
//# sourceMappingURL=fetchwrapper.d.ts.map