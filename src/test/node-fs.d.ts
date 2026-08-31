/**
 * Only what the tests reach for. `@types/node` is transitive, and adding
 * "node" to tsconfig `types` would leak Node globals into app code.
 */
declare module 'node:fs' {
  export function existsSync(path: string): boolean;
}
