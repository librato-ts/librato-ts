import { sanitizeMeasurementName, sanitizeTags } from '../Helpers.js';

import type { GaugeAggregateMeasurement } from './GaugeAggregateMeasurement.js';
import type { SingleMeasurement } from './SingleMeasurement.js';

type Measurement = GaugeAggregateMeasurement | SingleMeasurement;

export class GaugeCollector {
  private cache = new Map<string, SingleMeasurement | SingleMeasurement[]>();

  public measure(measurement: SingleMeasurement): void {
    let key = measurement.name;
    if (measurement.tags) {
      for (const [tagName, tagValue] of Object.entries(measurement.tags)) {
        key += `;tag_${tagName};${tagValue}`;
      }
    }

    if (measurement.source) {
      key += `;source_${measurement.source}`;
    }

    const existingItem = this.cache.get(key);
    if (existingItem) {
      if (Array.isArray(existingItem)) {
        existingItem.push(measurement);
      } else {
        this.cache.set(key, [existingItem, measurement]);
      }
    } else {
      this.cache.set(key, measurement);
    }
  }

  public flush(): Measurement[] {
    const measurements: Measurement[] = [];
    for (const measurement of this.cache.values()) {
      if (Array.isArray(measurement)) {
        let name = '';
        let period: SingleMeasurement['period'];
        let time: SingleMeasurement['time'];
        let tags: SingleMeasurement['tags'];
        let source: SingleMeasurement['source'];
        let sum = 0;
        const values: number[] = [];
        let lastValue = 0;
        for (const measure of measurement) {
          name = measure.name;
          period ??= measure.period;
          time ??= measure.time;
          tags ??= measure.tags;
          source ??= measure.source;
          sum += measure.value;
          values.push(measure.value);
          lastValue = measure.value;
        }

        // Build aggregate summary
        const aggregateMeasurement: GaugeAggregateMeasurement = {
          name: sanitizeMeasurementName(name),
          count: measurement.length,
          sum,
          min: Math.min(...values),
          max: Math.max(...values),
          last: lastValue,
          period,
          time,
          source: source ? sanitizeMeasurementName(source) : undefined,
          tags: sanitizeTags(tags),
        };

        // Calculate standard deviation
        const mean = sum / measurement.length;
        const squaredDifferences = values.map((value) => (value - mean) ** 2);
        let sumSquaredDifferences = 0;
        for (const value of squaredDifferences) {
          sumSquaredDifferences += value;
        }

        const variance = sumSquaredDifferences / measurement.length;
        aggregateMeasurement.stddev = Math.sqrt(variance);

        measurements.push(aggregateMeasurement);
      } else {
        const singleMeasurement: SingleMeasurement = {
          ...measurement,
          name: sanitizeMeasurementName(measurement.name),
          source: measurement.source ? sanitizeMeasurementName(measurement.source) : undefined,
          tags: sanitizeTags(measurement.tags),
        };

        measurements.push(singleMeasurement);
      }
    }

    this.cache.clear();

    return measurements;
  }
}
