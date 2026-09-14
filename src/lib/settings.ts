import { prisma } from "@/lib/prisma"

export const DEPUTY_DIRECTOR_SIGNATURE_KEY = "deputy_director_signature"

export async function getDeputyDirectorSignature(): Promise<string | null> {
  const setting = await prisma.systemSetting.findUnique({ where: { key: DEPUTY_DIRECTOR_SIGNATURE_KEY } })
  return setting?.value ?? null
}
