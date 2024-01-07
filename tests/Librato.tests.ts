import chai from 'chai';
import * as sinon from 'sinon';

import { Librato } from '../src/Librato.js';

describe('Librato', () => {
  before(() => {
    chai.should();
  });

  it('should not send metrics if simulate=true', async () => {
    const librato = new Librato({
      simulate: true,
    });
    const sendMetricsStub = sinon.stub(librato, '_sendMetrics').resolves();

    librato.increment('test');
    librato.measure('foo', 42);

    await librato.flush();

    sendMetricsStub.restore();
    sendMetricsStub.calledOnce.should.equal(false);
  });
  it('should accumulate metrics even if not started', async () => {
    const librato = new Librato({
      email: '',
      token: '',
    });
    const sendMetricsStub = sinon.stub(librato, '_sendMetrics').resolves();

    librato.increment('test');
    librato.measure('foo', 42);

    await librato.flush();

    sendMetricsStub.restore();
    sendMetricsStub.calledOnce.should.equal(true);
    sendMetricsStub.firstCall.args[0].counters.should.have.length(1);
    sendMetricsStub.firstCall.args[0].counters[0].name.should.equal('test');
    sendMetricsStub.firstCall.args[0].counters[0].value.should.equal(1);
    sendMetricsStub.firstCall.args[0].gauges.should.have.length(1);
    sendMetricsStub.firstCall.args[0].gauges[0].name.should.equal('foo');
    sendMetricsStub.firstCall.args[0].gauges[0].value.should.equal(42);
  });
});
