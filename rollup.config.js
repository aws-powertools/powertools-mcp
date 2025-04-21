import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/index.ts', // Change this to your entry point
  output: {
    file: 'dist/bundle.cjs',
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