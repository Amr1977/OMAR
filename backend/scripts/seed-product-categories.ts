import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  { nameAr: 'إلكترونيات', nameEn: 'Electronics', nameFr: 'Électroniques', nameUr: 'الیکٹرانکس', icon: '📱' },
  { nameAr: 'ملابس', nameEn: 'Clothing', nameFr: 'Vêtements', nameUr: 'کپڑے', icon: '👕' },
  { nameAr: 'منزل ومطبخ', nameEn: 'Home & Kitchen', nameFr: 'Maison & Cuisine', nameUr: 'گھر اور باورچی خانہ', icon: '🏠' },
  { nameAr: 'جمال وصحة', nameEn: 'Beauty & Health', nameFr: 'Beauté & Santé', nameUr: 'خوبصورتی اور صحت', icon: '💄' },
  { nameAr: 'ألعاب وهدايا', nameEn: 'Toys & Gifts', nameFr: 'Jouets & Cadeaux', nameUr: 'کھلونے اور تحائف', icon: '🎁' },
  { nameAr: 'كتب وقرطاسية', nameEn: 'Books & Stationery', nameFr: 'Livres & Papeterie', nameUr: 'کتابیں اور اسٹیشنری', icon: '📚' },
  { nameAr: 'رياضة', nameEn: 'Sports', nameFr: 'Sports', nameUr: 'کھیل', icon: '⚽' },
  { nameAr: 'أخرى', nameEn: 'Other', nameFr: 'Autre', nameUr: 'دیگر', icon: '📌' },
];

async function main() {
  const existing = await prisma.productCategory.count();
  if (existing > 0) {
    console.log(`Already have ${existing} product categories, skipping seed`);
    return;
  }
  for (const cat of categories) {
    await prisma.productCategory.create({ data: cat });
  }
  console.log(`Seeded ${categories.length} product categories`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
