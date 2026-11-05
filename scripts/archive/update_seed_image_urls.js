const fs = require('fs');
let code = fs.readFileSync('src/lib/supabase/seed-data.ts', 'utf8');

// Replace image_url with medium_url for all products in INITIAL_PRODUCTS
code = code.replace(/id:\s*'(prod-[^']+)'[\s\S]*?image_url:\s*'[^']+'/g, (match, id) => {
  return match.replace(/image_url:\s*'[^']+'/, `image_url: '/images/products/medium/${id}.png'`);
});

fs.writeFileSync('src/lib/supabase/seed-data.ts', code, 'utf8');
console.log('Updated image_url in seed-data.ts!');
