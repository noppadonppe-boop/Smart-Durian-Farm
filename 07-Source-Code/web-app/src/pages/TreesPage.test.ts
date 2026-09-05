import { paginateTreePositions, TREE_LIST_PAGE_SIZE } from './treePagination'

describe('Tree Register pagination', () => {
  const positions = Array.from({ length: 121 }, (_, index) => `position-${index + 1}`)

  it('shows no more than 50 positions per page', () => {
    expect(TREE_LIST_PAGE_SIZE).toBe(50)
    expect(paginateTreePositions(positions, 1)).toEqual(positions.slice(0, 50))
    expect(paginateTreePositions(positions, 2)).toEqual(positions.slice(50, 100))
    expect(paginateTreePositions(positions, 3)).toEqual(positions.slice(100, 121))
  })

  it('normalizes an invalid page to the first page', () => {
    expect(paginateTreePositions(positions, 0)).toEqual(positions.slice(0, 50))
  })
})
