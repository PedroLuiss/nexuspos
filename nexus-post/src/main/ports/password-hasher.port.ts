export interface PasswordHasher {
  hash(password: string): string
  verify(password: string, storedValue: string): boolean
  needsRehash(storedValue: string): boolean
}
