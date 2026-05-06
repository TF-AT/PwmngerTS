import { describe, it, expect } from "vitest";
import { generatePassword, AMBIGUOUS_CHARS } from "./generator";

describe("generatePassword", () => {
  it("respects requested length", () => {
    const pw = generatePassword({
      length: 24,
      lowercase: true,
      uppercase: true,
      numbers: true,
      symbols: true,
    });
    expect(pw).toHaveLength(24);
  });

  it("throws when no character sets are selected", () => {
    expect(() =>
      generatePassword({
        length: 12,
        lowercase: false,
        uppercase: false,
        numbers: false,
        symbols: false,
      }),
    ).toThrow();
  });

  it("excludes ambiguous characters when excludeAmbiguous is true", () => {
    for (let i = 0; i < 50; i++) {
      const pw = generatePassword({
        length: 64,
        lowercase: true,
        uppercase: true,
        numbers: true,
        symbols: true,
        excludeAmbiguous: true,
      });
      expect(pw).toHaveLength(64);
      for (const ch of pw) {
        expect(AMBIGUOUS_CHARS.includes(ch)).toBe(false);
      }
    }
  });

  it("still produces a valid password when only numbers are selected with excludeAmbiguous", () => {
    const pw = generatePassword({
      length: 32,
      lowercase: false,
      uppercase: false,
      numbers: true,
      symbols: false,
      excludeAmbiguous: true,
    });
    expect(pw).toHaveLength(32);
    expect(/^[2-9]+$/.test(pw)).toBe(true); // 0 and 1 stripped
  });
});
