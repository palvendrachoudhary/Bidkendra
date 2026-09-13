'use client';
import React from 'react';
import dynamic from 'next/dynamic';

const Login = dynamic(() => import('../../pages-components/Login'), {
  ssr: false
});

export default function LoginPage() {
  return <Login />;
}
