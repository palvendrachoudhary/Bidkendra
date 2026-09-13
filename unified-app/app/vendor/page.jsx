'use client';
import React from 'react';
import dynamic from 'next/dynamic';

const VendorPortal = dynamic(() => import('../../pages-components/VendorPortal'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
    </div>
  )
});

export default function VendorPage() {
  return <VendorPortal />;
}
