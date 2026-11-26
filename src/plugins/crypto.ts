import CryptoJS from 'crypto-js'
import { assertString, invariant } from '@/utils/assert'

const crypto = {
  iv() {
    return ['Y', 'o', 'u', 'r', 'E', 'n', 'c', 'r', 'y', 'p', 't', 'i', 'o', 'n', 'K', 'e']
  },
  encryption(val: unknown): string {
    const iv = this.iv().join('')
    const serialized = JSON.stringify(val)
    invariant(serialized !== undefined, 'Cannot encrypt an undefined save')
    return CryptoJS.AES.encrypt(serialized, iv, {
      iv: CryptoJS.enc.Utf8.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }).toString()
  },
  decryption(data: unknown): unknown {
    assertString(data, 'Encrypted save')
    invariant(data.length > 0, 'Encrypted save must not be empty')
    const iv = this.iv().join('')
    const player = CryptoJS.AES.decrypt(data, iv, {
      iv: CryptoJS.enc.Utf8.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }).toString(CryptoJS.enc.Utf8)
    invariant(player.length > 0, 'Save could not be decrypted')
    const decoded: unknown = JSON.parse(player)
    return decoded
  }
}

export default crypto
