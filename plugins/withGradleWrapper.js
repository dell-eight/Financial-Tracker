const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs   = require('fs');

const GRADLE_VERSION = '8.10.2';

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
      content = content.replace(
        /distributionUrl=.*gradle-.*-bin\.zip/,
        `distributionUrl=https\\://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-bin.zip`,
      );
      fs.writeFileSync(propsPath, content, 'utf8');
      return cfg;
    },
  ]);
}

module.exports = withGradleWrapper;
