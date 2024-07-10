import * as chai from 'chai';

import { CounterCollector } from '../../src/measurements/index.js';

describe('CounterCollector', () => {
  const { expect } = chai;

  before(() => {
    chai.should();
  });

  it('should accumulate metrics with the same key', () => {
    const collector = new CounterCollector();
    collector.increment({
      name: 'test',
    });
    collector.increment({
      name: 'test',
      value: 4,
    });
    expect(collector.flush()).to.deep.equal([
      {
        name: 'test',
        value: 5,
        period: undefined,
        source: undefined,
        tags: undefined,
        time: undefined,
      },
    ]);
  });

  it('should accumulate metrics separately if they have different sources', () => {
    const collector = new CounterCollector();
    collector.increment({
      name: 'test',
      source: 'source1',
    });
    collector.increment({
      name: 'test',
      value: 4,
      source: 'source2',
    });
    expect(collector.flush()).to.deep.equal([
      {
        name: 'test',
        value: 1,
        source: 'source1',
        tags: undefined,
      },
      {
        name: 'test',
        value: 4,
        source: 'source2',
        tags: undefined,
      },
    ]);
  });

  it('should clear cached metrics after flush', () => {
    const collector = new CounterCollector();
    collector.increment({
      name: 'test',
    });
    collector.flush().should.have.length(1);
    collector.flush().should.have.length(0);
  });
});
