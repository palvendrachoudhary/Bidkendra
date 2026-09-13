'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import Layout from '../../../components/layout/Layout';
import ErrorBoundary from '../../../components/common/ErrorBoundary';

const BidderVerification = dynamic(() => import('../../../pages-components/BidderVerification'), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center text-slate-400">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
    </div>
  )
});

export default function VerificationWithIdPage() {
  return (
    <Layout>
      <ErrorBoundary>
        <BidderVerification />
      </ErrorBoundary>
    </Layout>
  );
}
