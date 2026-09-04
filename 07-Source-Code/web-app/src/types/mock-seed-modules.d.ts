declare module '*mock-seed/modules.mjs' {
  export const seeders: Record<
    string,
    (context: Record<string, unknown>) => Promise<unknown>
  >
}
