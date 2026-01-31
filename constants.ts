
import { CipherMap } from './types';

export const ENCRYPTION_MAP: CipherMap = {
  // Alphabets A–Z
  'A': '@', 'B': '#', 'C': '%', 'D': '^', 'E': '&',
  'F': '(', 'G': ')', 'H': ':', 'I': '"', 'J': '}',
  'K': '{', 'L': '|', 'M': '\\', 'N': '3', 'O': '5',
  'P': '7', 'Q': 'Q', 'R': 'K', 'S': 'L', 'T': '.',
  'U': ',', 'V': '=', 'W': '+', 'X': '-', 'Y': '±', 'Z': '~',

  // Numbers 0–9
  '0': 'ظ', '1': 'ذ', '2': '٠', '3': '؛', '4': '?',
  '5': 'م', '6': 'ض', '7': 'ه', '8': 'ر', '9': 'ض'
};

// Generate decryption map (reverse)
// Note: 6 and 9 both map to 'ض'. Decryption will default to '6'.
export const DECRYPTION_MAP: CipherMap = Object.entries(ENCRYPTION_MAP).reduce((acc, [key, val]) => {
  // If multiple keys map to same value, first one wins or we handle ambiguity.
  // In user's map: 6 and 9 both map to ض. 
  if (!acc[val]) {
    acc[val] = key;
  }
  return acc;
}, {} as CipherMap);
