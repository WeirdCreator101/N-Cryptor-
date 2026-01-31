import { CipherMap } from '../types';

const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?/~±§¶∆ø∑√∞≈≠≤≥πµΩ∫∆∂€£¥¢¿¡";
const FULL_CHARSET = UPPERCASE + LOWERCASE + NUMBERS + SYMBOLS;

/**
 * Deterministic string hash (cyrb53)
 * Converts an alphanumeric string into a 53-bit integer for the PRNG seed.
 */
const hashString = (str: string, seed = 0) => {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

// Deterministic pseudo-random number generator
const mulberry32 = (a: number) => {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// Generate a deterministic mapping based on the Alphanumeric Protocol ID
export const generateDeterministicMapping = (id: string): CipherMap => {
  const seed = hashString(id);
  const random = mulberry32(seed);

  const chars = FULL_CHARSET.split('');
  const shuffled = [...chars];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const mapping: CipherMap = {};
  chars.forEach((char, index) => {
    mapping[char] = shuffled[index];
  });
  return mapping;
};

export const getReverseMapping = (mapping: CipherMap): CipherMap => {
  return Object.entries(mapping).reduce((acc, [key, val]) => {
    if (!acc[val]) acc[val] = key;
    return acc;
  }, {} as CipherMap);
};

const getNoiseSeed = (id: string): number => {
  return hashString(id + "_noise_layer");
};

const getPolyKey = (id: string): number[] => {
  const key = id.split('').map((char) => char.charCodeAt(0) % 17);
  return key.length > 0 ? key : [7];
};

export const encryptText = (
  text: string,
  mapping: CipherMap,
  stripSpaces: boolean,
  noiseLevel: number,
  protocolId: string,
): string => {
  let processedText = text; 
  if (stripSpaces) {
    processedText = processedText.replace(/\s+/g, '');
  }

  const substituted = processedText
    .split('')
    .map((char) => mapping[char] || char);

  if (noiseLevel === 0) return substituted.join('');

  const result: string[] = [];
  const seed = getNoiseSeed(protocolId);
  const random = mulberry32(seed);
  const polyKey = getPolyKey(protocolId);
  const charset = FULL_CHARSET.split('');

  let polyCounter = 0;

  substituted.forEach((char) => {
    result.push(char);
    const noiseCount = Math.floor(random() * 3 + noiseLevel);
    for (let i = 0; i < noiseCount; i++) {
      const baseIdx = Math.floor(random() * charset.length);
      const shift = polyKey[polyCounter % polyKey.length];
      const noiseChar = charset[(baseIdx + shift) % charset.length];
      result.push(noiseChar);
      polyCounter++;
    }
  });

  return result.join('');
};

export const decryptText = (
  text: string,
  mapping: CipherMap,
  noiseLevel: number,
  protocolId: string,
): string => {
  const reverse = getReverseMapping(mapping);
  const chars = text.split('');

  if (noiseLevel === 0) {
    return chars.map((char) => reverse[char] || char).join('');
  }

  const seed = getNoiseSeed(protocolId);
  const random = mulberry32(seed);
  const filtered: string[] = [];

  let i = 0;
  while (i < chars.length) {
    filtered.push(chars[i]);
    const noiseCount = Math.floor(random() * 3 + noiseLevel);
    for (let j = 0; j < noiseCount; j++) {
      random(); 
    }
    i += 1 + noiseCount;
  }

  return filtered.map((char) => reverse[char] || char).join('');
};