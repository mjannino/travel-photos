import { createClient } from 'contentful'

// Contentful client configuration
// Set these environment variables in your .env.local file:
// - CONTENTFUL_SPACE_ID
// - CONTENTFUL_ACCESS_TOKEN

export const contentfulClient = createClient({
  space: process.env.CONTENTFUL_SPACE_ID || '',
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN || '',
})
