import { pathJoin } from './pathJoin';

describe('pathJoin', () => {
  it('combines paths into a whole', () => {
    const result = pathJoin('a', 'b/c', 'd');
    expect(result).toEqual('a/b/c/d');
  });

  it('takes care of extra / characters in the front or back', () => {
    const result = pathJoin('/a/', '//b/', 'c/');
    expect(result).toEqual('a/b/c');
  });

  it('takes care of miscellaneous empty strings', () => {
    const result = pathJoin('/a/', '//b/', '', '/', 'c/');
    expect(result).toEqual('a/b/c');
  });

  it('takes care of miscellaneous empty strings and undefineds', () => {
    const result = pathJoin('/a/', '//b/', '', '/', undefined, 'c/');
    expect(result).toEqual('a/b/c');
  });
});
