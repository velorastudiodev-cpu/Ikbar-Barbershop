import { createClient } from '@/lib/supabase/server'
import WebsiteClient from './WebsiteClient'

export const metadata = { title: 'Kelola Website — Ikbar Dashboard' }

export default async function WebsitePage() {
  const supabase = await createClient()

  const [galleryRes, servicesRes, contentRes] = await Promise.all([
    supabase
      .from('gallery_items')
      .select('*')
      .order('sort_order', { ascending: true }),
    supabase
      .from('services')
      .select('*')
      .order('sort_order', { ascending: true }),
    supabase
      .from('site_content')
      .select('section, content')
      .in('section', ['lokasi', 'kontak', 'barber', 'about', 'video']),
  ])

  // Normalize site_content menjadi object { section: content }
  const siteContent = {}
  for (const row of (contentRes.data || [])) {
    siteContent[row.section] = row.content
  }

  return (
    <WebsiteClient
      initialGallery={galleryRes.data || []}
      initialServices={servicesRes.data || []}
      siteContent={siteContent}
    />
  )
}
