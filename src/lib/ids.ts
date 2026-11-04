/**
 * Random IDs that are easy to read off a card: lowercase, no 0/1/i/l/o.
 */
const READABLE_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";

export const BUSINESS_ID_LENGTH = 6;
export const CARD_ID_LENGTH = 8;
/** 32 chars × log2(31) ≈ 158 bits: impossible to guess. */
export const OWNER_TOKEN_LENGTH = 32;

/** Accepts older/shorter IDs too, so cards are never broken by a length change. */
const CARD_ID_PATTERN = /^[a-z0-9]{4,32}$/;
const OWNER_TOKEN_PATTERN = new RegExp(`^[a-z0-9]{${OWNER_TOKEN_LENGTH}}$`);

export function randomId(length: number): string {
  // Rejection sampling: only use bytes below the largest multiple of the alphabet
  // size, so every character is equally likely (no modulo bias).
  const alphabetSize = READABLE_ALPHABET.length;
  const limit = 256 - (256 % alphabetSize);
  let id = "";

  while (id.length < length) {
    for (const byte of crypto.getRandomValues(new Uint8Array(length * 2))) {
      if (byte >= limit) continue;
      id += READABLE_ALPHABET[byte % alphabetSize];
      if (id.length === length) break;
    }
  }
  return id;
}

export const newBusinessId = () => randomId(BUSINESS_ID_LENGTH);
export const newCardId = () => randomId(CARD_ID_LENGTH);
export const newOwnerToken = () => randomId(OWNER_TOKEN_LENGTH);

export const isCardId = (value: string) => CARD_ID_PATTERN.test(value);
export const isOwnerToken = (value: string) => OWNER_TOKEN_PATTERN.test(value);
