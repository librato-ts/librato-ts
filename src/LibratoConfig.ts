export interface SimulateConfig {
  simulate: true;
}

export interface ClientConfig {
  simulate?: false;
  email: string;
  token: string;
  /**
   * Amount of time in milliseconds to wait between flushes. Default is 60s
   */
  period?: number;
  /**
   * Amount of time in milliseconds before the request times out. Default is 30s
   */
  timeout?: number;
  /**
   * Source dimension to apply to all measurements
   */
  source?: string;
}
