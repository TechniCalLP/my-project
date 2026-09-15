import { prisma } from "@/lib/prisma"

export interface ActiveSignature {
  name: string
  position: string
  imageData: string
}

export async function getActiveDocumentSignature(): Promise<ActiveSignature | null> {
  const signature = await prisma.documentSignature.findFirst({ where: { isActive: true } })
  if (!signature) return null
  return { name: signature.name, position: signature.position, imageData: signature.imageData }
}

export const COLLEGE_LOGO_KEY = "college_logo"

export async function getCollegeLogo(): Promise<string | null> {
  const setting = await prisma.systemSetting.findUnique({ where: { key: COLLEGE_LOGO_KEY } })
  return setting?.value ?? null
}
