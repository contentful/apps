export const translateRemToPx = (remValue: number): number => {
  return 16 * remValue;
};

const parseStylingToken =
  (parsingUnit: string) =>
  (value: string): number => {
    const parsedValue = value.split(`${parsingUnit}`)[0];
    const intValue = Number(parsedValue);
    if (parsingUnit === 'rem') return translateRemToPx(intValue);
    return intValue;
  };

export const parseRemToPxInt = parseStylingToken('rem');
export const parsePxToInt = parseStylingToken('px');

export default parseStylingToken;
