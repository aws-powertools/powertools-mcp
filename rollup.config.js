const commonjs = require('@rollup/plugin-commonjs');
const json = require('@rollup/plugin-json');
const resolve = require('@rollup/plugin-node-resolve');
const typescript = require('@rollup/plugin-typescript');
const terser = require('@rollup/plugin-terser');

module.exports = {
  input: 'src/index.ts',
  output: {
    file: 'dist/bundle.js',
    format: 'cjs',
    sourcemap: true,
    banner: '#!/usr/bin/env node\n', // Add shebang line for executable
    inlineDynamicImports: true // Add this line to inline dynamic imports
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
    terser(), // Minify the output
  ],
  // Empty external array means include everything
  external: []
};
