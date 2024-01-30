export class FetchWrapper {
  private baseURL: string;
  private timeout: number;
  public defaults: FetchDefaults = {
    headers: {},
  };

  constructor(baseURL = "", timeout = 5000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  public addHeaders(newHeaders: Record<string, string>) {
    this.defaults.headers = { ...this.defaults.headers, ...newHeaders };
  }

  public async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<FetchResponse> {
    this.stringifyBodyIfJson(options);
    const url = `${this.baseURL}${endpoint}`;
    options.headers = {
      ...this.defaults.headers,
      ...(options.headers as Record<string, string>),
    };

    try {
      const response = await Promise.race([
        fetch(url, options),
        this.createTimeoutPromise(),
      ]);
      const data = await response.json();
      this.handleResponseError(response, data);
      const combinedFetchResponse = { ...response, data };
      return combinedFetchResponse;
    } catch (error: any) {
      throw error;
    }
  }

  public async get(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    return this.request(endpoint, { ...options, method: "GET" });
  }

  public async post(
    endpoint: string,
    body: any,
    options: RequestInit = {}
  ): Promise<FetchResponse> {
    this.setHeaderIfJson(options);
    return this.request(endpoint, { ...options, method: "POST", body });
  }

  public async delete(endpoint: string, data: any): Promise<Response> {
    return this.request(endpoint, {
      method: "DELETE",
      body: JSON.stringify(data),
    });
  }

  public async put(
    endpoint: string,
    body: any,
    options: RequestInit = {}
  ): Promise<FetchResponse> {
    this.setHeaderIfJson(options);
    return this.request(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  private stringifyBodyIfJson(options: RequestInit | any): void {
    if (!options.headers) {
      return;
    }
    if (options.headers["Content-Type"] === "application/json") {
      options.body = JSON.stringify(options.body);
    }
  }

  private createTimeoutPromise(): Promise<FetchResponse> {
    return new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              `Request was aborted due to a timeout < ${this.timeout}ms.  Increase the timeout to avoid this error.`
            )
          ),
        this.timeout
      )
    );
  }

  private setHeaderIfJson(options: RequestInit | any): void {
    if (!options.headers) {
      options.headers = {};
    }
    if (!options.headers["Content-Type"]) {
      options.headers["Content-Type"] = "application/json";
    }
  }

  private handleResponseError(response: FetchResponse, data: any): void {
    if (!response.ok) {
      throw new Error(data.message || "Error fetching data");
    }
  }
}

export interface FetchDefaults {
  headers: Record<string, string>;
}

export interface FetchResponse extends Response {
  data?: any;
}

export default FetchWrapper;