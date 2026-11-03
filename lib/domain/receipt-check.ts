import { DEFAULT_CURRENCY, Money } from "./money";

/** What we could read off a payment screenshot. */
export interface ParsedReceipt {
  amounts: Money[];
  reference?: string;
  text: string;
}

export interface ReceiptExpectations {
  amount: Money;
  /** The payment method's account name, as set in Sanity. */
  accountName: string;
}

export interface ReceiptCheck {
  amountMatches: boolean;
  recipientMatches: boolean;
  reference?: string;
  /** Plain-language problems for the admin. Empty = everything matched. */
  flags: string[];
}

// 1,234.56 / 1234.56, optionally after ₱, PHP or P.
const AMOUNT = /(?:₱|PHP|P)?\s?(\d{1,3}(?:,\d{3})+|\d+)\.(\d{2})\b/gi;
// "Ref No. 1234 567 890123", "Reference Number: 0012345", "Ref#123456"
const REFERENCE = /ref(?:erence)?\.?\s*(?:no\.?|number|#)?\s*[:.#]?\s*(\d[\d ]{4,}\d)/i;

export function parseReceipt(text: string): ParsedReceipt {
  const amounts = [...text.matchAll(AMOUNT)].map((match) =>
    Money.ofMinor(Number(match[1].replace(/,/g, "")) * 100 + Number(match[2]), DEFAULT_CURRENCY),
  );
  const reference = text.match(REFERENCE)?.[1].replace(/\s/g, "");
  return { amounts, reference, text };
}

const lettersOnly = (s: string) => s.toUpperCase().replace(/[^A-Z*]/g, "");

/**
 * A word as printed on a receipt → a pattern for the real word. Each run of
 * `*` stands for one or more hidden letters (OCR often merges "**" into "*").
 * The last word may be abbreviated ("C." for "CRUZ"), so it only has to
 * match the start.
 */
function maskedWordPattern(seen: string, isLast: boolean) {
  const body = seen.replace(/\*+/g, "[A-Z]+");
  return new RegExp(`^${body}${isLast ? "" : "$"}`);
}

/**
 * Whether the account name appears on the receipt. E-wallets often mask
 * names ("JU*N DE** C."), so masked letters match anything.
 */
export function receiptShowsName(text: string, accountName: string): boolean {
  const target = accountName.toUpperCase().split(/\s+/).map(lettersOnly).filter(Boolean);
  if (target.length === 0) return false;

  for (const line of text.split(/\r?\n/)) {
    const words = line.toUpperCase().split(/\s+/).map(lettersOnly).filter(Boolean);
    for (let start = 0; start + target.length <= words.length; start++) {
      const matches = target.every((wanted, i) => {
        const seen = words[start + i];
        // A word that's only asterisks would match anyone: don't count it.
        if (!/[A-Z]/.test(seen)) return false;
        return maskedWordPattern(seen, i === target.length - 1).test(wanted);
      });
      if (matches) return true;
    }
  }
  return false;
}

/**
 * Compares a receipt with what the order expects. This is a pre-check to
 * speed up the admin, never proof of payment: screenshots can be edited.
 */
export function checkReceipt(parsed: ParsedReceipt, expected: ReceiptExpectations): ReceiptCheck {
  const amountMatches = parsed.amounts.some((amount) => amount.equals(expected.amount));
  const recipientMatches = receiptShowsName(parsed.text, expected.accountName);

  const flags: string[] = [];
  if (!amountMatches) {
    const seen = parsed.amounts.map((a) => a.format()).join(", ") || "none";
    flags.push(`Expected ${expected.amount.format()}; amounts read: ${seen}`);
  }
  if (!recipientMatches) flags.push(`Recipient "${expected.accountName}" not found on the receipt`);
  if (!parsed.reference) flags.push("No reference number found");

  return { amountMatches, recipientMatches, reference: parsed.reference, flags };
}
