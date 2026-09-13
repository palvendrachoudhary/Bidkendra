'use client';
import React from 'react';
import NextLink from 'next/link';
import { useRouter, usePathname, useSearchParams, useParams as useNextParams } from 'next/navigation';

export function Link({ to, href, children, className, ...props }) {
  const target = to || href || '#';
  return React.createElement(NextLink, { href: target, className, ...props }, children);
}

export function NavLink({ to, href, className, children, ...props }) {
  const pathname = usePathname() || '';
  const target = to || href || '';
  const isActive = pathname === target || (target !== '/' && target !== '' && pathname.startsWith(target));
  const computedClass = typeof className === 'function' ? className({ isActive }) : className;
  return React.createElement(NextLink, { href: target, className: computedClass, ...props }, children);
}

export function useNavigate() {
  const router = useRouter();
  return (to, options) => {
    if (typeof to === 'number') {
      if (to === -1) router.back();
      return;
    }
    if (options?.replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  };
}

export function useLocation() {
  const pathname = usePathname() || '/';
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ? '?' + searchParams.toString() : '';
  return {
    pathname,
    search,
    hash: '',
    state: null,
  };
}

export function useParams() {
  const params = useNextParams();
  return params || {};
}

export function Navigate({ to, replace }) {
  const router = useRouter();
  React.useEffect(() => {
    if (replace) router.replace(to);
    else router.push(to);
  }, [to, replace, router]);
  return null;
}

export function Outlet() {
  return null;
}

export function BrowserRouter({ children }) {
  return React.createElement(React.Fragment, null, children);
}

export function Routes({ children }) {
  return React.createElement(React.Fragment, null, children);
}

export function Route() {
  return null;
}
