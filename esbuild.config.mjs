import { build } from 'esbuild';

async function runBuild() {
  try {
    await build({
      entryPoints: ['src/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node22',
      outdir: 'dist',
      sourcemap: true,
      minify: true,
      banner: {
        js: '#!/usr/bin/env node',
      },
      // We're bundling everything for a standalone executable
      external: [],
    });
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

runBuild();
