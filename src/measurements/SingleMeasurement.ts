import type { Measurement } from './Measurement.js';

export interface SingleMeasurement extends Measurement {
  /**
   * The numeric value of a single measured sample.
   */
  value: number;
}
