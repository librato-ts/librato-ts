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

Once `librato.start` is called, aggregated stats will be sent to Librato once every 60 seconds.

```ts
import { Librato } from 'librato-ts';

const librato = new librato({
  email: 'foo@bar.com',
  token: 'ABC123',
});
librato.start();

process.once('SIGINT', async function () {
  // Send any pending metrics to Librato and stop the interval timer
  await librato.end();
});

// Handle errors
librato.on('error', function (err) {
  console.error(err);
});
```

### Counter measurements

A value that accumulates over time – you can think of this like an odometer on a car; it only ever goes up.

```ts
import { Librato } from 'librato-ts';
const librato = new librato({
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

### Gauge Measurements

A gauge measurement represents a snapshot of a value at a specific moment in time, like the amount of free memory on a server.

```ts
import { Librato } from 'librato-ts';
const librato = new librato({
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

### Advanced

#### Period

By default, librato-ts publishes data every 60 seconds. This can be overwritten with the constructor arguments:

```ts
import { Librato } from 'librato-ts';
const librato = new librato({
  email: 'foo@bar.com',
  token: 'ABC123',
  period: 30_000, // 30 seconds
});
```

#### Timeout

By default, attempts to publish metrics to Librato will time out after 30 seconds. This can be overwritten with the constructor arguments:

```ts
import { Librato } from 'librato-ts';
const librato = new librato({
  email: 'foo@bar.com',
  token: 'ABC123',
  timeout: 10_000, // 10 seconds
});
```
