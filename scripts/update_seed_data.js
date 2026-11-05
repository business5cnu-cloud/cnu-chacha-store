const fs = require('fs');

const seedPath = 'src/lib/supabase/seed-data.ts';
let seed = fs.readFileSync(seedPath, 'utf8');

// List of product IDs
const prodIds = [
  'prod-hoodie', 'prod-socks', 'prod-memo', 'prod-limited-sticker',
  'prod-griptok', 'prod-keyring', 'prod-tumbler', 'prod-figure',
  'prod-laptop-pouch', 'prod-powerbank', 'prod-toothbrush', 'prod-travel-pouch',
  'prod-car-freshener', 'prod-ecobag', 'prod-custom-doll', 'prod-season-doll'
];

const legacyMap = {
  'prod-hoodie': '/images/products/legacy_original/prod_hoodie.png',
  'prod-socks': '/images/products/legacy_original/prod_socks.png',
  'prod-memo': '/images/products/legacy_original/prod_notebook.png',
  'prod-limited-sticker': '/images/products/legacy_original/prod_sticker.png',
  'prod-keyring': '/images/products/legacy_original/prod_keyring.png',
  'prod-tumbler': '/images/products/legacy_original/prod_tumbler.png',
  'prod-ecobag': '/images/products/legacy_original/prod_ecobag.png',
  'prod-custom-doll': '/images/products/legacy_original/prod_doll_s.png',
  'prod-season-doll': '/images/products/legacy_original/prod_doll_s.png'
};

for (const id of prodIds) {
  const legacy = legacyMap[id] ? `legacy_lowres_url: '${legacyMap[id]}',` : '';
  const regex = new RegExp(`id:\\s*'${id}'[\\s\\S]*?image_url:\\s*['"][^'"]+['"],`);
  
  seed = seed.replace(regex, (match) => {
    return match + `
    thumbnail_url: '/images/products/thumbnail/${id}.png',
    medium_url: '/images/products/medium/${id}.png',
    large_url: '/images/products/large/${id}.png',
    original_url: '/images/products/original/${id}.png',
    lifestyle_url: '/images/products/lifestyle/${id}.png',
    ai_enhanced_url: '/images/products/ai_enhanced/${id}.png',
    is_ai_enhanced: false,
    ${legacy}
    gallery_images: [
      '/images/products/large/${id}.png',
      '/images/products/lifestyle/${id}.png',
      '/images/products/ai_enhanced/${id}.png'
    ],`;
  });
}

// Replace photo reviews thumbnails to avoid low-res
seed = seed.replace(/\/images\/chacha\/review_thumb_1\.png/g, '/images/products/thumbnail/prod-custom-doll.png');
seed = seed.replace(/\/images\/chacha\/review_thumb_2\.png/g, '/images/products/thumbnail/prod-hoodie.png');
seed = seed.replace(/\/images\/chacha\/review_thumb_3\.png/g, '/images/products/thumbnail/prod-keyring.png');

fs.writeFileSync(seedPath, seed, 'utf8');
console.log('seed-data.ts updated with multi-resolution & policy fields');
