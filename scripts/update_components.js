const fs = require('fs');

// 1. Update ProductCard.tsx
let card = fs.readFileSync('src/components/store/ProductCard.tsx', 'utf8');
card = card.replace(
  /<ProductArtwork[\s\S]*?className="h-full w-full"[\s\S]*?\/>/,
  `<ProductArtwork
          sku={product.sku}
          name={product.name}
          imageUrl={product.medium_url || product.image_url}
          thumbnailUrl={product.thumbnail_url}
          mediumUrl={product.medium_url}
          largeUrl={product.large_url}
          originalUrl={product.original_url}
          lifestyleUrl={product.lifestyle_url}
          aiEnhancedUrl={product.ai_enhanced_url}
          isAiEnhanced={product.is_ai_enhanced}
          categoryName={product.category_name}
          isLimited={product.is_limited}
          variant="list"
          priority={rank !== undefined && rank <= 4}
          className="h-full w-full"
        />`
);
fs.writeFileSync('src/components/store/ProductCard.tsx', card, 'utf8');
console.log('ProductCard.tsx updated');

// 2. Update page.tsx (Store Home Hero Banner)
let home = fs.readFileSync('src/app/(store)/page.tsx', 'utf8');
home = home.replace(
  /\/images\/chacha\/hero_exhibition\.png/g,
  '/images/chacha/hero_exhibition_1920x800.png'
);
fs.writeFileSync('src/app/(store)/page.tsx', home, 'utf8');
console.log('page.tsx hero banner updated');
