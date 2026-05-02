const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";

// Characters that are visually similar and easy to confuse:
// 0/O/o, 1/l/I/i, |/l, `/'
export const AMBIGUOUS_CHARS = "0OoIl1i|`'";

export interface PasswordOptions {
  length: number;
  lowercase: boolean;
  uppercase: boolean;
  numbers: boolean;
  symbols: boolean;
  /** When true, removes visually ambiguous characters from the pool (default: false). */
  excludeAmbiguous?: boolean;
}

function stripAmbiguous(charset: string): string {
  const ambiguous = new Set(AMBIGUOUS_CHARS);
  let out = "";
  for (const ch of charset) {
    if (!ambiguous.has(ch)) out += ch;
  }
  return out;
}

export function generatePassword(options: PasswordOptions): string {
  let charset = "";

  if (options.lowercase) charset += LOWER;
  if (options.uppercase) charset += UPPER;
  if (options.numbers) charset += NUMBERS;
  if (options.symbols) charset += SYMBOLS;

  if (options.excludeAmbiguous) {
    charset = stripAmbiguous(charset);
  }

  if (!charset) {
    throw new Error("No character sets selected");
  }

  const passwordChars: string[] = [];
  const randomValues = crypto.getRandomValues(new Uint32Array(options.length));

  for (let i = 0; i < options.length; i++) {
    passwordChars.push(charset[randomValues[i]! % charset.length]!);
  }

  return passwordChars.join("");
}
