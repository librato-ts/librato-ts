# Change Log

## 1.5.2 - 2024-09-30

- Update npms

## 1.5.1 - 2024-08-26

- Update npms

## 1.5.0 - 2024-07-10

- Update eslint to use flat config
- Update npms

## 1.4.6 - 2024-05-13

- Update npms

## 1.4.5 - 2024-04-08

- Update npms

## 1.4.4 - 2024-03-11

- Update npms

## 1.4.3 - 2024-02-07

- Update npms

## 1.4.2 - 2024-01-13

- Retry requests that timeout or when connection aborts
- Allow configurable retry attempt count

## 1.4.1 - 2024-01-13

- Export interfaces for `sending` and `sent` event parameters

## 1.4.0 - 2024-01-13

- Add `sending` and `sent` events to the Librato class, to allow for listening to when data is sent to Librato

## 1.3.1 - 2024-01-12

- Bump default timeout to 59s
- Reset the timeout for each retry attempt
- Set the abort signal on the request to Librato to be the max amount of time for all retries

## 1.3.0 - 2024-01-10

- Add additional method overload for `increment` to allow for a value and no options object
- Update init() to not return a promise, as it is not needed. A non-promise version of setImmediate is now used to space out sending data to Librato.

## 1.2.0 - 2024-01-09

- Add `prefix` to configuration, allowing a name prefix for all measurements

## 1.1.0 - 2024-01-09

- Combine constructor initialization with starting behavior, in the `init` method

## 1.0.1 - 2024-01-08

- Update npms

## 1.0.0 - 2024-01-07

- Initial release
