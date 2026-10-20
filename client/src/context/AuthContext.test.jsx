import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('../api/client.js', () => ({
  apiClient: {
    post: vi.fn(() => Promise.resolve({
      data: {
        data: {
          user: { email: 'farmer@example.com', role: 'farmer', language: 'en' },
          accessToken: 'access-token',
        },
      },
    })),
    patch: vi.fn(),
  },
  configureAuthClient: vi.fn(),
}));

import '../i18n.js';
import { AuthProvider, useAuth } from './AuthContext.jsx';

function AuthProbe() {
  const { isLoading, user } = useAuth();
  return <span>{isLoading ? 'loading' : user?.email}</span>;
}

describe('AuthProvider', () => {
  it('silently restores a session from the refresh cookie on load', async () => {
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(await screen.findByText('farmer@example.com')).toBeInTheDocument();
  });
});
