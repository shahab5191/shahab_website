import { defineConfig, type Plugin } from 'vite';

function publicReload(): Plugin {
  return {
    name: 'public-reload',
    configureServer(server) {
      const publicDir = server.config.publicDir;
      const reload = () => server.ws.send({ type: 'full-reload' });
      for (const event of ['add', 'change', 'unlink'] as const) {
        server.watcher.on(event, (file: string) => {
          if (file.startsWith(publicDir)) reload();
        });
      }
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [publicReload()],
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
