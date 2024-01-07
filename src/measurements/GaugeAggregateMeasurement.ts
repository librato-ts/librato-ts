import type { Measurement } from './Measurement';

export interface GaugeAggregateMeasurement extends Measurement {
  /**
   * Indicates the request corresponds to a multi-sample measurement.
   */
  count: number;
  /**
   * The summation of the individual measurements. The combination of count and sum are used to calculate an average value for the recorded metric measurement.
   */
  sum: number;
  /**
   * Used to report the largest individual measurement amongst the averaged set.
   */
  max: number;
  /**
   * Used to report the smallest individual measurement amongst the averaged set.
   */
  min: number;
  /**
   * Represents the last value seen in the interval. Useful when tracking derivatives over points in time.
   */
  last: number;
  /**
   * Represents the population standard deviation of the sample set.
   */
  stddev?: number;
}
