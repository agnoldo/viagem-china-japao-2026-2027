import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadContentFiles } from '../src/content/validate';
export function readContent(posts: unknown = []) {
  const files: Record<string, string> = {};
  for (const name of readdirSync('data').filter((v) => v.endsWith('.yaml')))
    files[`data/${name}`] = readFileSync(resolve('data', name), 'utf8');
  for (const name of readdirSync('data/days').filter((v) => v.endsWith('.yaml')))
    files[`data/days/${name}`] = readFileSync(resolve('data/days', name), 'utf8');
  return loadContentFiles(files, posts);
}
