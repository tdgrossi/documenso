import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();
const r = await p.recipient.findUnique({
  where: { token: 'xOyCipgvZCc1qgEfgxaeV' },
  include: { envelope: { select: { internalVersion: true } } },
});
process.stdout.write(JSON.stringify({ internalVersion: r?.envelope?.internalVersion }));
await p.$disconnect();
