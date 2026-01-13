// Custom entry point - loads polyfills BEFORE expo-router
// This ensures Buffer is available when @solana/spl-token loads

// #region agent log
console.log('[DEBUG][index.js:1] Entry point starting, loading shim...');
// #endregion

// Load polyfills FIRST - MUST use require() to ensure synchronous execution before expo-router
require('./shim');

// #region agent log
console.log('[DEBUG][index.js:2] Shim loaded, Buffer available:', typeof global.Buffer !== 'undefined');
// #endregion

// Now load expo-router entry - MUST use require() to maintain execution order
require('expo-router/entry');
