import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import type { PasswordHasher } from '../../ports/password-hasher.port'

const KEY_LENGTH = 64
const SALT_LENGTH = 16
const SCRYPT_COST = 16_384
const SCRYPT_BLOCK_SIZE = 8
const SCRYPT_PARALLELIZATION = 1
const SCRYPT_MAX_MEMORY = 64 * 1024 * 1024
const HASH_PREFIX = `scrypt$${SCRYPT_COST}$${SCRYPT_BLOCK_SIZE}$${SCRYPT_PARALLELIZATION}$`

export class ScryptPasswordHasher implements PasswordHasher {
  hash(password: string): string {
    const salt = randomBytes(SALT_LENGTH)
    const derivedKey = scryptSync(password, salt, KEY_LENGTH, {
      N: SCRYPT_COST,
      r: SCRYPT_BLOCK_SIZE,
      p: SCRYPT_PARALLELIZATION,
      maxmem: SCRYPT_MAX_MEMORY
    })
    return `${HASH_PREFIX}${salt.toString('hex')}$${derivedKey.toString('hex')}`
  }

  verify(password: string, storedValue: string): boolean {
    if (!storedValue.startsWith('scrypt$')) {
      return this.safeEqual(Buffer.from(password, 'utf8'), Buffer.from(storedValue, 'utf8'))
    }

    const [algorithm, cost, blockSize, parallelization, saltHex, keyHex, ...extra] =
      storedValue.split('$')
    if (
      algorithm !== 'scrypt' ||
      cost !== String(SCRYPT_COST) ||
      blockSize !== String(SCRYPT_BLOCK_SIZE) ||
      parallelization !== String(SCRYPT_PARALLELIZATION) ||
      extra.length > 0 ||
      !saltHex ||
      !keyHex ||
      !/^[0-9a-f]+$/i.test(saltHex) ||
      !/^[0-9a-f]+$/i.test(keyHex)
    ) {
      return false
    }

    const salt = Buffer.from(saltHex, 'hex')
    const expectedKey = Buffer.from(keyHex, 'hex')
    if (salt.length !== SALT_LENGTH || expectedKey.length !== KEY_LENGTH) return false

    const actualKey = scryptSync(password, salt, expectedKey.length, {
      N: SCRYPT_COST,
      r: SCRYPT_BLOCK_SIZE,
      p: SCRYPT_PARALLELIZATION,
      maxmem: SCRYPT_MAX_MEMORY
    })
    return this.safeEqual(actualKey, expectedKey)
  }

  needsRehash(storedValue: string): boolean {
    return !storedValue.startsWith(HASH_PREFIX)
  }

  private safeEqual(left: Buffer, right: Buffer): boolean {
    return left.length === right.length && timingSafeEqual(left, right)
  }
}
