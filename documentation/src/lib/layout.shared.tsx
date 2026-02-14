import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export const gitConfig = {
  user: 'zion-off',
  repo: 'giggles',
  branch: 'main'
};

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'giggles'
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`
  };
}
