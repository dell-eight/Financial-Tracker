// Expo config plugin — generates network_security_config.xml for Android.
// Pins TLS connections to supabase.co to the WE1 intermediate CA and the
// GTS Root R4 backup, then wires the manifest attribute.
//
// Expiration: update pins annually or when cert chain changes.
// Re-derive pins with: node scripts/get-cert-pins.js

const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs   = require('fs');

const NETWORK_SECURITY_XML = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <!-- Block cleartext (HTTP) for all domains -->
  <base-config cleartextTrafficPermitted="false">
    <trust-anchors>
      <certificates src="system"/>
    </trust-anchors>
  </base-config>

  <!-- Certificate pinning for Supabase API (supabase.co and all subdomains) -->
  <!-- Pins derived 2026-06-17. Expiration: 2027-06-17. Update annually.    -->
  <!-- Re-derive with: node scripts/get-cert-pins.js                         -->
  <domain-config>
    <domain includeSubdomains="true">supabase.co</domain>
    <pin-set expiration="2027-06-17">
      <!-- WE1 intermediate CA -->
      <pin digest="SHA-256">kIdp6NNEd8wsugYyyIYFsi1ylMCED3hZbSR8ZFsa/A4=</pin>
      <!-- GTS Root R4 backup -->
      <pin digest="SHA-256">mEflZT5enoR1FuXLgYYGqnVEoZvmf9c2bVBpiOjYQ0c=</pin>
    </pin-set>
  </domain-config>
</network-security-config>
`;

/** @param {import('@expo/config-plugins').ExpoConfig} config */
function withAndroidNetworkSecurity(config) {
  // 1. Add android:networkSecurityConfig attribute to <application>
  config = withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (app) {
      app.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    }
    return cfg;
  });

  // 2. Write the XML file into the Android project
  config = withDangerousMod(config, [
    'android',
    (cfg) => {
      const xmlDir = path.join(
        cfg.modRequest.platformProjectRoot,
        'app', 'src', 'main', 'res', 'xml'
      );
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(path.join(xmlDir, 'network_security_config.xml'), NETWORK_SECURITY_XML);
      return cfg;
    },
  ]);

  return config;
}

module.exports = withAndroidNetworkSecurity;
