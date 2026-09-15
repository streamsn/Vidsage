export const FREE_SIGNUP_CREDITS = 3;

export const CREDIT_PACKAGES = {
  small: { id: "small", credits: 100, priceUsd: 10 },
  large: { id: "large", credits: 1000, priceUsd: 50 },
} as const;

export type CreditPackageId = keyof typeof CREDIT_PACKAGES;

// Pin exact model IDs here so both the summary and chat routes stay in sync.
// Sonnet-tier: stronger, used once per video (cost amortized across all viewers).
// Haiku-tier: cheap/fast, used per chat question to protect per-credit margin.
export const CLAUDE_SUMMARY_MODEL = "claude-sonnet-5";
export const CLAUDE_CHAT_MODEL = "claude-haiku-4-5-20251001";
