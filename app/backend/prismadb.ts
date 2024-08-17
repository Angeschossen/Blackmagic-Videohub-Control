import { PrismaClient } from '@prisma/client';
import { fieldEncryptionExtension, fieldEncryptionMiddleware } from 'prisma-field-encryption';
import cache from 'global-cache';

let prisma: any = cache.get("prismadb")
if (prisma == undefined) {
    prisma = new PrismaClient().$extends(fieldEncryptionExtension());
    cache.set("prismadb", prisma)
}

export function getPrisma(): PrismaClient {
    return prisma;
}
