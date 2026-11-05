const fs = require('fs');
let code = fs.readFileSync('src/lib/supabase/seed-data.ts', 'utf8');

const products = [
  'prod-hoodie',
  'prod-socks',
  'prod-memo',
  'prod-limited-sticker',
  'prod-griptok',
  'prod-keyring',
  'prod-tumbler',
  'prod-figure',
  'prod-laptop-pouch',
  'prod-powerbank',
  'prod-toothbrush',
  'prod-travel-pouch',
  'prod-car-freshener',
  'prod-ecobag',
  'prod-custom-doll',
  'prod-season-doll'
];

products.forEach(id => {
  // Find block starting with id: 'prod-xxx'
  const blockStart = code.indexOf(`id: '${id}',`);
  if (blockStart === -1) return;
  const nextBlock = code.indexOf(`id: 'prod-`, blockStart + 15);
  const blockEnd = nextBlock !== -1 ? nextBlock : code.indexOf('];', blockStart);
  
  let block = code.slice(blockStart, blockEnd);
  block = block.replace(/image_url:\s*'[^']+'/, `image_url: '/images/products/medium/${id}.png'`);
  code = code.slice(0, blockStart) + block + code.slice(blockEnd);
});

fs.writeFileSync('src/lib/supabase/seed-data.ts', code, 'utf8');
console.log('Fixed all product image_url values to match their exact ID!');
