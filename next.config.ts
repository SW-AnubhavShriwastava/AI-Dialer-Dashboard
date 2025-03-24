/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/calls/start_call',
        destination: 'http://127.0.0.1:8000/start_call',
      },
    ]
  },
}

export default nextConfig
