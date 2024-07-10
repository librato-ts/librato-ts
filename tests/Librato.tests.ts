import assert from 'node:assert';

import * as chai from 'chai';
import * as sinon from 'sinon';

import type { SingleMeasurement } from '../src/index.js';
import { Librato } from '../src/Librato.js';

describe('Librato', () => {
  before(() => {
    chai.should();
  });

  it('should not send metrics if simulate=true', async () => {
    const librato = new Librato();
    librato.init({
      simulate: true,
    });
    const sendMetricsStub = sinon.stub(librato, '_sendMetrics').resolves();

    librato.increment('test');
    librato.measure('foo', 42);

    await librato.flush();

    sendMetricsStub.restore();
    sendMetricsStub.calledOnce.should.equal(false);
  });

  it('should accumulate metrics even if not initialized', async () => {
    const librato = new Librato();
    const sendMetricsStub = sinon.stub(librato, '_sendMetrics').resolves();

    librato.increment('test');
    librato.measure('foo', 42);

    librato.init({
      email: '',
      token: '',
    });
    await librato.flush();

    sendMetricsStub.restore();
    sendMetricsStub.calledOnce.should.equal(true);
    sendMetricsStub.firstCall.args[0].counters.should.have.length(1);
    assert(sendMetricsStub.firstCall.args[0].counters[0]);
    sendMetricsStub.firstCall.args[0].counters[0].name.should.equal('test');
    sendMetricsStub.firstCall.args[0].counters[0].value.should.equal(1);
    sendMetricsStub.firstCall.args[0].gauges.should.have.length(1);
    assert(sendMetricsStub.firstCall.args[0].gauges[0]);
    sendMetricsStub.firstCall.args[0].gauges[0].name.should.equal('foo');
    (sendMetricsStub.firstCall.args[0].gauges[0] as SingleMeasurement).value.should.equal(42);
  });

  describe('increment', () => {
    it('should allow increment with options', async () => {
      const librato = new Librato();
      librato.init({
        email: '',
        token: '',
      });
      const sendMetricsStub = sinon.stub(librato, '_sendMetrics').resolves();

      librato.increment('test', {
        source: 'foo',
      });

      await librato.flush();

      sendMetricsStub.restore();
      sendMetricsStub.calledOnce.should.equal(true);
      sendMetricsStub.restore();
      sendMetricsStub.calledOnce.should.equal(true);
      sendMetricsStub.firstCall.args[0].counters.should.have.length(1);
      assert(sendMetricsStub.firstCall.args[0].counters[0]);
      sendMetricsStub.firstCall.args[0].counters[0].name.should.equal('test');
      sendMetricsStub.firstCall.args[0].counters[0].value.should.equal(1);
      assert(sendMetricsStub.firstCall.args[0].counters[0].source);
      sendMetricsStub.firstCall.args[0].counters[0].source.should.equal('foo');
    });

    it('should allow increment with a custom value', async () => {
      const librato = new Librato();
      librato.init({
        email: '',
        token: '',
      });
      const sendMetricsStub = sinon.stub(librato, '_sendMetrics').resolves();

      librato.increment('test', 42);

      await librato.flush();

      sendMetricsStub.restore();
      sendMetricsStub.calledOnce.should.equal(true);
      sendMetricsStub.restore();
      sendMetricsStub.calledOnce.should.equal(true);
      sendMetricsStub.firstCall.args[0].counters.should.have.length(1);
      assert(sendMetricsStub.firstCall.args[0].counters[0]);
      sendMetricsStub.firstCall.args[0].counters[0].name.should.equal('test');
      sendMetricsStub.firstCall.args[0].counters[0].value.should.equal(42);
    });

    it('should allow increment with a custom value and options', async () => {
      const librato = new Librato();
      librato.init({
        email: '',
        token: '',
      });
      const sendMetricsStub = sinon.stub(librato, '_sendMetrics').resolves();

      librato.increment('test', 42, {
        source: 'foo',
      });

      await librato.flush();

      sendMetricsStub.restore();
      sendMetricsStub.calledOnce.should.equal(true);
      sendMetricsStub.restore();
      sendMetricsStub.calledOnce.should.equal(true);
      sendMetricsStub.firstCall.args[0].counters.should.have.length(1);
      assert(sendMetricsStub.firstCall.args[0].counters[0]);
      sendMetricsStub.firstCall.args[0].counters[0].name.should.equal('test');
      sendMetricsStub.firstCall.args[0].counters[0].value.should.equal(42);
      assert(sendMetricsStub.firstCall.args[0].counters[0].source);
      sendMetricsStub.firstCall.args[0].counters[0].source.should.equal('foo');
    });
  });
});
