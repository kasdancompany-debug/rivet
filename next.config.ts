import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/proof-of-transfer", destination: "/dashboard", permanent: false },
      { source: "/proof-of-transfer/:path*", destination: "/dashboard", permanent: false },
      { source: "/operations", destination: "/dashboard", permanent: false },
      { source: "/operations/:path*", destination: "/dashboard", permanent: false },
      { source: "/team", destination: "/training/succession", permanent: false },
      { source: "/team/succession", destination: "/training/succession", permanent: false },
      { source: "/business-brain", destination: "/brain", permanent: false },
      { source: "/business-brain/:path*", destination: "/brain", permanent: false },
      { source: "/coach", destination: "/dashboard", permanent: false },
      { source: "/coach/:path*", destination: "/dashboard", permanent: false },
    ]
  },
}

export default nextConfig
