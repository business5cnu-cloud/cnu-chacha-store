const fs = require('fs');

const path = 'src/lib/supabase/seed-data.ts';
let code = fs.readFileSync(path, 'utf8');

const startTag = 'export const INITIAL_PRODUCTS: Product[] = [';
const endTag = 'export const INITIAL_PROFILES';

const startIndex = code.indexOf(startTag);
const endIndex = code.indexOf(endTag);

if (startIndex !== -1 && endIndex !== -1) {
  let productsBlock = code.slice(startIndex + startTag.length, endIndex);
  
  const productIds = [
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

  productIds.forEach(id => {
    const pIdx = productsBlock.indexOf(`id: '${id}',`);
    if (pIdx === -1) return;
    
    let nextPIdx = productsBlock.length;
    for (const otherId of productIds) {
      if (otherId === id) continue;
      const idx = productsBlock.indexOf(`id: '${otherId}',`, pIdx + 10);
      if (idx !== -1 && idx < nextPIdx) {
        nextPIdx = idx;
      }
    }
    
    let sub = productsBlock.slice(pIdx, nextPIdx);
    
    sub = sub.replace(/image_url:\s*'[^']+',?/, `image_url: '/images/products/medium/${id}.png',`);
    sub = sub.replace(/thumbnail_url:\s*'[^']+',?/, `thumbnail_url: '/images/products/thumbnail/${id}.png',`);
    sub = sub.replace(/medium_url:\s*'[^']+',?/, `medium_url: '/images/products/medium/${id}.png',`);
    sub = sub.replace(/large_url:\s*'[^']+',?/, `large_url: '/images/products/large/${id}.png',`);
    sub = sub.replace(/original_url:\s*'[^']+',?/, `original_url: '/images/products/original/${id}.png',`);
    sub = sub.replace(/lifestyle_url:\s*'[^']+',?/, `lifestyle_url: '/images/products/large/${id}.png',`);
    sub = sub.replace(/ai_enhanced_url:\s*'[^']+',?/, `ai_enhanced_url: '/images/products/ai_enhanced/${id}.png',`);
    
    productsBlock = productsBlock.slice(0, pIdx) + sub + productsBlock.slice(nextPIdx);
  });
  
  code = code.slice(0, startIndex + startTag.length) + productsBlock + code.slice(endIndex);
  fs.writeFileSync(path, code, 'utf8');
  console.log('Sanitized all INITIAL_PRODUCTS image URLs successfully!');
} else {
  console.error('Tags not found in seed-data.ts');
}
