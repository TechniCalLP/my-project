import Image from "next/image"

interface CollegeLogoImageProps {
  logoUrl: string | null
  width: number
  height: number
  alt?: string
  className?: string
  priority?: boolean
}

export function CollegeLogoImage({ logoUrl, width, height, alt = "วิทยาลัยเทคนิคลำปาง", className, priority }: CollegeLogoImageProps) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={alt}
        width={width}
        height={height}
        className={className}
        fetchPriority={priority ? "high" : undefined}
      />
    )
  }
  return <Image src="/logo-college.png" alt={alt} width={width} height={height} className={className} priority={priority} />
}
