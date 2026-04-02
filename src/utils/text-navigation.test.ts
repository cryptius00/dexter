import { describe, test, expect } from 'bun:test';
import {
  getLineAndColumn,
  getCursorPosition,
  getLineStart,
  getLineEnd,
  getLineCount,
  findPrevWordStart,
  findNextWordEnd
} from './text-navigation.js';

describe('text-navigation utilities', () => {
  describe('getLineAndColumn', () => {
    test('works for single line', () => {
      const text = 'hello world';
      expect(getLineAndColumn(text, 0)).toEqual({ line: 0, column: 0 });
      expect(getLineAndColumn(text, 5)).toEqual({ line: 0, column: 5 });
      expect(getLineAndColumn(text, 11)).toEqual({ line: 0, column: 11 });
    });

    test('works for multiple lines', () => {
      const text = 'line1\nline2\nline3';
      // 'line1' is length 5. \n is at pos 5.
      expect(getLineAndColumn(text, 0)).toEqual({ line: 0, column: 0 });
      expect(getLineAndColumn(text, 5)).toEqual({ line: 0, column: 5 });
      expect(getLineAndColumn(text, 6)).toEqual({ line: 1, column: 0 });
      expect(getLineAndColumn(text, 11)).toEqual({ line: 1, column: 5 });
      expect(getLineAndColumn(text, 12)).toEqual({ line: 2, column: 0 });
      expect(getLineAndColumn(text, 17)).toEqual({ line: 2, column: 5 });
    });

    test('works with empty text', () => {
      expect(getLineAndColumn('', 0)).toEqual({ line: 0, column: 0 });
    });

    test('works with only newlines', () => {
      const text = '\n\n';
      expect(getLineAndColumn(text, 0)).toEqual({ line: 0, column: 0 });
      expect(getLineAndColumn(text, 1)).toEqual({ line: 1, column: 0 });
      expect(getLineAndColumn(text, 2)).toEqual({ line: 2, column: 0 });
    });
  });

  describe('findPrevWordStart', () => {
    test('finds start of word from within word', () => {
      const text = 'hello world';
      expect(findPrevWordStart(text, 5)).toBe(0); // at ' ' after 'hello'
      expect(findPrevWordStart(text, 11)).toBe(6); // at end of 'world'
    });

    test('skips whitespace and non-word characters', () => {
      const text = 'hello   world';
      expect(findPrevWordStart(text, 8)).toBe(0); // from ' ' before 'world'
    });

    test('returns 0 at start of text', () => {
      expect(findPrevWordStart('hello', 0)).toBe(0);
    });
  });

  describe('findNextWordEnd', () => {
    test('finds end of word from within word', () => {
      const text = 'hello world';
      expect(findNextWordEnd(text, 0)).toBe(5);
      expect(findNextWordEnd(text, 6)).toBe(11);
    });

    test('skips whitespace and non-word characters', () => {
      const text = 'hello   world';
      expect(findNextWordEnd(text, 5)).toBe(13);
    });

    test('returns text length at end of text', () => {
      const text = 'hello';
      expect(findNextWordEnd(text, 5)).toBe(5);
    });
  });

  describe('getCursorPosition', () => {
    test('calculates correct position for single line', () => {
      const text = 'hello';
      expect(getCursorPosition(text, 0, 0)).toBe(0);
      expect(getCursorPosition(text, 0, 3)).toBe(3);
      expect(getCursorPosition(text, 0, 5)).toBe(5);
      expect(getCursorPosition(text, 0, 10)).toBe(5); // Clamped
    });

    test('calculates correct position for multi-line', () => {
      const text = 'line1\nline2\nline3';
      expect(getCursorPosition(text, 0, 5)).toBe(5);
      expect(getCursorPosition(text, 1, 0)).toBe(6);
      expect(getCursorPosition(text, 1, 5)).toBe(11);
      expect(getCursorPosition(text, 2, 0)).toBe(12);
    });
  });

  describe('getLineStart', () => {
    test('returns correct line start', () => {
      const text = 'line1\nline2\nline3';
      expect(getLineStart(text, 0)).toBe(0);
      expect(getLineStart(text, 3)).toBe(0);
      expect(getLineStart(text, 6)).toBe(6);
      expect(getLineStart(text, 10)).toBe(6);
      expect(getLineStart(text, 12)).toBe(12);
    });
  });

  describe('getLineEnd', () => {
    test('returns correct line end', () => {
      const text = 'line1\nline2\nline3';
      expect(getLineEnd(text, 0)).toBe(5);
      expect(getLineEnd(text, 3)).toBe(5);
      expect(getLineEnd(text, 6)).toBe(11);
      expect(getLineEnd(text, 12)).toBe(17);
    });
  });

  describe('getLineCount', () => {
    test('returns correct line count', () => {
      expect(getLineCount('')).toBe(1);
      expect(getLineCount('line1')).toBe(1);
      expect(getLineCount('line1\nline2')).toBe(2);
      expect(getLineCount('line1\nline2\n')).toBe(3);
    });
  });
});
