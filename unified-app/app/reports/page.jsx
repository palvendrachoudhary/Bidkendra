'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import Layout from '../../components/layout/Layout';

const ComplianceReport = dynamic(() => import('../../pages-components/ComplianceReport'), {
  ssr: false
});

export default function ReportsPage() {
  return (
    <Layout>
      <ComplianceReport />
    </Layout>
  );
}
