const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Inject polyfill shim before all other modules
// This ensures Buffer is available before @solana/spl-token loads
const originalGetModulesRunBeforeMainModule = config.serializer.getModulesRunBeforeMainModule;

config.serializer.getModulesRunBeforeMainModule = () => {
  const shimPath = path.resolve(__dirname, 'shim.js');
  const original = originalGetModulesRunBeforeMainModule ? originalGetModulesRunBeforeMainModule() : [];
  return [shimPath, ...original];
};

// Add resolver options to handle package exports correctly
config.resolver = {
  ...config.resolver,
  sourceExts: [...config.resolver.sourceExts, 'mjs', 'cjs'],
};

module.exports = withNativeWind(config, { input: "./global.css" });
