import * as p from '@clack/prompts';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

function detectPackageManager(): string {
  const userAgent = process.env.npm_config_user_agent ?? '';
  if (userAgent.startsWith('yarn')) return 'yarn';
  if (userAgent.startsWith('pnpm')) return 'pnpm';
  return 'npm';
}

function copyDir(src: string, dest: string, rename?: Record<string, string>) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destName = rename?.[entry.name] ?? entry.name;
    const destPath = path.join(dest, destName);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, rename);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function main() {
  p.intro('create-giggles-app');

  const argName = process.argv[2];

  const options = await p.group(
    {
      name: () =>
        p.text({
          message: 'project name?',
          placeholder: 'my-tui',
          initialValue: argName ?? '',
          validate: (value: string) => {
            if (!value.trim()) return 'project name is required.';
            if (/[^\w\-.]/.test(value)) return 'project name contains invalid characters.';
          }
        }),
      location: ({ results }: { results: { name?: string } }) =>
        p.text({
          message: 'where should we create the project?',
          placeholder: `./${results.name}`,
          initialValue: `./${results.name}`
        }),
      language: () =>
        p.select({
          message: 'language?',
          options: [
            { value: 'typescript', label: 'typescript', hint: 'recommended' },
            { value: 'javascript', label: 'javascript' }
          ]
        }),
      linting: () =>
        p.confirm({
          message: 'add eslint + prettier?',
          initialValue: true
        }),
      install: () =>
        p.confirm({
          message: 'install dependencies?',
          initialValue: true
        })
    },
    {
      onCancel: () => {
        p.cancel('cancelled.');
        process.exit(0);
      }
    }
  );

  const projectDir = path.resolve(options.location as string);
  const templatesDir = path.resolve(import.meta.dirname, '..', 'templates');
  const isTs = options.language === 'typescript';
  const pm = detectPackageManager();

  const s = p.spinner();

  // create project directory
  if (fs.existsSync(projectDir)) {
    const files = fs.readdirSync(projectDir);
    if (files.length > 0) {
      p.cancel(`directory ${options.location} is not empty.`);
      process.exit(1);
    }
  }
  fs.mkdirSync(projectDir, { recursive: true });

  // copy base files
  s.start('scaffolding project...');
  copyDir(path.join(templatesDir, 'base'), projectDir, {
    _gitignore: '.gitignore'
  });

  // copy language-specific files
  const langDir = isTs ? 'typescript' : 'javascript';
  copyDir(path.join(templatesDir, langDir), projectDir);

  // copy linting configs if opted in
  if (options.linting) {
    copyDir(path.join(templatesDir, 'linting'), projectDir, {
      _prettierrc: '.prettierrc',
      _prettierignore: '.prettierignore'
    });
  }

  // generate package.json
  const ext = isTs ? 'tsx' : 'jsx';
  const scripts: Record<string, string> = {
    dev: `tsx --watch src/index.${ext}`,
    build: 'tsup',
    start: 'node dist/index.js'
  };

  const deps: Record<string, string> = {
    giggles: 'latest',
    ink: '^6.6.0',
    react: '^19.2.4'
  };

  const devDeps: Record<string, string> = {
    tsx: '^4.21.0',
    tsup: '^8.5.1'
  };

  if (isTs) {
    devDeps['@types/react'] = '^19.2.13';
    devDeps['typescript'] = '^5.0.3';
  }

  if (options.linting) {
    scripts['lint'] = 'prettier --write . && eslint . --fix';
    devDeps['prettier'] = '^2.8.7';
    devDeps['@trivago/prettier-plugin-sort-imports'] = '^4.3.0';
    devDeps['eslint'] = '^9.0.0';
    devDeps['eslint-plugin-react'] = '^7.32.2';
    devDeps['eslint-plugin-react-hooks'] = '^7.0.1';
    devDeps['typescript-eslint'] = '^8.0.0';
  }

  const pkg = {
    name: options.name,
    version: '0.1.0',
    type: 'module',
    scripts,
    dependencies: deps,
    devDependencies: devDeps
  };

  fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
  s.stop('project scaffolded.');

  // install dependencies
  if (options.install) {
    const messages = ['installing dependencies...', 'giggling...', 'hehehe...', 'almost there...', 'still giggling...'];
    let i = 0;
    s.start(messages[0]);
    const interval = setInterval(() => {
      i = (i + 1) % messages.length;
      s.message(messages[i]);
    }, 2000);
    try {
      await execAsync(`${pm} install`, { cwd: projectDir });
      clearInterval(interval);
      s.stop('dependencies installed.');
    } catch {
      clearInterval(interval);
      s.stop('failed to install dependencies.');
      p.log.warning(`run \`${pm} install\` manually in the project directory.`);
    }
  }

  const relative = path.relative(process.cwd(), projectDir);

  p.note([`cd ${relative}`, `${pm} dev`].join('\n'), 'next steps');

  p.outro('done! :p');
}

main().catch(console.error);
