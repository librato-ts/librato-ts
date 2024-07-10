import { EventEmitter } from 'node:events';
import { setTimeout } from 'node:timers';

import type { AxiosError, AxiosInstance } from 'axios';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import type { StrictEventEmitter } from 'strict-event-emitter-types';

import { version } from '../package.json';

import type { Annotation } from './Annotation.js';
import { getMillisecondsFromHrTime, sanitizeAnnotationStreamName } from './Helpers.js';
import type { ClientConfig, SimulateConfig } from './LibratoConfig.js';
import type { Measurement, SingleMeasurement } from './measurements/index.js';
import { CounterCollector, GaugeCollector } from './measurements/index.js';

interface LibratoEvents {
  error: (error: Error) => void;
  sending: (args: SendMetricsParams) => void;
  sent: (args: SentMetricsParams) => void;
}

type LibratoEventEmitter = StrictEventEmitter<EventEmitter, LibratoEvents>;

type MeasurementOptions = Omit<Measurement, 'name'>;

export interface SendMetricsParams {
  counters: SingleMeasurement[];
  gauges: Measurement[];
}

export interface SentMetricsParams extends SendMetricsParams {
  /**
   * Duration in milliseconds of the request to Librato
   */
  duration: number;
}

export class Librato extends (EventEmitter as new () => LibratoEventEmitter) {
  private client: AxiosInstance | undefined;

  private config: SimulateConfig | (ClientConfig & Required<Pick<ClientConfig, 'period' | 'retryCount' | 'timeout'>>) | undefined;

  private counterCollector = new CounterCollector();

  private gaugeCollector = new GaugeCollector();

  private isEnding = false;

  private startTimeout?: NodeJS.Timeout;

  /**
   * Initializes the Librato client and starts sending measurements to Librato.
   * @param {object} config
   */
  public init(config: ClientConfig | SimulateConfig): void {
    this.isEnding = false;

    this.config = {
      period: 60_000,
      timeout: 59_000,
      retryCount: 3,
      ...(config as ClientConfig),
    };

    if (config.simulate) {
      return;
    }

    this.client = axios.create({
      baseURL: 'https://metrics-api.librato.com/v1',
      timeout: this.config.timeout,
      headers: {
        'user-agent': `librato-ts/${version}`,
      },
      auth: {
        username: this.config.email,
        password: this.config.token,
      },
    });
    axiosRetry(this.client, {
      retries: this.config.retryCount,
      retryDelay: (retryCount) => axiosRetry.exponentialDelay(retryCount),
      shouldResetTimeout: true,
      retryCondition(error: AxiosError) {
        if (axiosRetry.isNetworkOrIdempotentRequestError(error)) {
          return true;
        }

        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
          return true;
        }

        if (error.response && error.response.status >= 500 && error.response.status <= 599) {
          return true;
        }

        return false;
      },
    });

    // Try to sync when metrics are sent to Librato so periods match across systems
    const now = Date.now();
    const startTime = now + (this.config.period - (now % this.config.period));

