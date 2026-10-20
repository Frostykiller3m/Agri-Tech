import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({ isLoading: false, user: { role: 'farmer' } }),
}));

import { RoleRoute } from './ProtectedRoute.jsx';

describe('RoleRoute', () => {
  it('redirects a farmer away from an admin route', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<RoleRoute roles={['admin']}><p>Admin page</p></RoleRoute>} />
          <Route path="/dashboard" element={<p>Farmer dashboard</p>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Farmer dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Admin page')).not.toBeInTheDocument();
  });
});
