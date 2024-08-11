import PrismaClient from '@prisma/client';
import { fieldEncryptionMiddleware } from 'prisma-field-encryption';
import cache from 'global-cache';

let prisma: any = cache.get("prismadb")
if (prisma == undefined) {
    prisma = new PrismaClient.PrismaClient();
    prisma.$use(fieldEncryptionMiddleware());
    cache.set("prismadb", prisma)
}

export function getPrisma(): PrismaClient.PrismaClient {
    return prisma;
}
