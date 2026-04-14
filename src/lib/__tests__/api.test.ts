import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createChat, setTokenGetter } from '../api'

describe('api - createChat', () => {
  const mockFetch = vi.fn()
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = mockFetch
    // Reset token getter to default before each test to avoid test pollution
    setTokenGetter(async () => null)
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.resetAllMocks()
  })

  it('should throw an error when the response is not ok', async () => {
    // Mock fetch to return a non-ok response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response)

    // Verify that createChat throws the expected error
    await expect(createChat('New Chat')).rejects.toThrow('createChat failed: 500')

    // Verify fetch was called correctly
    expect(mockFetch).toHaveBeenCalledWith('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Chat' }),
    })
  })

  it('should return parsed json when the response is ok', async () => {
    const mockChat = { id: '123', title: 'New Chat' }

    // Mock fetch to return an ok response with json data
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockChat,
    } as Response)

    const result = await createChat('New Chat')

    // Verify result is what we expect
    expect(result).toEqual(mockChat)
  })

  it('should include auth headers if token getter is set', async () => {
    const mockChat = { id: '123', title: 'New Chat' }

    // Set up mock token
    setTokenGetter(async () => 'fake-token-123')

    // Mock fetch to return an ok response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockChat,
    } as Response)

    await createChat('New Chat')

    // Verify fetch was called with auth header
    expect(mockFetch).toHaveBeenCalledWith('/api/chats', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer fake-token-123',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title: 'New Chat' }),
    })
  })
})
