export const passwordRequirementText = "Use at least 8 characters with uppercase, lowercase, number, and special character.";

export function getPasswordError(password: string) {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-z]/.test(password)) return "Password must include a lowercase letter.";
  if (!/[A-Z]/.test(password)) return "Password must include an uppercase letter.";
  if (!/\d/.test(password)) return "Password must include a number.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must include a special character.";
  return "";
}

// The same rules as getPasswordError, listed for a live checklist.
export const passwordRules = [
  { id: "length", label: "At least 8 characters", test: (password: string) => password.length >= 8 },
  { id: "upper", label: "An uppercase letter", test: (password: string) => /[A-Z]/.test(password) },
  { id: "lower", label: "A lowercase letter", test: (password: string) => /[a-z]/.test(password) },
  { id: "number", label: "A number", test: (password: string) => /\d/.test(password) },
  { id: "special", label: "A special character", test: (password: string) => /[^A-Za-z0-9]/.test(password) },
] as const;
