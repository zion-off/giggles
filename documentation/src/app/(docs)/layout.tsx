import type { ReactNode } from 'react';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { getOrderedPageTree } from '@/lib/source';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <DocsLayout tree={getOrderedPageTree()} {...baseOptions()}>
      {children}
    </DocsLayout>
  );
}
