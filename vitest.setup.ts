(globalThis as any).process = (globalThis as any).process || { env: {} };
(globalThis as any).process.env = (globalThis as any).process.env || {};
(globalThis as any).process.env.NODE_ENV = 'production';
