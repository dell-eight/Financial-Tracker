#!/usr/bin/env node
// Derives SPKI SHA-256 certificate pins for domains used by this app.
// Run annually (or when Supabase changes their CA chain) and update:
//   - src/config/sslPins.ts
//   - plugins/withAndroidNetworkSecurity.js  (pin-set + expiration date)
//   - app.json  ios.infoPlist.NSAppTransportSecurity.NSPinnedDomains
//
// Usage: node scripts/get-cert-pins.js [hostname]

const tls    = require('tls');
const crypto = require('crypto');
const { X509Certificate } = require('crypto');

const hosts = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['demhnsizljymltdewrnq.supabase.co'];

for (const host of hosts) {
  const s = tls.connect(443, host, { servername: host }, () => {
    const chain  = [];
    let   cert   = s.getPeerCertificate(true);

    while (cert?.raw) {
      const x509    = new X509Certificate(cert.raw);
      const spkiDer = x509.publicKey.export({ type: 'spki', format: 'der' });
      const hash    = crypto.createHash('sha256').update(spkiDer).digest('base64');
      chain.push({ label: cert.subject.CN ?? cert.subject.O ?? '?', hash });
      const next = cert.issuerCertificate;
      if (!next || next === cert) break;
      cert = next;
    }

    console.log(`\nChain for ${host}:`);
    chain.forEach((c, i) => {
      const role = i === 0 ? 'leaf' : i === chain.length - 1 ? 'root' : `intermediate-${i}`;
      console.log(`  [${role}] ${c.label}`);
      console.log(`           SHA256/SPKI: ${c.hash}`);
    });

    s.destroy();
  });
  s.on('error', (e) => console.error(`${host}: ${e.message}`));
}
