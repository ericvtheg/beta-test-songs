import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const song = await prisma.song.create({
    data: { link: 'soundcloud.com/someLink', email: 'someEmail@gmail.com' },
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
