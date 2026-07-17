import { defineConfig } from 'vitest/config';

/**
 * Two test projects:
 *  - "node": packages + API (unit, integration, governance, non-functional).
 *  - "web":  React component tests in jsdom (Testing Library).
 * JSX is transformed by esbuild's automatic runtime (React 19).
 */
export default defineConfig({
  esbuild: { jsx: 'automatic' },
  test: {
    projects: [
      {
        esbuild: { jsx: 'automatic' },
        test: {
          name: 'node',
          include: ['packages/*/test/**/*.test.ts', 'apps/api/test/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        esbuild: { jsx: 'automatic' },
        test: {
          name: 'web',
          include: ['apps/web/test/**/*.test.{ts,tsx}'],
          environment: 'jsdom',
          globals: true,
          setupFiles: ['./apps/web/test/setup.ts'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary'],
      include: ['packages/*/src/**/*.ts', 'apps/*/src/**/*.{ts,tsx}'],
      exclude: ['**/*.d.ts', 'apps/web/src/main.tsx'],
    },
  },
});
