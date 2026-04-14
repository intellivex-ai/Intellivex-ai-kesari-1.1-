import { test, describe } from 'node:test'
import assert from 'node:assert'
import { tokenize, buildTFVector, cosineSimilarity } from './memory'

describe('Memory TF-IDF Helpers', () => {
  describe('tokenize', () => {
    test('should lowercase and split by whitespace', () => {
      const tokens = tokenize('Hello World')
      assert.deepStrictEqual(tokens, ['hello', 'world'])
    })

    test('should remove non-alphanumeric characters', () => {
      const tokens = tokenize('Hello, World!')
      assert.deepStrictEqual(tokens, ['hello', 'world'])
    })

    test('should filter out tokens shorter than 3 characters', () => {
      const tokens = tokenize('a is the to be')
      assert.deepStrictEqual(tokens, ['the']) // 'the' is 3 chars, others are shorter
    })
  })

  describe('buildTFVector', () => {
    test('should build a term frequency vector', () => {
      const tokens = ['apple', 'banana', 'apple']
      const vector = buildTFVector(tokens)
      assert.ok(Math.abs(vector['apple'] - 2 / 3) < 1e-9)
      assert.ok(Math.abs(vector['banana'] - 1 / 3) < 1e-9)
    })

    test('should filter out stopwords', () => {
      const tokens = ['apple', 'the', 'banana', 'and']
      const vector = buildTFVector(tokens)
      assert.ok(Math.abs(vector['apple'] - 1 / 2) < 1e-9)
      assert.ok(Math.abs(vector['banana'] - 1 / 2) < 1e-9)
      assert.strictEqual(vector['the'], undefined)
      assert.strictEqual(vector['and'], undefined)
    })

    test('should handle empty tokens', () => {
      const vector = buildTFVector([])
      assert.deepStrictEqual(vector, {})
    })

    test('should handle only stopwords', () => {
      const vector = buildTFVector(['the', 'and', 'for'])
      assert.deepStrictEqual(vector, {})
    })

    test('should handle single token', () => {
      const vector = buildTFVector(['apple'])
      assert.strictEqual(vector['apple'], 1)
    })
  })

  describe('cosineSimilarity', () => {
    test('should calculate similarity between identical vectors', () => {
      const vec = { apple: 1, banana: 0.5 }
      const similarity = cosineSimilarity(vec, vec)
      assert.ok(Math.abs(similarity - 1) < 1e-9)
    })

    test('should calculate similarity between different vectors', () => {
      const vecA = { apple: 1, banana: 0 }
      const vecB = { apple: 0, banana: 1 }
      const similarity = cosineSimilarity(vecA, vecB)
      assert.strictEqual(similarity, 0)
    })

    test('should calculate similarity between partially overlapping vectors', () => {
      const vecA = { apple: 1, banana: 1 }
      const vecB = { apple: 1, cherry: 1 }
      const similarity = cosineSimilarity(vecA, vecB)
      // dot product: 1*1 + 1*0 + 0*1 = 1
      // normA: sqrt(1^2 + 1^2) = sqrt(2)
      // normB: sqrt(1^2 + 1^2) = sqrt(2)
      // similarity: 1 / (sqrt(2) * sqrt(2)) = 1 / 2 = 0.5
      assert.ok(Math.abs(similarity - 0.5) < 1e-9)
    })

    test('should handle empty vectors', () => {
      const similarity = cosineSimilarity({}, {})
      assert.strictEqual(similarity, 0)
    })
  })

  describe('Integration: tokenize + buildTFVector', () => {
    test('should work together', () => {
      const text = 'Apple banana apple'
      const tokens = tokenize(text)
      const vector = buildTFVector(tokens)
      assert.ok(Math.abs(vector['apple'] - 2 / 3) < 1e-9)
      assert.ok(Math.abs(vector['banana'] - 1 / 3) < 1e-9)
    })
  })
})
