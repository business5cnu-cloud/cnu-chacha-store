const fs = require('fs');
let code = fs.readFileSync('src/hooks/useStore.tsx', 'utf8');

const oldKeys = /const STORAGE_KEYS = \{[\s\S]*?\};/;
const newKeys = `const STORAGE_KEYS = {
  PRODUCTS: 'cnu_chacha_products_v4',
  ORDERS: 'cnu_chacha_orders_v4',
  PROFILES: 'cnu_chacha_profiles_v4',
  MOVEMENTS: 'cnu_chacha_movements_v4',
  CART: 'cnu_chacha_cart_v4',
  CURRENT_USER: 'cnu_chacha_user_v4',
  REVIEWS: 'cnu_chacha_reviews_v4',
  COMMISSIONS: 'cnu_chacha_commissions_v4',
  WISHLIST: 'cnu_chacha_wishlist_v4',
  LIKE_COUNTS: 'cnu_chacha_like_counts_v4',
};`;

code = code.replace(oldKeys, newKeys);

const oldLoad = /const savedProducts = localStorage\.getItem\(STORAGE_KEYS\.PRODUCTS\);\s*if \(savedProducts\) \{\s*const parsed: Product\[\] = JSON\.parse\(savedProducts\);\s*setProducts\(parsed\.map\(synchronizeProductState\)\);\s*\}/;
const newLoad = `const savedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (savedProducts) {
        const parsed: Product[] = JSON.parse(savedProducts);
        const merged = parsed.map((p) => {
          const init = INITIAL_PRODUCTS.find((ip) => ip.id === p.id);
          if (!init) return p;
          return {
            ...p,
            image_url: init.image_url,
            thumbnail_url: init.thumbnail_url,
            medium_url: init.medium_url,
            large_url: init.large_url,
            original_url: init.original_url,
            lifestyle_url: init.lifestyle_url,
            ai_enhanced_url: init.ai_enhanced_url,
          };
        });
        setProducts(merged.map(synchronizeProductState));
      }`;

code = code.replace(oldLoad, newLoad);
fs.writeFileSync('src/hooks/useStore.tsx', code, 'utf8');
console.log('useStore.tsx updated successfully!');
