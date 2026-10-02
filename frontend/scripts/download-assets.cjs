const fs = require('fs');
const path = require('path');

const baseUrl = 'https://invite-studio-bax.pages.dev';
const files = [
  'hero-artwork.png',
  'second-section.png',
  'second-section.webp',
  'phone2-poster.webp',
  'intro.mp4',
  'logo1.jpg',
  'brand/favicon-32.png',
  'brand/favicon-48.png',
  'brand/apple-touch-icon.png',
  'brand/og-image.jpg',
  'templates/romance.jpg',
  'templates/yellow.jpg',
  'templates/white and pink.jpg',
  'templates/pink.jpg',
  'templates/gold and sky.jpg',
  'templates/burgandy.jpg',
  'templates/purple.jpg'
];

async function download() {
  for (const f of files) {
    const dest = path.join(__dirname, '..', 'public', f);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const encoded = f.split('/').map(encodeURIComponent).join('/');
    const url = `${baseUrl}/${encoded}`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(dest, buffer);
        console.log('Downloaded:', f, buffer.length, 'bytes');
      } else {
        console.log('Failed (status):', f, res.status);
      }
    } catch (err) {
      console.log('Error:', f, err.message);
    }
  }
}

download();
