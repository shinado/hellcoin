import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import pinyinUtil from './pinyin/pinyinUtil';

/**
 * Transform a name into a Solana-compatible "DEAD" address
 * The address starts with "DEAD" and ends with "DEADRiP"
 */
export function transformToDeadAddress(original: string): string {
  if (!original) return '';

  const pinyin = pinyinUtil.getPinyin(original).replaceAll(' ', '');

  const text = pinyin
    .replaceAll('l', '1')
    .replaceAll('L', '1')
    .replaceAll('I', 'i')
    .replaceAll('0', 'o')
    .replaceAll('O', 'o');

  const base58Chars =
    '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const isBase58Only = text
    .split('')
    .every((char) => base58Chars.includes(char));

  let output = 'DEAD'; // Start with DEAD

  if (isBase58Only) {
    output += text;
  } else {
    text.split('').forEach((char) => {
      if (base58Chars.includes(char)) {
        output += char;
      } else {
        const bytesText = Buffer.from(char, 'utf8');
        const encodedText = bs58.encode(bytesText);
        output += encodedText;
      }
    });
  }

  // Fill with zeros and end with DEAD to make it 44 characters
  while (output.length < 36) {
    output += 'o';
  }
  output += 'DEADRiP';

  const address = output.slice(0, 44);
  const publicKey = findValidAddress(address);

  return publicKey;
}

/**
 * Find a valid Solana address by modifying characters until it's on the curve
 */
function findValidAddress(address: string): string {
  const hexChars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let currentIndex = address.length - 9;
  let currentAddress = address;

  function tryNextChar(index: number): string | false {
    if (index < 0) return false;

    const currentChar = currentAddress[index];
    let nextCharIndex = hexChars.indexOf(currentChar) + 1;

    while (nextCharIndex < hexChars.length) {
      const newAddress =
        currentAddress.substring(0, index) +
        hexChars[nextCharIndex] +
        currentAddress.substring(index + 1);
      
      try {
        if (PublicKey.isOnCurve(newAddress)) {
          return newAddress;
        }
      } catch (e) {
        // Invalid address, continue trying
      }
      nextCharIndex++;
    }

    currentAddress =
      currentAddress.substring(0, index) + '0' + currentAddress.substring(index + 1);
    return tryNextChar(index - 1);
  }

  const result = tryNextChar(currentIndex);
  return result || address;
}

/**
 * Check if an address belongs to the underworld (starts with DEAD, ends with DEADRiP or DEADDEAD)
 */
export function isUnderworldAddress(address: string): boolean {
  return address.startsWith('DEAD') && 
    (address.endsWith('DEADRiP') || address.endsWith('DEADDEAD'));
}
