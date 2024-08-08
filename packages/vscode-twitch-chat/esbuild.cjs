const esbuild = require('esbuild');

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ['src/extension/extension.ts'],
    bundle: true,
    format: 'cjs',
    minify: true,
    sourcemap: false,
    sourcesContent: false,
    platform: 'node',
    outfile: 'dist/extension.js',
    external: ['vscode'],
    logLevel: 'error',
  });
  await ctx.rebuild();
  await ctx.dispose();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
