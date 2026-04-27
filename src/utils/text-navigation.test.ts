import { describe, test, expect } from 'bun:test';
import {
  getLineAndColumn,
  findPrevWordStart,
  findNextWordEnd,
  getCursorPosition,
  getLineStart,
  getLineEnd,
  getLineCount,
} from './text-navigation';

describe('getLineAndColumn', () => {
  const text = 'Line 1\nLine 2\nLine 3';

  test('returns 0,0 for start of text', () => {
    expect(getLineAndColumn(text, 0)).toEqual({ line: 0, column: 0 });
  });

  test('returns correct position within first line', () => {
    expect(getLineAndColumn(text, 4)).toEqual({ line: 0, column: 4 });
  });

  test('returns correct position at start of second line', () => {
    expect(getLineAndColumn(text, 7)).toEqual({ line: 1, column: 0 });
  });

  test('returns correct position within second line', () => {
    expect(getLineAndColumn(text, 10)).toEqual({ line: 1, column: 3 });
  });

  test('returns correct position at end of text', () => {
    expect(getLineAndColumn(text, text.length)).toEqual({ line: 2, column: 6 });
  });

  test('handles empty string', () => {
    expect(getLineAndColumn('', 0)).toEqual({ line: 0, column: 0 });
  });

  test('handles string with only newlines', () => {
    expect(getLineAndColumn('\n\n', 1)).toEqual({ line: 1, column: 0 });
    expect(getLineAndColumn('\n\n', 2)).toEqual({ line: 2, column: 0 });
  });
});

describe('findPrevWordStart', () => {
  const text = 'Hello world! This is a test.';

  test('jumps to start of current word if in middle', () => {
    expect(findPrevWordStart(text, 5)).toBe(0); // 'Hello'
    expect(findPrevWordStart(text, 11)).toBe(6); // 'world'
  });

  test('jumps to start of previous word if at start of word', () => {
    expect(findPrevWordStart(text, 6)).toBe(0); // At 'w', jumps to 'H'
  });

  test('skips punctuation and whitespace', () => {
    expect(findPrevWordStart(text, 13)).toBe(6); // At ' ', skips '!' and ' ', jumps to 'w'
  });

  test('handles start of string', () => {
    expect(findPrevWordStart(text, 0)).toBe(0);
  });

  test('handles multiple non-word chars', () => {
    const multi = 'Hello...   world';
    expect(findPrevWordStart(multi, 16)).toBe(11); // At end of 'world', jumps to 'w'
    expect(findPrevWordStart(multi, 11)).toBe(0); // At 'w', jumps to 'H'
  });
});

describe('findNextWordEnd', () => {
  const text = 'Hello world! This is a test.';

  test('jumps to end of current word if in middle', () => {
    expect(findNextWordEnd(text, 0)).toBe(5); // 'Hello'
    expect(findNextWordEnd(text, 7)).toBe(11); // 'world'
  });

  test('jumps to end of next word if at end of current', () => {
    expect(findNextWordEnd(text, 5)).toBe(11); // At ' ', jumps to 'world'
  });

  test('skips punctuation and whitespace', () => {
    expect(findNextWordEnd(text, 11)).toBe(17); // At '!', jumps to 'This'
  });

  test('handles end of string', () => {
    expect(findNextWordEnd(text, text.length)).toBe(text.length);
  });
});

describe('getCursorPosition', () => {
  const text = 'Line 1\nLine 2\nLine 3';

  test('converts 0,0 to 0', () => {
    expect(getCursorPosition(text, 0, 0)).toBe(0);
  });

  test('converts start of second line correctly', () => {
    expect(getCursorPosition(text, 1, 0)).toBe(7);
  });

  test('converts position within line correctly', () => {
    expect(getCursorPosition(text, 1, 3)).toBe(10);
  });

  test('clamps column to line length', () => {
    expect(getCursorPosition(text, 0, 100)).toBe(6); // 'Line 1'.length is 6
  });

  test('handles line out of range', () => {
    expect(getCursorPosition(text, 5, 0)).toBe(text.length);
  });
});

describe('getLineStart', () => {
  const text = 'Line 1\nLine 2\nLine 3';

  test('returns 0 for first line', () => {
    expect(getLineStart(text, 0)).toBe(0);
    expect(getLineStart(text, 3)).toBe(0);
    expect(getLineStart(text, 6)).toBe(0);
  });

  test('returns start of second line', () => {
    expect(getLineStart(text, 7)).toBe(7);
    expect(getLineStart(text, 10)).toBe(7);
    expect(getLineStart(text, 13)).toBe(7);
  });
});

describe('getLineEnd', () => {
  const text = 'Line 1\nLine 2\nLine 3';

  test('returns end of first line (before newline)', () => {
    expect(getLineEnd(text, 0)).toBe(6);
    expect(getLineEnd(text, 3)).toBe(6);
  });

  test('returns end of second line', () => {
    expect(getLineEnd(text, 7)).toBe(13);
    expect(getLineEnd(text, 10)).toBe(13);
  });

  test('returns end of last line', () => {
    expect(getLineEnd(text, 14)).toBe(20);
    expect(getLineEnd(text, 20)).toBe(20);
  });
});

describe('getLineCount', () => {
  test('counts lines correctly', () => {
    expect(getLineCount('')).toBe(1);
    expect(getLineCount('one')).toBe(1);
    expect(getLineCount('one\ntwo')).toBe(2);
    expect(getLineCount('one\ntwo\nthree')).toBe(3);
    expect(getLineCount('\n')).toBe(2);
  });
});
