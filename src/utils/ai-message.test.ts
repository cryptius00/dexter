import { describe, test, expect, mock } from 'bun:test';
import { extractTextContent, hasToolCalls } from './ai-message.js';

// Mock the AIMessage class
class MockAIMessage {
  content: any;
  tool_calls: any[];
  constructor(content: any, fields?: any) {
    this.content = content;
    if (fields && fields.tool_calls) {
        this.tool_calls = fields.tool_calls;
    } else if (typeof content === 'object' && content.tool_calls) {
        this.tool_calls = content.tool_calls;
        this.content = content.content;
    } else {
        this.tool_calls = [];
    }
  }
}

mock.module('@langchain/core/messages', () => {
  return {
    AIMessage: MockAIMessage,
  };
});

describe('extractTextContent', () => {
  test('extracts content from string content', () => {
    const message = new MockAIMessage('Hello world') as any;
    expect(extractTextContent(message)).toBe('Hello world');
  });

  test('extracts content from array of text blocks', () => {
    const message = new MockAIMessage([
      { type: 'text', text: 'Hello' },
      { type: 'text', text: ' world' },
    ]) as any;
    expect(extractTextContent(message)).toBe('Hello\n world');
  });

  test('extracts only text blocks from mixed content', () => {
    const message = new MockAIMessage([
      { type: 'text', text: 'Hello' },
      { type: 'image_url', image_url: { url: 'http://example.com/image.png' } } as any,
      { type: 'text', text: '!' },
    ]) as any;
    expect(extractTextContent(message)).toBe('Hello\n!');
  });

  test('returns empty string if no text blocks are present', () => {
    const message = new MockAIMessage([
      { type: 'image_url', image_url: { url: 'http://example.com/image.png' } } as any,
    ]) as any;
    expect(extractTextContent(message)).toBe('');
  });

  test('returns empty string for empty content array', () => {
    const message = new MockAIMessage([]) as any;
    expect(extractTextContent(message)).toBe('');
  });

  test('returns empty string for non-string, non-array content', () => {
    const message = new MockAIMessage({ type: 'something' } as any) as any;
    expect(extractTextContent(message)).toBe('');
  });
});

describe('hasToolCalls', () => {
  test('returns true if tool_calls is not empty', () => {
    const message = new MockAIMessage({
      content: '',
      tool_calls: [{ name: 'test_tool', args: {}, id: '1' }],
    }) as any;
    expect(hasToolCalls(message)).toBe(true);
  });

  test('returns false if tool_calls is empty', () => {
    const message = new MockAIMessage({
      content: '',
      tool_calls: [],
    }) as any;
    expect(hasToolCalls(message)).toBe(false);
  });

  test('returns false if tool_calls is missing', () => {
    const message = new MockAIMessage({
      content: '',
    }) as any;
    message.tool_calls = undefined;
    expect(hasToolCalls(message)).toBe(false);
  });
});