    clearTimeout(this.startTimeout);
    this.startTimeout = setTimeout(() => {
      this.run(startTime).catch((ex: unknown) => this.emit('error', ex as Error));
    }, startTime - now);
  }

  /**
   * Flushes any queued measurements to Librato and stops the process of sending measurements to Librato
   */
  public async end(): Promise<void> {
    this.isEnding = true;
    clearTimeout(this.startTimeout);

    return this.flush();
  }

  /**
   * Increment a value that accumulates over time – you can think of this like an odometer on a car; it only ever goes up.
   * @param {string} name - Name of the metric
   * @param {object} options
   */
  public increment(name: string, options?: MeasurementOptions): void;
  /**
   * Increment a value that accumulates over time – you can think of this like an odometer on a car; it only ever goes up.
   * @param {string} name - Name of the metric
   * @param {number} value - Amount to increment by
   * @param {object} options
   */
  public increment(name: string, value: number, options?: MeasurementOptions): void;
  /**
   * Increment a value that accumulates over time – you can think of this like an odometer on a car; it only ever goes up.
   * @param {string} name - Name of the metric
   * @param {number} value - Amount to increment by
   * @param {object} options
   */
  public increment(name: string, value: MeasurementOptions | number = 1, options?: MeasurementOptions): void {
    if (this.config?.simulate) {
      return;
    }

    if (typeof value === 'object') {
      options = value;
      value = 1;
    }

    const optionsWithDefaults: MeasurementOptions = {
      source: this.config?.source,
      time: Date.now(),
      ...options,
    };

    this.counterCollector.increment({
      name: `${this.config?.prefix ?? ''}${name}`,
      value,
      ...optionsWithDefaults,
    });
  }

  /**
   * Measures a current value at the time it is read. An example would be the fuel gauge in a vehicle.
   * @param {string} name - Name of the metric
   * @param {number} value - Value of the gauge metric
   * @param {object} options
   */
  public measure(name: string, value: number, options?: MeasurementOptions): void {
    if (this.config?.simulate) {
      return;
    }

    const optionsWithDefaults: MeasurementOptions = {
      source: this.config?.source,
      time: Date.now(),
      ...options,
    };

    this.gaugeCollector.measure({
      name: `${this.config?.prefix ?? ''}${name}`,
      value,
      ...optionsWithDefaults,
    });
  }

  public async annotate(title: string, options: Annotation): Promise<void> {
    if (this.config?.simulate) {
      return;
    }

    if (!this.config || !this.client) {
      this.emit('error', new Error('Please call init() before calling annotate()'));
      return;
    }

    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const streamName = options.streamName || sanitizeAnnotationStreamName(title);
    const startTimeSeconds = Math.round((options.startTime ?? new Date()).getTime() / 1000);
    const endTimeSeconds = options.endTime ? Math.round(options.endTime.getTime() / 1000) : undefined;

    try {
      await this.client.post(
        `annotations/${streamName}`,
        {
          title: title.substring(0, 255),
          description: options.description,
          start_time: startTimeSeconds,
          end_time: endTimeSeconds,
          source: options.source,
          links: options.links,
        },
        {
          timeout: this.config.timeout,
          // Set abort signal equal to the total time of first request, all retries, and the max delay period between retries (960ms per retry)
          signal: AbortSignal.timeout(this.config.timeout * (this.config.retryCount + 1) + 3000),
        },
      );
    } catch (ex) {
      this.emit('error', ex as Error);
    }
  }

  public flush(): Promise<void> | void {
    if (!this.config || !this.client || this.config.simulate) {
      return;
    }

    const counters = this.counterCollector.flush();
    const gauges = this.gaugeCollector.flush();

    if (!(counters.length || gauges.length)) {
      return;
    }

    return this._sendMetrics({ counters, gauges });
  }

  public async _sendMetrics({ counters, gauges }: SendMetricsParams): Promise<void> {
    if (!this.config || !this.client || this.config.simulate) {
      return;
    }

    if (!this.config.email || !this.config.token) {
      this.emit('error', new Error('Librato metrics disabled: no email or token provided.'));
      return;
    }

    if (!counters.length && !gauges.length) {
      return;
    }

    this.emit('sending', { counters, gauges });

    const startTime = process.hrtime();

    try {
      await this.client.post(
        'metrics',
        {
          counters,
          gauges,
        },
        {
          timeout: this.config.timeout,
          // Set abort signal equal to the total time of first request, all retries (3), and the max delay period between retries (960ms per retry)
          signal: AbortSignal.timeout(this.config.timeout * 4 + 3000),
        },
      );

      const duration = getMillisecondsFromHrTime(startTime);
      this.emit('sent', { counters, gauges, duration });
    } catch (ex) {
      this.emit('error', ex as Error);
    }
  }

  private async run(runTime: number): Promise<void> {
    if (this.config?.simulate) {
      return;
    }

    if (!this.config) {
      this.emit('error', new Error('Please call init()'));
      return;
    }

    const timeBeforeFlush = Date.now();

    if (timeBeforeFlush >= runTime) {
      await this.flush();
    }

    if (!this.isEnding) {
      let nextRunTime = runTime;
      while (nextRunTime <= timeBeforeFlush) {
        nextRunTime += this.config.period;
      }

      const now = Date.now();
      if (nextRunTime > now) {
        this.startTimeout = setTimeout(() => {
          if (!this.isEnding) {
            this.run(nextRunTime).catch((ex: unknown) => this.emit('error', ex as Error));
          }
        }, nextRunTime - Date.now());
      }
    }
  }
}
