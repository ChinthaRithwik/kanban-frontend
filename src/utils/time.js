/**
 * timeAgo – convert an ISO date-string to a human-readable relative label.
 *
 * Java's LocalDateTime is serialised by Jackson without a timezone suffix
 * (e.g. "2024-01-15T10:30:00"). Browsers that follow the ECMA-262 spec
 * treat such strings as *local* time rather than UTC, which produces
 * wrong relative labels when the server is in a different timezone.
 * We normalise by appending "Z" (UTC) whenever no timezone is present.
 */
export const timeAgo = (timestamp) => {
  if (!timestamp) return 'Unknown time';

  // Append 'Z' if there is no timezone designator so the browser
  // always parses as UTC, matching the server's LocalDateTime.now() output.
  const StringTimestamp = String(timestamp);
  const hasTimezone = /[Zz]|[+-]\d{2}:?\d{2}$/.test(StringTimestamp);
  const normalised = hasTimezone ? StringTimestamp : StringTimestamp + 'Z';

  const date = new Date(normalised);

  // Guard against unparseable strings (NaN date)
  if (isNaN(date.getTime())) return 'Unknown time';

  const diff = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + ' min ago';
  if (diff < 86400) return Math.floor(diff / 3600) + ' hr ago';
  return Math.floor(diff / 86400) + ' days ago';
};