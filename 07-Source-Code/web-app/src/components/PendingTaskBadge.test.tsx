import { render, screen } from '@testing-library/react'

import { PendingTaskBadge } from './PendingTaskBadge'

describe('PendingTaskBadge', () => {
  it('shows the exact pending task count with an accessible description', () => {
    render(<PendingTaskBadge count={12} />)

    expect(screen.getByLabelText('มีคำขอรอดำเนินการ 12 รายการ')).toHaveTextContent('12')
  })

  it('stays hidden when there are no pending tasks', () => {
    const { container } = render(<PendingTaskBadge count={0} />)

    expect(container).toBeEmptyDOMElement()
  })
})
