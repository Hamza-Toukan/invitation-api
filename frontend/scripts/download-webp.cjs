const fs = require('fs');
const path = require('path');

const baseUrl = 'https://invite-studio-bax.pages.dev';
const webpTemplates = [
  'templates/romance.webp',
  'templates/yellow.webp',
  'templates/white and pink.webp',
  'templates/pink.webp',
  'templates/gold and sky.webp',
  'templates/burgandy.webp',
  'templates/purple.webp'
];

async function downloadWebp() {
  for (const f of webpTemplates) {
    const dest = path.join(__dirname, '..', 'public', f);
    const encoded = f.split('/').map(encodeURIComponent).join('/');
    const url = `${baseUrl}/${encoded}`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(dest, buffer);
        console.log('Downloaded WebP:', f, buffer.length, 'bytes');
      }
    } catch {}
  }
}
downloadWebp();
