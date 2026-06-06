import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, role: true, enabledModules: true } });
  let updated = 0;

  for (const user of users) {
    const modules: string[] = [];
    if (user.role === 'GROOM' || user.role === 'BOTH') modules.push('marriage');
    if (user.role === 'GUARDIAN' || user.role === 'BOTH') modules.push('guardian');
    if (user.role === 'ADMIN') modules.push('marriage', 'guardian');

    const current = user.enabledModules as string[];
    if (JSON.stringify(current.sort()) !== JSON.stringify(modules.sort())) {
      await prisma.user.update({
        where: { id: user.id },
        data: { enabledModules: modules },
      });
      updated++;
    }
  }

  console.log(`Updated ${updated} users with enabledModules based on their role`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
