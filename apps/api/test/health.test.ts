import { describe, expect, it } from 'vitest'
import app from '../src/index'

describe('health endpoint', () => {
  it('reports that the API is available', async () => {
    const response = await app.request('/api/health')

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      service: 'prism-api',
      status: 'ok',
    })
  })
})
