import { describe, test, expect } from 'bun:test';
import { truncateText, htmlToMarkdown, markdownToText } from './web-fetch-utils';

describe('truncateText', () => {
  test('does not truncate if text is shorter than maxChars', () => {
    const input = 'hello';
    const result = truncateText(input, 10);
    expect(result).toEqual({ text: 'hello', truncated: false });
  });

  test('does not truncate if text is exactly maxChars long', () => {
    const input = 'hello';
    const result = truncateText(input, 5);
    expect(result).toEqual({ text: 'hello', truncated: false });
  });

  test('truncates if text is longer than maxChars', () => {
    const input = 'hello world';
    const result = truncateText(input, 5);
    expect(result).toEqual({ text: 'hello', truncated: true });
  });

  test('handles empty string', () => {
    const result = truncateText('', 5);
    expect(result).toEqual({ text: '', truncated: false });
  });

  test('handles maxChars = 0', () => {
    const result = truncateText('hello', 0);
    expect(result).toEqual({ text: '', truncated: true });
  });

  test('handles multi-byte characters (emojis)', () => {
    // 🌍 is 2 code units in UTF-16
    const input = '🌍🌍🌍';
    expect(input.length).toBe(6);

    const result = truncateText(input, 3);
    // It will truncate in the middle of a surrogate pair if we just use .slice()
    // Current implementation uses .slice(0, maxChars)
    expect(result.text.length).toBe(3);
    expect(result.truncated).toBe(true);
  });
});

describe('htmlToMarkdown', () => {
  test('extracts title and basic text', () => {
    const html = '<html><head><title>My Title</title></head><body><h1>Hello</h1><p>World</p></body></html>';
    const result = htmlToMarkdown(html);
    expect(result.title).toBe('My Title');
    expect(result.text).toContain('# Hello');
    expect(result.text).toContain('World');
  });

  test('handles links', () => {
    const html = '<a href="https://example.com">Example</a>';
    const result = htmlToMarkdown(html);
    expect(result.text).toBe('[Example](https://example.com)');
  });

  test('handles lists', () => {
    const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
    const result = htmlToMarkdown(html);
    expect(result.text).toContain('- Item 1');
    expect(result.text).toContain('- Item 2');
  });

  test('removes scripts and styles', () => {
    const html = '<script>alert(1)</script><style>body{color:red}</style><p>Visible</p>';
    const result = htmlToMarkdown(html);
    expect(result.text).toBe('Visible');
  });
});

describe('markdownToText', () => {
  test('removes links', () => {
    const md = '[Example](https://example.com)';
    expect(markdownToText(md)).toBe('Example');
  });

  test('removes headers', () => {
    const md = '# Header\nContent';
    expect(markdownToText(md)).toBe('Header\nContent');
  });

  test('removes code blocks', () => {
    const md = 'Code:\n```\nconst x = 1;\n```';
    expect(markdownToText(md)).toBe('Code:\nconst x = 1;');
  });

  test('removes inline code', () => {
    const md = 'Use `code` here';
    expect(markdownToText(md)).toBe('Use code here');
  });
});
