import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/editor/',
        '/export/',
        '/api/',
      ],
    },
    sitemap: 'https://nxtgencaptions.com/sitemap.xml',
  }
}
