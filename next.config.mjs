/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/odoo/api/portal/:path*',
        destination: 'https://bot-odoo.2fsywk.easypanel.host/api/portal/:path*',
      },
      {
        source: '/api/odoo/portal/:path*',
        destination: 'https://bot-odoo.2fsywk.easypanel.host/api/portal/:path*',
      },
    ];
  },
};

export default nextConfig;
