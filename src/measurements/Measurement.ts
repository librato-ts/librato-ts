export interface Measurement {
  /**
   * The unique identifying name of the property being tracked. The metric name is used both to create new measurements and query existing measurements. Must be 255 or fewer characters, and may only consist of ‘A-Za-z0-9.:-_’. The metric namespace is case-insensitive.
   */
  name: string;
  /**
   * Unix Time (epoch seconds). This defines the time that a measurement is recorded at. It is useful when sending measurements from multiple hosts to align them on a given time boundary, eg. time=floor(Time.now, 60) to align samples on a 60-second tick.
   */
  time?: number;
  /**
   * Define the period for the metric. This will be persisted for new metrics and used as the metric period for metrics marked for Service-Side Aggregation.
   */
  period?: number;
  /**
   * Source dimension
   * @deprecated - Legacy approach for adding a dimension to a metric. Accounts created after January 24th, 2017 12:00 PST should use tags instead. See https://www.librato.com/docs/kb/faq/account_questions/tags_or_sources/ for more information.
   */
  source?: string;
  /**
   * A set of key/value pairs that describe the particular data stream. Tags behave as extra dimensions that data streams can be filtered and aggregated along.
   *
   * Tag names must match the regular expression /\A[-.:_\w]{1,64}\z/. Tag names are always converted to lower case.
   *
   * Tag values must match the regular expression /\A[-.:_?\\\/\w ]{1,255}\z/. Tag values are always converted to lower case.
   *
   * Data streams have a default limit of 50 tag names per measurement.
   *
   * Users should be mindful of the maximum cardinality of their full tag set over all measurements.
   * Each unique set of pairs is a new unique stream and is billed as such.
   * The full cardinality of a metric is the permutation of all possible values of tags over the billing period.
   * For example, if you have two tags on your measurements and the first tag has 20 possible values and the second tag has 30 possible values,
   * then your potential tag cardinality could be 20 * 30 => 600 data streams.
   * This would be billed as 600 individual streams over the billing duration of one hour.
   */
  tags?: Record<string, string>;
}
