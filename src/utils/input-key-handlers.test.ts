import { describe, test, expect } from 'bun:test';
import { cursorHandlers, type CursorContext } from './input-key-handlers.js';

describe('cursorHandlers', () => {
  describe('moveLeft', () => {
    test('moves cursor left by one character', () => {
      const ctx: CursorContext = { text: 'hello', cursorPosition: 3 };
      expect(cursorHandlers.moveLeft(ctx)).toBe(2);
    });

    test('does not move past start of text (0)', () => {
      const ctx: CursorContext = { text: 'hello', cursorPosition: 0 };
      expect(cursorHandlers.moveLeft(ctx)).toBe(0);
    });

    test('handles empty text', () => {
      const ctx: CursorContext = { text: '', cursorPosition: 0 };
      expect(cursorHandlers.moveLeft(ctx)).toBe(0);
    });
  });

  describe('moveRight', () => {
    test('moves cursor right by one character', () => {
      const ctx: CursorContext = { text: 'hello', cursorPosition: 2 };
      expect(cursorHandlers.moveRight(ctx)).toBe(3);
    });

    test('does not move past end of text', () => {
      const ctx: CursorContext = { text: 'hello', cursorPosition: 5 };
      expect(cursorHandlers.moveRight(ctx)).toBe(5);
    });

    test('handles empty text', () => {
      const ctx: CursorContext = { text: '', cursorPosition: 0 };
      expect(cursorHandlers.moveRight(ctx)).toBe(0);
    });
  });

  describe('moveToLineStart', () => {
    test('moves cursor to start of current line in single-line text', () => {
      const ctx: CursorContext = { text: 'hello world', cursorPosition: 5 };
      expect(cursorHandlers.moveToLineStart(ctx)).toBe(0);
    });

    test('moves cursor to start of line in multi-line text', () => {
      const text = 'first line\nsecond line\nthird line';
      // 'second line' starts at index 11
      const ctx: CursorContext = { text, cursorPosition: 15 };
      expect(cursorHandlers.moveToLineStart(ctx)).toBe(11);
    });

    test('returns current position if cursor is already at line start', () => {
      const text = 'first line\nsecond line';
      const ctx: CursorContext = { text, cursorPosition: 11 };
      expect(cursorHandlers.moveToLineStart(ctx)).toBe(11);
    });

    test('handles empty text', () => {
      const ctx: CursorContext = { text: '', cursorPosition: 0 };
      expect(cursorHandlers.moveToLineStart(ctx)).toBe(0);
    });
  });

  describe('moveToLineEnd', () => {
    test('moves cursor to end of single-line text', () => {
      const ctx: CursorContext = { text: 'hello world', cursorPosition: 2 };
      expect(cursorHandlers.moveToLineEnd(ctx)).toBe(11);
    });

    test('moves cursor to end of line in multi-line text (before newline)', () => {
      const text = 'first line\nsecond line\nthird line';
      // 'first line' length is 10, newline at 10
      const ctx: CursorContext = { text, cursorPosition: 3 };
      expect(cursorHandlers.moveToLineEnd(ctx)).toBe(10);
    });

    test('moves cursor to end of middle line in multi-line text', () => {
      const text = 'first line\nsecond line\nthird line';
      // 'second line' spans indices 11 to 22 (newline at 22)
      const ctx: CursorContext = { text, cursorPosition: 15 };
      expect(cursorHandlers.moveToLineEnd(ctx)).toBe(22);
    });

    test('handles empty text', () => {
      const ctx: CursorContext = { text: '', cursorPosition: 0 };
      expect(cursorHandlers.moveToLineEnd(ctx)).toBe(0);
    });
  });

  describe('moveUp', () => {
    test('returns null when on first line of multi-line text', () => {
      const text = 'first line\nsecond line';
      const ctx: CursorContext = { text, cursorPosition: 4 };
      expect(cursorHandlers.moveUp(ctx)).toBeNull();
    });

    test('returns null for single line text', () => {
      const ctx: CursorContext = { text: 'single line', cursorPosition: 5 };
      expect(cursorHandlers.moveUp(ctx)).toBeNull();
    });

    test('moves cursor up one line maintaining column position', () => {
      const text = 'first line\nsecond line';
      // cursor at index 14 ('e' in 'second', line 1 column 3)
      const ctx: CursorContext = { text, cursorPosition: 14 };
      // line 0 column 3 is index 3 ('s' in 'first')
      expect(cursorHandlers.moveUp(ctx)).toBe(3);
    });

    test('clamps column position when moving up to a shorter line', () => {
      const text = 'short\nvery long line';
      // 'very long line' starts at index 6; cursor at column 10 (index 16)
      const ctx: CursorContext = { text, cursorPosition: 16 };
      // line 0 'short' has length 5, clamped pos is 5
      expect(cursorHandlers.moveUp(ctx)).toBe(5);
    });
  });

  describe('moveDown', () => {
    test('returns null when on last line of multi-line text', () => {
      const text = 'first line\nsecond line';
      // 'second line' starts at index 11
      const ctx: CursorContext = { text, cursorPosition: 15 };
      expect(cursorHandlers.moveDown(ctx)).toBeNull();
    });

    test('returns null for single line text', () => {
      const ctx: CursorContext = { text: 'single line', cursorPosition: 3 };
      expect(cursorHandlers.moveDown(ctx)).toBeNull();
    });

    test('moves cursor down one line maintaining column position', () => {
      const text = 'first line\nsecond line';
      // line 0 column 3 is index 3
      const ctx: CursorContext = { text, cursorPosition: 3 };
      // line 1 column 3 is index 14
      expect(cursorHandlers.moveDown(ctx)).toBe(14);
    });

    test('clamps column position when moving down to a shorter line', () => {
      const text = 'very long line\nshort';
      // line 0 column 10 is index 10
      const ctx: CursorContext = { text, cursorPosition: 10 };
      // line 1 'short' starts at 15 and has length 5, clamped pos is 15 + 5 = 20
      expect(cursorHandlers.moveDown(ctx)).toBe(20);
    });
  });

  describe('moveWordBackward', () => {
    test('moves to start of previous word from middle of word', () => {
      const ctx: CursorContext = { text: 'hello world', cursorPosition: 8 };
      expect(cursorHandlers.moveWordBackward(ctx)).toBe(6);
    });

    test('moves to start of previous word from word start', () => {
      const ctx: CursorContext = { text: 'hello world', cursorPosition: 6 };
      expect(cursorHandlers.moveWordBackward(ctx)).toBe(0);
    });

    test('returns 0 when already at index 0', () => {
      const ctx: CursorContext = { text: 'hello world', cursorPosition: 0 };
      expect(cursorHandlers.moveWordBackward(ctx)).toBe(0);
    });
  });

  describe('moveWordForward', () => {
    test('moves to end of next word from start of word', () => {
      const ctx: CursorContext = { text: 'hello world', cursorPosition: 0 };
      expect(cursorHandlers.moveWordForward(ctx)).toBe(5);
    });

    test('moves to end of next word from between words', () => {
      const ctx: CursorContext = { text: 'hello world', cursorPosition: 5 };
      expect(cursorHandlers.moveWordForward(ctx)).toBe(11);
    });

    test('returns text length when already at end of text', () => {
      const ctx: CursorContext = { text: 'hello world', cursorPosition: 11 };
      expect(cursorHandlers.moveWordForward(ctx)).toBe(11);
    });
  });
});
