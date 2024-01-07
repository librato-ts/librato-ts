import { EventEmitter } from 'node:events';
import { setTimeout } from 'node:timers/promises';

import type { AxiosInstance } from 'axios';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import type { StrictEventEmitter } from 'strict-event-emitter-types';

import { version } from '../package.json';

import type { ClientConfig, SimulateConfig } from './LibratoConfig';
import type { Measurement, SingleMeasurement } from './measurements';
import { CounterCollector, GaugeCollector } from './measurements/index.js';

interface LibratoEvents {
  error: (error: Error) => void;
}

type LibratoEventEmitter = StrictEventEmitter<EventEmitter, LibratoEvents>;

type MeasurementOptions = Omit<Measurement, 'name'>;

export class Librato extends (EventEmitter as new () => LibratoEventEmitter) {
  private client: AxiosInstance;

  private config: SimulateConfig | (ClientConfig & Required<Pick<ClientConfig, 'period' | 'timeout'>>);

  private counterCollector = new CounterCollector();

  private gaugeCollector = new GaugeCollector();

  private isEnding = false;

  private startTimeout?: NodeJS.Timeout;

  public constructor(config: ClientConfig | SimulateConfig) {
    super();

    this.config = {
      period: 60_000,
      timeout: 30_000,
      ...(config as ClientConfig),
    };

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
      retryDelay: (retryCount) => axiosRetry.exponentialDelay(retryCount),
    });
  }

  /**
   * Starts sending measurements to Librato.
   */
  public start(): Promise<void> | void {
    this.isEnding = false;

    if (this.config.simulate) {
      return;
    }

    // Try to sync when metrics are sent to Librato so periods match across systems
    const now = Date.now();
    const startTime = now + (this.config.period - (now % this.config.period));

    return this.run(startTime);
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
  public increment(name: string, value: MeasurementOptions | number = 1, options?: MeasurementOptions): void {
    if (this.config.simulate) {
      return;
    }

    if (typeof value === 'object') {
      options = value;
      value = 1;
    }

    const optionsWithDefaults: MeasurementOptions = {
      source: this.config.source,
      time: Date.now(),
      ...options,
    };

    this.counterCollector.increment({
      name,
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
    if (this.config.simulate) {
      return;
    }

    const optionsWithDefaults: MeasurementOptions = {
      source: this.config.source,
      time: Date.now(),
      ...options,
    };

    this.gaugeCollector.measure({
      name,
      value,
      ...optionsWithDefaults,
    });
  }

  public flush(): Promise<void> | void {
    if (this.config.simulate) {
      return;
    }

    const counters = this.counterCollector.flush();
    const gauges = this.gaugeCollector.flush();

    if (!(counters.length || gauges.length)) {
      return;
    }

    return this._sendMetrics({ counters, gauges });
  }

  public async _sendMetrics({ counters, gauges }: { counters: SingleMeasurement[]; gauges: Measurement[] }): Promise<void> {
    if (this.config.simulate) {
      return;
    }

    if (!this.config.email || !this.config.token) {
      this.emit('error', new Error('Librato metrics disabled: no email or token provided.'));
      return;
    }

    if (!counters.length && !gauges.length) {
      return;
    }

    try {
      await this.client.post(
        'metrics',
        {
          counters,
          gauges,
        },
        {
          timeout: this.config.timeout,
          signal: AbortSignal.timeout(this.config.timeout),
        },
      );
    } catch (ex) {
      this.emit('error', ex as Error);
    }
  }

  private async run(runTime: number): Promise<void> {
    if (this.config.simulate) {
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
        this.startTimeout = await setTimeout(nextRunTime - Date.now());
      }

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!this.isEnding) {
        await this.run(nextRunTime);
      }
    }
  }
}
