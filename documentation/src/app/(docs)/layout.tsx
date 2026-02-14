import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const tree = source.getPageTree();

  // Reorder sections: Framework first, then Core
  const orderedTree = {
    ...tree,
    children: [...tree.children].sort((a, b) => {
      const order = ['Framework', 'Core'];
      // Extract text from name (handles both string and ReactNode)
      const getText = (node: typeof a): string => {
        if (typeof node.name === 'string') return node.name;
        return '';
      };
      const aName = getText(a);
      const bName = getText(b);
      const aIndex = order.indexOf(aName);
      const bIndex = order.indexOf(bName);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    })
  };

  return (
    <DocsLayout tree={orderedTree} {...baseOptions()}>
      {children}
    </DocsLayout>
  );
}
