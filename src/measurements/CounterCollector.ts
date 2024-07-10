import { sanitizeMeasurementName, sanitizeTags } from '../Helpers.js';

import type { Measurement } from './Measurement.js';
import type { SingleMeasurement } from './SingleMeasurement.js';

export class CounterCollector {
  private cache = new Map<string, SingleMeasurement>();

  public increment(measurement: Measurement & Partial<SingleMeasurement>): void {
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
      existingItem.value += measurement.value ?? 1;
      existingItem.period ??= measurement.period;
      existingItem.time ??= measurement.time;
    } else {
      this.cache.set(key, {
        value: 1,
        ...measurement,
      });
    }
  }

  public flush(): SingleMeasurement[] {
    const measurements: SingleMeasurement[] = [];
    for (const measurement of this.cache.values()) {
      const singleMeasurement: SingleMeasurement = {
        ...measurement,
        name: sanitizeMeasurementName(measurement.name),
        source: measurement.source ? sanitizeMeasurementName(measurement.source) : undefined,
        tags: sanitizeTags(measurement.tags),
      };

      measurements.push(singleMeasurement);
    }

    this.cache.clear();

    return measurements;
  }
}
