import { describe, expect, it } from 'bun:test'
import { Buffer } from 'node:buffer'

import { describe, it, expect } from 'bun:test'
import { createCipheriv, randomBytes } from 'node:crypto'
import { Logger } from '../src'
import { PerformanceHelper } from './helpers'

function encryptWithAesGcm(plain: string, key: Buffer): Buffer {
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const p1 = cipher.update(Buffer.from(plain, 'utf8'))
  const p2 = cipher.final()
  const tag = cipher.getAuthTag()
  const out = Buffer.allocUnsafe(16 + p1.length + p2.length + 16)
  iv.copy(out, 0)
  p1.copy(out, 16)
  p2.copy(out, 16 + p1.length)
  tag.copy(out, 16 + p1.length + p2.length)
  return out
}

describe('encryption/decryption performance and correctness', () => {
  it('decrypt() should correctly decrypt AES-256-GCM payload (Buffer input)', async () => {
    const logger = new Logger('enc-test', {
      rotation: { encrypt: { algorithm: 'aes-256-gcm' } },
    })

    const key = Buffer.alloc(32, 1)
    const keyId = 'test-key-1'
    logger.setTestEncryptionKey(keyId, key)

    const message = `Hello Clarity! ${'x'.repeat(1024)}` // ~1KB payload

    const encrypted = encryptWithAesGcm(message, key)

    const decrypted = await logger.decrypt(encrypted)
    expect(decrypted).toBe(message)

    await logger.destroy()
  })

  it('decrypt() should accept base64 string input', async () => {
    const logger = new Logger('enc-test-b64', {
      rotation: { encrypt: { algorithm: 'aes-256-gcm' } },
    })

    const key = Buffer.alloc(32, 2)
    const keyId = 'test-key-2'
    logger.setTestEncryptionKey(keyId, key)

    const message = `Base64 path ${'y'.repeat(2048)}` // ~2KB payload

    const encrypted = encryptWithAesGcm(message, key)
    const b64 = encrypted.toString('base64')

    const decrypted = await logger.decrypt(b64)
    expect(decrypted).toBe(message)

    await logger.destroy()
  })

  it('decrypt() performance: multiple decrypts complete quickly', async () => {
    const logger = new Logger('enc-perf', {
      rotation: { encrypt: { algorithm: 'aes-256-gcm' } },
    })

    const key = Buffer.alloc(32, 3)
    const keyId = 'test-key-3'
    logger.setTestEncryptionKey(keyId, key)

    const message = 'Perf '.repeat(1024) // ~5KB
    const encrypted = encryptWithAesGcm(message, key)

    const iterations = 200
    const durationMs = await PerformanceHelper.measureExecution(async () => {
      for (let i = 0; i < iterations; i++) {
        const out = await logger.decrypt(encrypted)

        if (out.length !== message.length)
          throw new Error('invalid decrypt')

      }
    })

    // Soft expectation: decrypt 200x 5KB payloads under ~500ms on CI (adjust if needed)
    // This is a non-strict check to guard against regressions without being flaky.
    expect(durationMs).toBeLessThan(1000)

    await logger.destroy()
  })
})
