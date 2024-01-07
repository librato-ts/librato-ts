export function getMillisecondsFromHrTime(hrtime: [number, number]): number {
  const [sec, usec] = process.hrtime(hrtime);
  return sec * 1000 + Math.max(usec / 1000 / 1000);
}

export function sanitizeMeasurementName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_.:-]/g, '_').substring(0, 255);
}

export function sanitizeAnnotationStreamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .substring(0, 255);
}

export function sanitizeTagName(name: string): string {
  return name.replace(/[^-.:_\w]/g, '_').substring(0, 64);
}

export function sanitizeTagValue(name: string): string {
  return name.replace(/[^-.:_?\\/\w ]/g, '').substring(0, 255);
}

export function sanitizeTags(tags?: Record<string, string>): Record<string, string> | undefined {
  if (!tags) {
    return tags;
  }

  const sanitizedTags: Record<string, string> = {};
  for (const [key, value] of Object.entries(tags)) {
    sanitizedTags[sanitizeTagName(key)] = sanitizeTagValue(value);
  }

  return sanitizedTags;
}
