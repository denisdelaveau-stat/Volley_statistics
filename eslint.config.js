// ESLint configuration for VolleyLive.
// The app ships classic browser scripts (no modules, no build step) that share globals on `window`.
const js = require('@eslint/js');
const globals = require('globals');

// Globals defined by one script and read by others. Keep this list in sync with docs/ARCHITECTURE.md.
const projectGlobals = {
  VolleyCapture: 'readonly',
  VolleyDom: 'readonly',
  VolleyDomain: 'readonly',
  VolleyI18n: 'readonly',
  VolleyI18nMessages: 'writable',
  VolleySets: 'readonly',
  VolleyStats: 'readonly',
  VolleyRotation: 'readonly',
  VolleyReport: 'readonly',
  VolleyShell: 'readonly',
  VolleyStatsAdapter: 'readonly',
  VolleySubstitutions: 'readonly',
  VolleyTeams: 'readonly',
  VolleyMatchHub: 'readonly',
  VolleyMatchLibrary: 'readonly',
  VolleyCoach: 'readonly',
  VolleyCoachConfig: 'readonly',
  VolleyCoachParts: 'readonly',
  VolleySpectator: 'readonly',
  VolleySpectatorConfig: 'readonly',
  VolleySpectatorParts: 'readonly',
};

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'docs/**',
      'tests/data/**',
      'tests/visual_baselines/**',
      'TO_DO/**',
      'statistics/data/**',
      'icons/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.browser, ...projectGlobals },
    },
    rules: {
      'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    // UMD footer: exports the adapter to Node when loaded outside the browser.
    files: ['statistics/adapter.js'],
    languageOptions: { globals: { module: 'readonly' } },
  },
  {
    files: ['sw.js'],
    languageOptions: { globals: { ...globals.serviceworker } },
  },
  {
    // Unit tests run in Node (node:test) and load the browser scripts in a vm context.
    files: ['tests/unit/**/*.js'],
    languageOptions: { sourceType: 'commonjs', globals: { ...globals.node } },
  },
  {
    files: ['eslint.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
];
