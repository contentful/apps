import { describe, expect, it } from 'vitest';
import { describeItem, getItemStatus, itemKey, localize, makeSelectText } from './resources';

describe('localize', () => {
  const name = { default: 'Shirt', en_GB: 'Jumper', fr: 'Chemise' };

  it('matches the Contentful locale against SFCC locale keys', () => {
    expect(localize(name, 'en-GB')).toBe('Jumper');
    expect(localize(name, 'fr-CA')).toBe('Chemise');
  });

  it('falls back to default, then any value', () => {
    expect(localize(name, 'de-DE')).toBe('Shirt');
    expect(localize({ it: 'Camicia' }, 'de-DE')).toBe('Camicia');
    expect(localize(undefined)).toBeUndefined();
    expect(localize('Plain')).toBe('Plain');
  });
});

describe('getItemStatus', () => {
  const now = new Date('2026-10-01T00:00:00Z');

  it('flags offline and out-of-stock products', () => {
    const labels = getItemStatus('product', { id: 'p', online: false, inStock: false }, now).map(
      (s) => s.label
    );
    expect(labels).toEqual(['Offline', 'Out of stock']);
  });

  it('flags ended and future campaigns', () => {
    expect(
      getItemStatus('campaign', { id: 'c', endDate: '2026-09-01T00:00:00Z' }, now)[0].label
    ).toBe('Ended');
    expect(
      getItemStatus('campaign', { id: 'c', startDate: '2026-12-01T00:00:00Z' }, now)[0].label
    ).toBe('Not started');
  });

  it('flags disabled or archived promotions and coupons', () => {
    expect(getItemStatus('promotion', { id: 'p', archived: true }, now)[0].label).toBe('Archived');
    expect(getItemStatus('coupon', { id: 'c', enabled: false }, now)[0].label).toBe('Disabled');
  });

  it('returns nothing for healthy items', () => {
    expect(getItemStatus('product', { id: 'p', online: true, inStock: true }, now)).toEqual([]);
  });
});

describe('item helpers', () => {
  it('keys categories by catalog and everything else by id', () => {
    expect(itemKey('category', { id: 'mens', catalogId: 'storefront' })).toBe('storefront:mens');
    expect(itemKey('customerGroup', { id: 'vip' })).toBe('vip');
  });

  it('builds select labels per type', () => {
    expect(makeSelectText(false, 'customerGroup')).toBe('Select a customer group');
    expect(makeSelectText(true, 'category')).toBe('Select categories');
  });

  it('shows variation values and price for products', () => {
    const { detail } = describeItem('product', {
      id: 'p',
      price: 10,
      priceCurrency: 'USD',
      variationValues: { color: 'Red', size: 'M' },
    });
    expect(detail).toContain('Red / M');
    expect(detail).toContain('10');
  });

  it('shows the code for coupons', () => {
    expect(describeItem('coupon', { id: 'c', code: 'SAVE10' }).detail).toContain('Code: SAVE10');
  });
});
