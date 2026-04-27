import { describe, test, expect } from 'bun:test';
import {
  findPrevWordStart,
  findNextWordEnd,
  getLineAndColumn,
  getCursorPosition,
  getLineStart,
  getLineEnd,
  getLineCount,
} from './text-navigation.js';

describe('text-navigation', () => {
  describe('findPrevWordStart', () => {
    test('returns 0 if at start of text', () => {
      expect(findPrevWordStart('hello', 0)).toBe(0);
      expect(findPrevWordStart('hello', -1)).toBe(0);
    });

    test('navigates to start of current word if in middle', () => {
      expect(findPrevWordStart('hello', 3)).toBe(0);
    });

    test('navigates to start of previous word if at start of a word', () => {
      expect(findPrevWordStart('hello world', 6)).toBe(0);
    });

    test('skips spaces and navigates to start of previous word', () => {
      expect(findPrevWordStart('hello   world', 11)).toBe(8); // Start of 'world'
      expect(findPrevWordStart('hello   world', 8)).toBe(0); // From start of 'world' to start of 'hello'
    });

    test('handles only non-word characters', () => {
      expect(findPrevWordStart('   ', 3)).toBe(0);
      expect(findPrevWordStart('!!!', 3)).toBe(0);
    });

    test('handles empty string', () => {
      expect(findPrevWordStart('', 0)).toBe(0);
    });
  });

  describe('findNextWordEnd', () => {
    test('returns length if at end of text', () => {
      expect(findNextWordEnd('hello', 5)).toBe(5);
      expect(findNextWordEnd('hello', 6)).toBe(5);
    });

    test('navigates to end of current word if in middle', () => {
      expect(findNextWordEnd('hello', 2)).toBe(5);
    });

    test('navigates to end of next word if at end of a word', () => {
      expect(findNextWordEnd('hello world', 5)).toBe(11);
    });

    test('skips spaces and navigates to end of next word', () => {
      expect(findNextWordEnd('hello   world', 5)).toBe(13);
    });

    test('handles only non-word characters', () => {
      expect(findNextWordEnd('   ', 0)).toBe(3);
    });

    test('handles empty string', () => {
      expect(findNextWordEnd('', 0)).toBe(0);
    });
  });

  describe('getLineAndColumn', () => {
    const text = 'line1\nline2\nline3';

    test('handles first line', () => {
      expect(getLineAndColumn(text, 0)).toEqual({ line: 0, column: 0 });
      expect(getLineAndColumn(text, 3)).toEqual({ line: 0, column: 3 });
    });

    test('handles middle line', () => {
      expect(getLineAndColumn(text, 6)).toEqual({ line: 1, column: 0 });
      expect(getLineAndColumn(text, 8)).toEqual({ line: 1, column: 2 });
    });

    test('handles last line', () => {
      expect(getLineAndColumn(text, 12)).toEqual({ line: 2, column: 0 });
      expect(getLineAndColumn(text, 17)).toEqual({ line: 2, column: 5 });
    });
  });

  describe('getCursorPosition', () => {
    const text = 'abc\ndef\nghi';

    test('converts line and column to position', () => {
      expect(getCursorPosition(text, 0, 0)).toBe(0);
      expect(getCursorPosition(text, 0, 2)).toBe(2);
      expect(getCursorPosition(text, 1, 0)).toBe(4);
      expect(getCursorPosition(text, 1, 2)).toBe(6);
      expect(getCursorPosition(text, 2, 3)).toBe(11);
    });

    test('clamps column to line length', () => {
      expect(getCursorPosition(text, 0, 10)).toBe(3);
      expect(getCursorPosition(text, 1, 10)).toBe(7);
    });

    test('handles line out of bounds', () => {
      expect(getCursorPosition(text, 5, 0)).toBe(11);
    });
  });

  describe('getLineStart', () => {
    const text = 'line1\nline2\nline3';

    test('returns 0 for first line', () => {
      expect(getLineStart(text, 0)).toBe(0);
      expect(getLineStart(text, 3)).toBe(0);
      expect(getLineStart(text, 5)).toBe(0);
    });

    test('returns start of middle line', () => {
      expect(getLineStart(text, 6)).toBe(6);
      expect(getLineStart(text, 8)).toBe(6);
      expect(getLineStart(text, 11)).toBe(6);
    });
  });

  describe('getLineEnd', () => {
    const text = 'line1\nline2\nline3';

    test('returns end of line before newline', () => {
      expect(getLineEnd(text, 0)).toBe(5);
      expect(getLineEnd(text, 3)).toBe(5);
      expect(getLineEnd(text, 6)).toBe(11);
      expect(getLineEnd(text, 12)).toBe(17);
    });
  });

  describe('getLineCount', () => {
    test('counts lines correctly', () => {
      expect(getLineCount('')).toBe(1);
      expect(getLineCount('one')).toBe(1);
      expect(getLineCount('one\ntwo')).toBe(2);
      expect(getLineCount('one\ntwo\nthree')).toBe(3);
    });
  });
});
