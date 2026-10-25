import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { vi } from 'vitest';

import '../i18n.js';
import FarmListPage from './FarmListPage.jsx';

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: { _id: 'farmer-1' } }),
}));

vi.mock('../hooks/useAgriQueries.js', () => ({
  useFarmList: () => ({ data: { farms: [], pagination: { page: 1, totalPages: 1 } }, isLoading: false, isError: false }),
}));

function CurrentPath() {
  const { pathname } = useLocation();
  return <span data-testid="current-path">{pathname}</span>;
}

describe('FarmListPage empty state', () => {
  it('takes the farmer to the existing add-farm route', () => {
    render(
      <MemoryRouter initialEntries={['/farms']}>
        <FarmListPage />
        <CurrentPath />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Set up your first farm' })).toBeInTheDocument();
    const emptyState = screen.getByRole('heading', { name: 'Set up your first farm' }).closest('.empty-state-card');
    fireEvent.click(within(emptyState).getByRole('button', { name: 'Add farm' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/farms/new');
  });
});
