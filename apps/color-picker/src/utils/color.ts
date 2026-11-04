export function formatHexColor(value: string, enableOpacity: boolean): string {
  const match = /^#([\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.exec(value);
  if (!match) return value;

  let hex = match[1];
  if (hex.length === 3 || hex.length === 4) {
    hex = hex
      .split('')
      .map((character) => character + character)
      .join('');
  }

  if (enableOpacity) {
    return `#${hex.length === 6 ? `${hex}ff` : hex}`;
  }

  return `#${hex.length === 8 ? hex.slice(0, 6) : hex}`;
}
