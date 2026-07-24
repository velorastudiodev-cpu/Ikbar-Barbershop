/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // Set root ke folder dashboard sendiri agar tidak konflik
    // dengan package-lock.json di folder parent (Vite landing page)
    root: import.meta.dirname,
  },
}

export default nextConfig
