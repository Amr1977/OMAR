import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  { nameAr: 'تصميم وجرافيك', nameEn: 'Design & Graphics', nameFr: 'Design & Graphisme', nameUr: 'ڈیزائن اور گرافکس', icon: '🎨' },
  { nameAr: 'برمجة وتطوير', nameEn: 'Programming & Development', nameFr: 'Programmation & Développement', nameUr: 'پروگرامنگ اور ڈیولپمنٹ', icon: '💻' },
  { nameAr: 'تعليم وتدريب', nameEn: 'Education & Training', nameFr: 'Éducation & Formation', nameUr: 'تعلیم اور تربیت', icon: '📚' },
  { nameAr: 'صيانة وإصلاح', nameEn: 'Maintenance & Repair', nameFr: 'Entretien & Réparation', nameUr: 'مرمت اور دیکھ بھال', icon: '🔧' },
  { nameAr: 'صحة ولياقة', nameEn: 'Health & Fitness', nameFr: 'Santé & Fitness', nameUr: 'صحت اور فٹنس', icon: '💪' },
  { nameAr: 'خدمات منزلية', nameEn: 'Home Services', nameFr: 'Services à Domicile', nameUr: 'گھریلو خدمات', icon: '🏠' },
  { nameAr: 'نقل وشحن', nameEn: 'Transport & Shipping', nameFr: 'Transport & Expédition', nameUr: 'نقل و حمل', icon: '🚚' },
  { nameAr: 'تسويق وإعلان', nameEn: 'Marketing & Advertising', nameFr: 'Marketing & Publicité', nameUr: 'مارکیٹنگ اور اشتہارات', icon: '📢' },
  { nameAr: 'تصوير وفيديو', nameEn: 'Photography & Video', nameFr: 'Photographie & Vidéo', nameUr: 'فوٹوگرافی اور ویڈیو', icon: '📸' },
  { nameAr: 'استشارات', nameEn: 'Consulting', nameFr: 'Consultation', nameUr: 'مشاورت', icon: '💡' },
  { nameAr: 'كتابة وترجمة', nameEn: 'Writing & Translation', nameFr: 'Rédaction & Traduction', nameUr: 'تحریر اور ترجمہ', icon: '✍️' },
  { nameAr: 'أخرى', nameEn: 'Other', nameFr: 'Autre', nameUr: 'دیگر', icon: '📌' },
];

async function main() {
  const existing = await prisma.serviceCategory.count();
  if (existing > 0) {
    console.log(`Already have ${existing} categories, skipping seed`);
    return;
  }

  for (const cat of categories) {
    await prisma.serviceCategory.create({ data: cat });
  }

  console.log(`Seeded ${categories.length} service categories`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
