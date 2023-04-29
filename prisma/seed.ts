import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.create({ data: { email: 'test@email.com' } });
  const song = await prisma.song.create({
    data: { link: 'soundcloud.com/someLink', userId: user.id },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
