process.env.PORT ||= '4173';
process.argv.push('--dist');
await import('./serve.mjs');
