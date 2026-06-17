// Certificate pins for the Supabase API domain.
// Pinned to the intermediate CA (WE1) and backup root (GTS Root R4) so the
// pin remains valid across leaf-cert rotations.
//
// Re-derive with: node scripts/get-cert-pins.js
// Applied via:
//   Android — plugins/withAndroidNetworkSecurity.js → network_security_config.xml
//   iOS     — app.json ios.infoPlist.NSAppTransportSecurity.NSPinnedDomains

export const SSL_PINNED_DOMAINS = ['supabase.co'] as const;

export const SSL_PINS = {
  // WE1 intermediate CA  (derived 2026-06-17)
  intermediate: 'kIdp6NNEd8wsugYyyIYFsi1ylMCED3hZbSR8ZFsa/A4=',
  // GTS Root R4 backup   (derived 2026-06-17)
  rootBackup:   'mEflZT5enoR1FuXLgYYGqnVEoZvmf9c2bVBpiOjYQ0c=',
} as const;
