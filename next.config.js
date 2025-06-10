/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Temporalmente ignorar errores de ESLint durante build para producción
    ignoreDuringBuilds: true,
  },
  typescript: {
    // También ignorar errores de TypeScript durante build si es necesario
    // ignoreBuildErrors: true,
  },
};

module.exports = nextConfig; 