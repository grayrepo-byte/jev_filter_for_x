export default {
  content: [
    './src/entrypoints/popup/**/*.{ts,tsx,html}',
    './src/entrypoints/options/**/*.{ts,tsx,html}',
    './src/ui/popup/**/*.tsx',
    './src/ui/options/**/*.tsx',
  ],
  corePlugins: { preflight: true },
}
