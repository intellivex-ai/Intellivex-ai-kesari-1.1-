import { test, describe, expect } from 'vitest'
import { tokenize, buildTFVector, cosineSimilarity, formatMemoryForPrompt } from './memory'

describe('Memory TF-IDF Helpers', () => {
  describe('tokenize', () => {
    test('should lowercase and split by whitespace', () => {
      const tokens = tokenize('Hello World')
      expect(tokens).toEqual(['hello', 'world'])
    })

    test('should remove non-alphanumeric characters', () => {
      const tokens = tokenize('Hello, World!')
      expect(tokens).toEqual(['hello', 'world'])
    })

    test('should filter out tokens shorter than 3 characters', () => {
      const tokens = tokenize('a is the to be')
      expect(tokens).toEqual(['the']) // 'the' is 3 chars, others are shorter
    })
  })

  describe('buildTFVector', () => {
    test('should build a term frequency vector', () => {
      const tokens = ['apple', 'banana', 'apple']
      const vector = buildTFVector(tokens)
      expect(Math.abs(vector['apple'] - 2 / 3)).toBeLessThan(1e-9)
      expect(Math.abs(vector['banana'] - 1 / 3)).toBeLessThan(1e-9)
    })

    test('should filter out stopwords', () => {
      const tokens = ['apple', 'the', 'banana', 'and']
      const vector = buildTFVector(tokens)
      expect(Math.abs(vector['apple'] - 1 / 2)).toBeLessThan(1e-9)
      expect(Math.abs(vector['banana'] - 1 / 2)).toBeLessThan(1e-9)
      expect(vector['the']).toBeUndefined()
      expect(vector['and']).toBeUndefined()
    })

    test('should handle empty tokens', () => {
      const vector = buildTFVector([])
      expect(vector).toEqual({})
    })

    test('should handle only stopwords', () => {
      const vector = buildTFVector(['the', 'and', 'for'])
      expect(vector).toEqual({})
    })

    test('should handle single token', () => {
      const vector = buildTFVector(['apple'])
      expect(vector['apple']).toBe(1)
    })
  })

  describe('cosineSimilarity', () => {
    test('should calculate similarity between identical vectors', () => {
      const vec = { apple: 1, banana: 0.5 }
      const similarity = cosineSimilarity(vec, vec)
      expect(Math.abs(similarity - 1)).toBeLessThan(1e-9)
    })

    test('should calculate similarity between different vectors', () => {
      const vecA = { apple: 1, banana: 0 }
      const vecB = { apple: 0, banana: 1 }
      const similarity = cosineSimilarity(vecA, vecB)
      expect(similarity).toBe(0)
    })

    test('should calculate similarity between partially overlapping vectors', () => {
      const vecA = { apple: 1, banana: 1 }
      const vecB = { apple: 1, cherry: 1 }
      const similarity = cosineSimilarity(vecA, vecB)
      // dot product: 1*1 + 1*0 + 0*1 = 1
      // normA: sqrt(1^2 + 1^2) = sqrt(2)
      // normB: sqrt(1^2 + 1^2) = sqrt(2)
      // similarity: 1 / (sqrt(2) * sqrt(2)) = 1 / 2 = 0.5
      expect(Math.abs(similarity - 0.5)).toBeLessThan(1e-9)
    })

    test('should handle empty vectors', () => {
      const similarity = cosineSimilarity({}, {})
      expect(similarity).toBe(0)
    })
  })

  describe('Integration: tokenize + buildTFVector', () => {
    test('should work together', () => {
      const text = 'Apple banana apple'
      const tokens = tokenize(text)
      const vector = buildTFVector(tokens)
      expect(Math.abs(vector['apple'] - 2 / 3)).toBeLessThan(1e-9)
      expect(Math.abs(vector['banana'] - 1 / 3)).toBeLessThan(1e-9)
    })
  })

  describe('formatMemoryForPrompt', () => {
    test('should return empty string for empty chunks', () => {
      const result = formatMemoryForPrompt([]);
      expect(result).toBe('');
    });

    test('should format chunks without labels', () => {
      const chunks = [
        { id: '1', content: 'First memory', embedding: {}, metadata: { type: 'user' as const, timestamp: 1 } },
        { id: '2', content: 'Second memory', embedding: {}, metadata: { type: 'user' as const, timestamp: 2 } }
      ];
      const expected = '[INTERNAL_MEMORY — relevant context from previous sessions]:\n[1] First memory\n---\n[2] Second memory';
      const result = formatMemoryForPrompt(chunks);
      expect(result).toBe(expected);
    });

    test('should format chunks with labels', () => {
      const chunks = [
        { id: '1', content: 'Code memory', embedding: {}, metadata: { type: 'code' as const, timestamp: 1, label: 'app.ts' } }
      ];
      const expected = '[INTERNAL_MEMORY — relevant context from previous sessions]:\n[1] (app.ts) Code memory';
      const result = formatMemoryForPrompt(chunks);
      expect(result).toBe(expected);
    });

    test('should format mixed chunks', () => {
      const chunks = [
        { id: '1', content: 'General memory', embedding: {}, metadata: { type: 'user' as const, timestamp: 1 } },
        { id: '2', content: 'Code memory', embedding: {}, metadata: { type: 'code' as const, timestamp: 2, label: 'utils.ts' } }
      ];
      const expected = '[INTERNAL_MEMORY — relevant context from previous sessions]:\n[1] General memory\n---\n[2] (utils.ts) Code memory';
      const result = formatMemoryForPrompt(chunks);
      expect(result).toBe(expected);
    });
  });
})
