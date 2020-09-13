export default function showValue(value: unknown, remainingDepth: number = 3): string {
  switch (typeof value) {
    case 'bigint':
    case 'boolean':
    case 'number':
      return `${value}`;
    case 'string':
      return JSON.stringify(value);
    case 'function':
    case 'symbol':
    case 'undefined':
      return typeof value;
    case 'object':
      if (value === null) {
        return 'null';
      }
      if (Array.isArray(value)) {
        if (remainingDepth === 0) {
          return '[Array]';
        } else {
          return `[${value.map(v => showValue(v, remainingDepth - 1)).join(', ')}]`;
        }
      }
      if (remainingDepth === 0) {
        return '{Object}';
      } else {
        return `{${Object.entries(value)
          .map(
            ([key, v]) =>
              `${/\s/.test(key) ? JSON.stringify(key) : key}: ${showValue(v, remainingDepth - 1)}`,
          )
          .join(', ')}}`;
      }
  }
}
export function showValueNonString(value: unknown): string {
  return `${showValue(value)}${typeof value === 'string' ? ` (i.e. a string literal)` : ``}`;
}
