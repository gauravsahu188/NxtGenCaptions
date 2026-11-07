export class ApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.NXTGEN_API_URL || "http://localhost:3001";
    this.apiKey = process.env.NXTGEN_API_KEY || "";

    if (!this.apiKey) {
      throw new Error("NXTGEN_API_KEY environment variable is required.");
    }
  }

  /** Internal: call the NxtGen API (adds Bearer auth header) */
  async fetch(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
      ...(options.headers as Record<string, string> || {}),
    };

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || `API Error: ${response.status} ${response.statusText}`);
      }
      return data;
    } catch (error: any) {
      console.error(`[ApiClient] Error fetching ${endpoint}:`, error.message);
      throw error;
    }
  }

  async post(endpoint: string, body: any): Promise<any> {
    return this.fetch(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async get(endpoint: string): Promise<any> {
    return this.fetch(endpoint, { method: "GET" });
  }

  /**
   * PUT binary data to an external (presigned S3) URL — NO auth header added.
   */
  async putBinary(
    externalUrl: string,
    data: Uint8Array | Buffer,
    contentType: string
  ): Promise<void> {
    // Convert to ArrayBuffer for fetch compatibility
    const buffer = data instanceof Buffer
      ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
      : data.buffer;

    const response = await fetch(externalUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: buffer as ArrayBuffer,
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`S3 PUT failed: ${response.status} ${response.statusText} — ${text}`);
    }
  }

  /**
   * Convenience: POST with a specific response and re-throw structured errors.
   */
  async postChecked(endpoint: string, body: any): Promise<any> {
    return this.post(endpoint, body);
  }
}
