const fs = require('fs');
const content = fs.readFileSync('src/lib/supabase/seed-data.ts', 'utf8');
const pStart = content.indexOf('export const INITIAL_PRODUCTS');
const pEnd = content.indexOf('export const INITIAL_PROFILES');
const block = content.slice(pStart, pEnd);
const ids = ['prod-hoodie', 'prod-socks', 'prod-memo', 'prod-limited-sticker', 'prod-griptok', 'prod-keyring', 'prod-tumbler', 'prod-figure', 'prod-laptop-pouch', 'prod-powerbank', 'prod-toothbrush', 'prod-travel-pouch', 'prod-car-freshener', 'prod-ecobag', 'prod-custom-doll', 'prod-season-doll'];
ids.forEach(id => {
  const re = new RegExp(`id: '${id}'[\\s\\S]*?image_url: '([^']+)'`);
  const m = block.match(re);
  console.log(id.padEnd(22), '=>', m ? m[1] : 'NOT FOUND');
});
