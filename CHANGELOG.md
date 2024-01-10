# Change Log

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
