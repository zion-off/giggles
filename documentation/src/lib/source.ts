import { type InferPageType, loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { docs } from 'fumadocs-mdx:collections/server';

export const source = loader({
  baseUrl: '/',
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()]
});

const SECTION_ORDER = ['Framework', 'Core', 'Components', 'Terminal'];

export function getOrderedPageTree() {
  const tree = source.getPageTree();
  return {
    ...tree,
    children: [...tree.children].sort((a, b) => {
      const getText = (node: typeof a) => (typeof node.name === 'string' ? node.name : '');
      const aIndex = SECTION_ORDER.indexOf(getText(a));
      const bIndex = SECTION_ORDER.indexOf(getText(b));
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    })
  };
}

export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url: `/og/docs/${segments.join('/')}`
  };
}

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title}

${processed}`;
}
