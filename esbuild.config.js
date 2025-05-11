const { build } = require('esbuild');
const esbuildPluginPino = require('esbuild-plugin-pino');

async function runBuild() {
  try {
    await build({
      entryPoints: ['src/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node18',
      outdir: 'dist',
      sourcemap: true,
      minify: true,
      banner: {
        js: '#!/usr/bin/env node',
      },
      plugins: [
        esbuildPluginPino({
          transports: ['pino-pretty'] // Adding pino-pretty as it's used in the logger
        }),
      ],
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
