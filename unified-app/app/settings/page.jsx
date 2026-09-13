'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import Layout from '../../components/layout/Layout';

const Settings = dynamic(() => import('../../pages-components/Settings'), {
  ssr: false
});

export default function SettingsPage() {
  return (
    <Layout>
      <Settings />
    </Layout>
  );
}
