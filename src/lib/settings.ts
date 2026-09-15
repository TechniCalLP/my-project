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
