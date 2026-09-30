export function uniqueChannelName(base: string) {
  return `${base}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
