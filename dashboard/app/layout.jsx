import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata = {
  title: 'Dashboard — Dinasti Barbershop',
  description: 'Panel admin privat untuk Dinasti Barbershop. Kelola data penjualan, kas, dan konten website.',
  robots: 'noindex, nofollow', // Dashboard tidak boleh diindeks
}

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
