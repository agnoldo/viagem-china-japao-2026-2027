import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { preparePosts } from './posts';
import { readContent } from './read-content';

export function postsPlugin(root = 'data/posts'): Plugin {
  const virtualId = 'virtual:trip-posts';
  const resolvedId = '\0' + virtualId;
  let prepared: Awaited<ReturnType<typeof preparePosts>>;
  let building = false;
  const prepare = async () => {
    prepared = await preparePosts(root);
    readContent(prepared.categories); // The same validation gate as operational YAML.
  };
  return {
    name: 'trip-posts',
    configResolved(config) {
      building = config.command === 'build';
    },
    async buildStart() {
      await prepare();
      this.addWatchFile(resolve(root));
      if (building)
        for (const [fileName, source] of prepared.assets)
          this.emitFile({ type: 'asset', fileName, source });
    },
    resolveId(id) {
      if (id === virtualId) return resolvedId;
    },
    load(id) {
      if (id === resolvedId) return `export default ${JSON.stringify(prepared.categories)};`;
    },
    configureServer(server) {
      server.watcher.add(resolve(root));
      let rebuild = Promise.resolve();
      server.watcher.on('all', (_event, path) => {
        if (!path.startsWith(resolve(root))) return;
        rebuild = rebuild
          .then(async () => {
            await prepare();
            const module = server.moduleGraph.getModuleById(resolvedId);
            if (module) server.moduleGraph.invalidateModule(module);
            server.ws.send({ type: 'full-reload' });
          })
          .catch((error: Error) => {
            server.ws.send({
              type: 'error',
              err: { message: error.message, stack: error.stack ?? '' },
            });
          });
      });
      server.middlewares.use((req, res, next) => {
        const path = new URL(req.url ?? '/', 'http://localhost').pathname;
        const key = path.slice(path.indexOf('/posts/') + 1);
        const data = path.includes('/posts/') && prepared?.assets.get(key);
        if (!data) return next();
        res.setHeader('Content-Type', 'image/webp');
        res.end(data);
      });
    },
  };
}
