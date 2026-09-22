const { build } = require('esbuild');
const { resolve } = require('path');

build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: 'dist/index.js',
  format: 'cjs',
  sourcemap: false,
  minify: process.env.NODE_ENV === 'production',
  external: [
    // Keep native dependencies external
    'pg',
    'pgvector',
    'sharp',
    'canvas',
    'sqlite3',
    'better-sqlite3',
    'mysql2',
    'oracledb',
    'tedious',
    // Optional dependencies that may not be installed
    '@langchain/community/vectorstores/pgvector',
    '@langchain/community/document_loaders/fs/pdf',
    'pdf-parse',
    'playwright',
    'puppeteer',
    'jsdom',
    'node-llama-cpp'
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  loader: {
    '.node': 'file'
  },
  logLevel: 'info'
}).then(() => {
  console.log('✅ Build completed successfully');
}).catch((error) => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});