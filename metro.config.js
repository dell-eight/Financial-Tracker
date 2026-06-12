const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

/**
 * react-native-reanimated v4, react-native-gesture-handler v2, and
 * react-native-screens all ship JS that uses private class fields (#field).
 * Metro skips node_modules by default, so Hermes in Expo Go sees untranspiled
 * private fields and throws "private properties are not supported".
 *
 * Fix: widen the transform to include those packages so Babel rewrites the
 * private fields before the bundle reaches the JS engine.
 */
const NEEDS_TRANSFORM = [
  'react-native-reanimated',
  'react-native-worklets',
  'react-native-gesture-handler',
  'react-native-screens',
].join('|');

config.transformer.transformIgnorePatterns = [
  `node_modules/(?!(${NEEDS_TRANSFORM})/)`,
];

module.exports = config;
