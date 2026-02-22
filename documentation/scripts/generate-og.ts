import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { jsx, jsxs } from 'react/jsx-runtime';
import { ImageResponse } from 'next/og';

// Mondrian palette (matches global.css theme variables)
const M = {
  red: '#e8180a',
  blue: '#0d5fc9',
  yellow: '#f9ce1f',
  black: '#404040',
  bg: '#eeeae2', // hsl(45, 20%, 92%)
  fg: '#333333', // hsl(0, 0%, 20%)
  muted: '#777777'
};

function ColorStrip({ weights }: { weights: [string, number][] }) {
  return jsxs('div', {
    style: { display: 'flex', width: '100%', height: '100%' },
    children: weights.map(([color, flex], i) =>
      jsx('div', { style: { display: 'flex', flex, backgroundColor: color } }, i)
    )
  });
}

function generate({ title, description, site }: { title: string; description?: string; site?: string }) {
  // Left column: red / blue / yellow blocks
  const leftBlocks: [string, number][] = [
    [M.red, 2],
    [M.black, 0.15],
    [M.blue, 3],
    [M.black, 0.15],
    [M.yellow, 2]
  ];

  return jsxs('div', {
    style: {
      display: 'flex',
      flexDirection: 'row',
      width: '100%',
      height: '100%',
      backgroundColor: M.bg,
      fontFamily: 'monospace'
    },
    children: [
      // Left Mondrian column
      jsx('div', {
        style: { display: 'flex', flexDirection: 'column', width: '10px', flexShrink: 0 },
        children: jsx(ColorStrip, { weights: leftBlocks })
      }),
      // 1px black separator
      jsx('div', { style: { display: 'flex', width: '1px', backgroundColor: M.black, flexShrink: 0 } }),

      // Content area
      jsxs('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          padding: '52px 72px',
          justifyContent: 'space-between'
        },
        children: [
          // Site name
          jsxs('div', {
            style: { display: 'flex', alignItems: 'center', gap: '10px' },
            children: [
              jsx('span', {
                style: { fontSize: '28px', color: M.fg, fontFamily: 'monospace', fontWeight: 700 },
                children: site
              }),
              jsx('span', { style: { fontSize: '16px', color: M.red, fontFamily: 'monospace' }, children: '█' })
            ]
          }),

          // Title + description
          jsxs('div', {
            style: { display: 'flex', flexDirection: 'column', gap: '20px' },
            children: [
              jsx('p', {
                style: { fontSize: '72px', fontWeight: 800, color: M.fg, lineHeight: 1.1, margin: 0 },
                children: title
              }),
              description &&
                jsx('p', {
                  style: { fontSize: '32px', color: M.muted, margin: 0, lineHeight: 1.4 },
                  children: description
                })
            ]
          }),

          // Spacer
          jsx('div', { style: { display: 'flex' } })
        ]
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
