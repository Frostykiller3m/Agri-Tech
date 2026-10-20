import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('./api/client.js', () => ({
  apiClient: {
    post: vi.fn(() => Promise.reject({ response: { status: 401 } })),
    patch: vi.fn(),
  },
  configureAuthClient: vi.fn(),
}));

import './i18n.js';
import App from './App.jsx';

describe('App', () => {
  it('redirects unauthenticated users to sign in', async () => {
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
  });
});
