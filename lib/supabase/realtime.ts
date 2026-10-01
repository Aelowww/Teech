<<<<<<< HEAD
// Supabase reuses a channel when the name matches, so a component that remounts before the
// previous channel is removed would get an already-subscribed channel back. A per-mount
// suffix keeps every subscription independent. (crypto.randomUUID is avoided because it is
// unavailable on plain-HTTP LAN addresses used for device testing.)
=======
>>>>>>> 15407c001be6ee368c2f9b88dbf08d94de8246e4
export function uniqueChannelName(base: string) {
  return `${base}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
