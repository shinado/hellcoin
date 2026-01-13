// Polyfill shim - loaded before all other modules by Metro
// This ensures Buffer is available globally before any Solana libraries load

// #region agent log
console.log('[DEBUG][shim.js:START] Shim starting, hasBuffer:', typeof global.Buffer !== 'undefined', typeof globalThis !== 'undefined' ? typeof globalThis.Buffer !== 'undefined' : 'no-globalThis');
// #endregion

// Crypto polyfill must come first
require('react-native-get-random-values');

// Buffer polyfill
var BufferModule = require('buffer');
var Buffer = BufferModule.Buffer;

// #region agent log
console.log('[DEBUG][shim.js:REQUIRE] Buffer require result:', typeof Buffer, Buffer ? 'exists' : 'undefined');
// #endregion

// Set Buffer on all possible globals
global.Buffer = Buffer;
if (typeof globalThis !== 'undefined') {
  globalThis.Buffer = Buffer;
}
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

// #region agent log
console.log('[DEBUG][shim.js:END] Shim complete, global.Buffer:', typeof global.Buffer, 'globalThis.Buffer:', typeof globalThis !== 'undefined' ? typeof globalThis.Buffer : 'no-globalThis');
// #endregion
