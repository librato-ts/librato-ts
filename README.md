# librato-ts

[![NPM version](https://img.shields.io/npm/v/librato-ts.svg?style=flat)](https://npmjs.org/package/librato-ts)
[![node version](https://img.shields.io/node/v/librato-ts.svg?style=flat)](https://nodejs.org)
[![Known Vulnerabilities](https://snyk.io/test/npm/librato-ts/badge.svg)](https://snyk.io/test/npm/librato-ts)

Client for [Librato Metrics](http://metrics.librato.com/)

## Getting Started

### Install

```sh
npm install librato-ts
```

### Setup

Once `librato.init()` is called, aggregated stats will be sent to Librato once every 60 seconds.

```ts
import { Librato } from 'librato-ts';

const librato = new Librato();
librato.init({
  email: 'foo@bar.com',
  token: 'ABC123',
});

process.once('SIGINT', async function () {
  // Send any pending metrics to Librato and stop the interval timer
  await librato.end();
});

// Handle errors
librato.on('error', function (err) {
  console.error(err);
});
```

### Testing support

To support testing scenarios and prevent metrics from leaking to Librato, you can initialize the client with the simulate option:

```ts
import { Librato } from 'librato-ts';

const librato = new Librato();
librato.init({
  simulate: true,
});

// This will be ignored
librato.increment('foo');
```

## Counter measurements

A value that accumulates over time – you can think of this like an odometer on a car; it only ever goes up.

```ts
import { Librato } from 'librato-ts';
const librato = new Librato();
librato.init({
  email: 'foo@bar.com',
  token: 'ABC123',
});

// Increment by 1
librato.increment('foo');

// Increment by 5
librato.increment('foo', 5);

// Specify a source for the measurement
librato.increment('foo', 2, { source: 'bar' });

// Specify custom tags for the measurement
librato.increment('foo', 1, {
  tags: {
    foo: 'bar',
  },
});
```

## Gauge Measurements

A gauge measurement represents a snapshot of a value at a specific moment in time, like the amount of free memory on a server.

```ts
import { Librato } from 'librato-ts';
const librato = new Librato();
librato.init({
  email: 'foo@bar.com',
  token: 'ABC123',
});

librato.measure('free-memory', 1024); // 1024 bytes

// Specify a source for the measurement
librato.measure('foo', 250, { source: 'bar' });

// Specify custom tags for the measurement
librato.measure('foo', 250, {
  tags: {
    foo: 'bar',
  },
});
```

## Annotations

An annotation is a descriptive label or note applied to specific points in time, providing context or additional
information about events, changes, or noteworthy occurrences within the metric data.

Librato allows grouping multiple annotations under a stream name, similar to a metric name. If the stream name is
not specified, the title will be used.

```ts
import { Librato } from 'librato-ts';
const librato = new Librato();
librato.init({
  email: 'foo@bar.com',
  token: 'ABC123',
});

librato.annotate('Noting unique period of time');

// Specify a stream name for the annotation
librato.measure(`Deployment: ${version}`, {
  streamName: 'product_deployments',
});

// Specify custom start and end dates for the annotation
librato.measure('foo', {
  streamName: 'foobar',
  start: new Date('2020-01-01'),
  end: new Date('2020-01-02'),
});
```

## Advanced

### Period

By default, librato-ts publishes data every 60 seconds. This can be overwritten with the constructor arguments:

```ts
import { Librato } from 'librato-ts';
const librato = new Librato();
librato.init({
  email: 'foo@bar.com',
  token: 'ABC123',
  period: 30_000, // 30 seconds
});
```

### Timeout

By default, attempts to publish metrics to Librato will time out after 59 seconds. This can be overwritten with the constructor arguments:

```ts
import { Librato } from 'librato-ts';
const librato = new Librato();
librato.init({
  email: 'foo@bar.com',
  token: 'ABC123',
  timeout: 10_000, // 10 seconds
});
```
