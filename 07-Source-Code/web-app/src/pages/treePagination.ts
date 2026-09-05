export const TREE_LIST_PAGE_SIZE = 50

export function paginateTreePositions<T>(
  positions: readonly T[],
  page: number,
  pageSize = TREE_LIST_PAGE_SIZE,
): readonly T[] {
  const safePage = Math.max(1, Math.floor(page))
  const start = (safePage - 1) * pageSize
  return positions.slice(start, start + pageSize)
}
