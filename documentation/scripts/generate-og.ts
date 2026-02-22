import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { jsx, jsxs } from 'react/jsx-runtime';
import { ImageResponse } from 'next/og';

// Inlined from fumadocs-ui/og to avoid ESM/CJS interop issues in a build script
function generate({
  title,
  description,
  site,
  primaryColor = 'rgba(255,150,255,0.3)',
  primaryTextColor = 'rgb(255,150,255)'
}: {
  title: string;
  description?: string;
  site?: string;
  primaryColor?: string;
  primaryTextColor?: string;
}) {
  return jsxs('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      color: 'white',
      padding: '4rem',
      backgroundColor: '#0c0c0c',
      backgroundImage: `linear-gradient(to top right, ${primaryColor}, transparent)`
    },
    children: [
      jsxs('div', {
        style: {
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '12px',
          color: primaryTextColor
        },
        children: [jsx('p', { style: { fontSize: '56px', fontWeight: 600 }, children: site })]
      }),
      jsx('p', { style: { fontWeight: 800, fontSize: '82px' }, children: title }),
      jsx('p', {
        style: { fontSize: '52px', color: 'rgba(240,240,240,0.8)' },
        children: description
      })
    ]
  });
}

function parseFrontmatter(content: string): { title?: string; description?: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const result: { title?: string; description?: string } = {};
  for (const line of match[1].split('\n')) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const value = line
      .slice(colon + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
    if (key === 'title') result.title = value;
    if (key === 'description') result.description = value;
  }
  return result;
}

const contentDir = join(process.cwd(), 'content/docs');
const publicDir = join(process.cwd(), 'public');

function getMdxFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...getMdxFiles(full));
    } else if (entry.endsWith('.mdx')) {
      results.push(full);
    }
  }
  return results;
}

function fileToSlugSegments(filePath: string): string[] {
  const rel = relative(contentDir, filePath);
  const segments = rel.replace(/\.mdx$/, '').split('/');
  if (segments[segments.length - 1] === 'index') {
    segments.pop();
  }
  return segments;
}

async function main() {
  const files = getMdxFiles(contentDir);
  let count = 0;

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const fm = parseFrontmatter(content);
    if (!fm.title) continue;

    const slugSegments = fileToSlugSegments(file);
    const response = new ImageResponse(generate({ title: fm.title, description: fm.description, site: 'giggles' }), {
      width: 1200,
      height: 630
    });

    const buffer = await response.arrayBuffer();
    const outPath = join(publicDir, 'og', 'docs', ...slugSegments, 'image.png');
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, Buffer.from(buffer));
    console.log(`  /og/docs/${slugSegments.join('/')}/image.png`);
    count++;
  }

  console.log(`\nGenerated ${count} OG images`);
}

main().catch(console.error);
