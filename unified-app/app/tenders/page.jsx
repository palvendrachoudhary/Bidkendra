'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import Layout from '../../components/layout/Layout';

const TenderManagement = dynamic(() => import('../../pages-components/TenderManagement'), {
  ssr: false
});

export default function TendersPage() {
  return (
    <Layout>
      <TenderManagement />
    </Layout>
  );
}
