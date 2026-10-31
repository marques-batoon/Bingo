import { defineConfig } from 'vitest/config';

// Security-rules tests. Needs the emulators running: `npm run emulators`, then `npm run test:rules`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['rules-tests/**/*.test.ts'],
    testTimeout: 20000,
    fileParallelism: false,
  },
});
