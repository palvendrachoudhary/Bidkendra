'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import Layout from '../../components/layout/Layout';

const AuditTrail = dynamic(() => import('../../pages-components/AuditTrail'), {
  ssr: false
});

export default function AuditPage() {
  return (
    <Layout>
      <AuditTrail />
    </Layout>
  );
}
