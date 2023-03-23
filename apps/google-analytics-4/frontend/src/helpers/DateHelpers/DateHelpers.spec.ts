import { parseDayAndMonth } from './DateHelpers';

describe('parseDayAndMonth method', () => {
  it('parseDayAndMonth returns month name and day', () => {
    const { day, month } = parseDayAndMonth('20230605');

    expect(day).toBe('05');
    expect(month).toBe('Jun');
  });
});
