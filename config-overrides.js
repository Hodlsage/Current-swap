/* ============================================================================
 * FILE: config-overrides.js  (react-app-rewired webpack overrides)
 * ----------------------------------------------------------------------------
 * REVISION CONTROL
 *   v0.2.0  2026-05-22  Cleanup pass 1
 *     - FIX: added `zlib: false` and `path/zlib` fallbacks. Webpack 5 (via
 *       react-scripts 5) no longer auto-polyfills Node core modules; a web3
 *       transitive dep (micro-ftch) imports `zlib` and broke the production
 *       build. We stub it (false) since the browser path doesn't use it.
 *   v0.1.0  Original as cloned.
 * ==========================================================================*/

const webpack = require('webpack');

module.exports = function override(config) {
    const fallback = config.resolve.fallback || {};
    Object.assign(fallback, {
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        assert: require.resolve('assert'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        os: require.resolve('os-browserify'),
        url: require.resolve('url'),
        // v0.2.0: stub modules that browser code never actually exercises.
        zlib: false,
        path: false,
        fs: false,
    });
    config.resolve.fallback = fallback;

    config.ignoreWarnings = [/Failed to parse source map/];

    config.plugins = (config.plugins || []).concat([
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer'],
        }),
    ]);

    return config;
};
