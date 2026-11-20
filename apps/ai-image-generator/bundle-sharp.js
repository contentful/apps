const fs = require('fs/promises');

console.log('Copying sharp files from node_modules to build/node_modules');

// sharp is esbuild-external, so its whole runtime closure must be copied by
// hand. Keep in sync with sharp's `dependencies` on every upgrade.
const modules = [
  '@img/sharp-libvips-linux-x64',
  '@img/sharp-linux-x64',
  '@img/colour',
  'sharp',
  'detect-libc',
  'semver',
];

const copySharp = async () => {
  for (const mod of modules) {
    const src = `./node_modules/${mod}`;
    try {
      await fs.access(src);
    } catch {
      throw new Error(
        `Expected ${mod} in node_modules but it is missing. A sharp upgrade likely changed its dependencies; update the list in bundle-sharp.js.`
      );
    }
    await fs.cp(src, `./build/node_modules/${mod}`, { recursive: true });
  }
};

copySharp().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
