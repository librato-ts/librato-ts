export interface SimulateConfig {
  simulate: true;
}

export interface ClientConfig {
  simulate?: false;
  email: string;
  token: string;
  /**
   * Metric name prefix to apply to all measurements
   */
  prefix?: string;
  /**
   * Amount of time in milliseconds to wait between flushes. Default is 60s
   */
  period?: number;
  /**
   * Amount of time in milliseconds before the request times out. Default is 30s
   */
  timeout?: number;
  /**
   * Number of times to retry sending metrics to Librato. Default is 3
   */
  retryCount?: number;
  /**
   * Source dimension to apply to all measurements
   */
  source?: string;
}
