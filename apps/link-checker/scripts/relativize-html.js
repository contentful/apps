/**
 * Post-build: make index.html use relative paths so the Contentful app bundle
 * renders correctly. Replaces src="/ and href="/ with src="./ and href="./.
 */
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'out');
const indexPath = path.join(outDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  process.exit(0);
}

let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace(/\s(src|href)="\//g, ' $1="./');
fs.writeFileSync(indexPath, html, 'utf8');
