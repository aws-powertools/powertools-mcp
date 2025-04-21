const commonjs = require('@rollup/plugin-commonjs');
const json = require('@rollup/plugin-json');
const resolve = require('@rollup/plugin-node-resolve');
const typescript = require('@rollup/plugin-typescript');

module.exports = {
  input: 'src/index.ts',
  output: {
    file: 'dist/bundle.js',
    format: 'cjs',
    sourcemap: true
  },
  plugins: [
    // Handle TypeScript files
    typescript({
      tsconfig: './tsconfig.json',
      sourceMap: true,
    }),
    // Resolve node modules
    resolve({
      preferBuiltins: true,
      extensions: ['.js', '.ts'],
      // Make sure to include all dependencies, including nested ones
      mainFields: ['module', 'main'],
      browser: false,
    }),
    // Convert CommonJS modules to ES6
    commonjs({
      // Include node_modules
      include: 'node_modules/**',
      // Required for some modules
      transformMixedEsModules: true,
    }),
    json(),
  ],
  // Empty external array means include everything
  external: []
};
