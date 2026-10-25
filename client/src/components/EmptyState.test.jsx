import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import EmptyState from './EmptyState.jsx';

describe('EmptyState', () => {
  it('shows its message, steps, and invokes the primary action', () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        icon={<span>field icon</span>}
        title="Set up your first farm"
        description="Add a farm to get started."
        actionLabel="Add farm"
        onAction={onAction}
        steps={['Add a farm', 'Add a crop', 'Add a soil report']}
      />,
    );

    expect(screen.getByText('field icon')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Set up your first farm' })).toBeInTheDocument();
    expect(screen.getByRole('list').children).toHaveLength(3);
    fireEvent.click(screen.getByRole('button', { name: 'Add farm' }));
    expect(onAction).toHaveBeenCalledOnce();
  });
});
