import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

vi.mock('../api/farms.js', () => ({
  fetchFarms: vi.fn(() => Promise.resolve({ farms: [], pagination: { page: 1, totalPages: 1 } })),
  deleteFarm: vi.fn(),
}));
vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: { _id: 'test-farmer' } }),
}));

import '../i18n.js';
import FarmListPage from './FarmListPage.jsx';

describe('FarmListPage', () => {
  it('renders an empty state when the farmer has no farms', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <FarmListPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(
      await screen.findByText('No farms yet. Add your first farm to get started.'),
    ).toBeInTheDocument();
  });
});
