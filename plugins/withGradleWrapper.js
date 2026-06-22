const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs   = require('fs');

// AGP 8.11.0 (used by RN 0.81) requires Gradle >= 8.11.1.
// 8.13 is the latest stable before 8.14 and is well-cached on EAS servers.
// The default template uses 8.14.3 which is too new for EAS cache,
// causing a 10-second download timeout during the build.
const GRADLE_VERSION  = '8.13';
const NETWORK_TIMEOUT = '120000'; // 2 minutes — safe for any EAS server latency

/** @param {import('@expo/config-plugins').ExpoConfig} config */
function withGradleWrapper(config) {
  return withDangerousMod(config, [
    'android',
    (cfg) => {
      const propsPath = path.join(
        cfg.modRequest.platformProjectRoot,
        'gradle', 'wrapper', 'gradle-wrapper.properties',
      );
      let content = fs.readFileSync(propsPath, 'utf8');
      content = content
        .replace(
          /distributionUrl=.*gradle-.*-bin\.zip/,
          `distributionUrl=https\\://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-bin.zip`,
        )
        .replace(/networkTimeout=\d+/, `networkTimeout=${NETWORK_TIMEOUT}`);
      fs.writeFileSync(propsPath, content, 'utf8');
      return cfg;
    },
  ]);
}

module.exports = withGradleWrapper;
