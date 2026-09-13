'use strict';
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack: (config, { isServer }) => {
    config.resolve.alias['react-router-dom'] = path.resolve(__dirname, 'lib/router-shim.js');
    if (isServer) {
      config.externals = [...(config.externals || []), 'pg-native'];
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['pg', 'pdf-parse']
  }
};

module.exports = nextConfig;
