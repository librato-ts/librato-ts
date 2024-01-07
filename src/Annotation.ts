export interface Annotation {
  /**
   * The description contains extra metadata about a particular annotation.
   * E.g. `Deployed 9b562b2: shipped new feature foo!`
   */
  description?: string;
  /**
   * The unix timestamp indicating the time at which the event referenced by this annotation started.
   * By default, this is set to the current time if not specified.
   */
  startTime?: Date;
  /**
   * The unix timestamp indicating the time at which the event referenced by this annotation ended. For events that
   * have a duration, this is a useful way to annotate the duration of the event.
   */
  endTime?: Date;
  /**
   * Metric stream name used to categorize annotations. If not specified, the title of the annotation is used.
   */
  streamName?: string;
  /**
   * An optional list of references to resources associated with the particular annotation.
   * For example, these links could point to a build page in a CI system or a changeset description of an SCM.
   */
  links?: AnnotationLink[];
  /**
   * A string which describes the originating source of an annotation when that annotation is tracked across
   * multiple members of a population.
   */
  source?: string;
}

export interface AnnotationLink {
  href: string;
  label?: string;
  rel?: string;
}
