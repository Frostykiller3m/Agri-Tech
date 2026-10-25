import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { vi } from 'vitest';

import '../i18n.js';
import AppNavbar from './AppNavbar.jsx';

const authActions = vi.hoisted(() => ({
  logout: vi.fn().mockResolvedValue(undefined),
  updateLanguage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../api/alerts.js', () => ({
  fetchNotifications: async () => ({ unreadCount: 0 }),
}));

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: { _id: 'test-farmer', name: 'Test Farmer', email: 'farmer@example.com', role: 'farmer', language: 'en' },
    isAuthenticated: true,
    logout: authActions.logout,
    updateLanguage: authActions.updateLanguage,
  }),
}));

function CurrentPath() {
  const { pathname } = useLocation();
  return <span data-testid="current-path">{pathname}</span>;
}

vi.mock('../context/CartContext.jsx', () => ({
  useCart: () => ({ itemCount: 0 }),
}));

describe('AppNavbar', () => {
  it('opens My Farm from the keyboard and marks Farms as the current page', () => {
    render(
      <MemoryRouter initialEntries={['/farms']}>
        <AppNavbar />
      </MemoryRouter>,
    );

    const myFarmMenu = screen.getByRole('button', { name: 'My Farm' });
    expect(myFarmMenu.closest('.app-nav-dropdown')).toHaveClass('active');

    fireEvent.keyDown(myFarmMenu, { key: 'ArrowDown' });
    expect(myFarmMenu).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(myFarmMenu, { key: 'Escape' });
    expect(myFarmMenu).toHaveAttribute('aria-expanded', 'false');
    fireEvent.keyDown(myFarmMenu, { key: 'ArrowDown' });

    expect(myFarmMenu).toHaveAttribute('aria-expanded', 'true');
    const farmsLink = within(myFarmMenu.closest('.app-nav-dropdown')).getByRole('link', { name: 'Farms' });
    expect(farmsLink).toHaveAttribute('aria-current', 'page');
    expect(farmsLink).toHaveClass('active');
  });

  it('highlights Community on an expert consultation route', () => {
    render(
      <MemoryRouter initialEntries={['/consultations']}>
        <AppNavbar />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Community' }).closest('.app-nav-dropdown'))
      .toHaveClass('active');
  });

  it('keeps the cart badge hidden at zero and persists language changes to the profile', () => {
    render(
      <MemoryRouter initialEntries={['/farms']}>
        <AppNavbar />
      </MemoryRouter>,
    );

    expect(document.querySelector('.utility-badge')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Language' }));
    fireEvent.click(screen.getByRole('button', { name: /Hindi/ }));
    expect(authActions.updateLanguage).toHaveBeenCalledWith('hi');
  });

  it('opens Profile and signs out from the avatar menu', async () => {
    authActions.logout.mockClear();
    render(
      <MemoryRouter initialEntries={['/farms']}>
        <AppNavbar />
        <CurrentPath />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'User menu' }));
    fireEvent.click(screen.getByRole('link', { name: 'Profile' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/profile');

    fireEvent.click(screen.getByRole('button', { name: 'User menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(authActions.logout).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.getByTestId('current-path')).toHaveTextContent('/login'));
  });

  it('shows mobile tabs and exposes secondary destinations in More', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppNavbar />
      </MemoryRouter>,
    );

    const mobileNavigation = screen.getByRole('navigation', { name: 'Mobile navigation' });
    expect(within(mobileNavigation).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/dashboard');
    expect(within(mobileNavigation).getByRole('link', { name: 'Farms' })).toHaveAttribute('href', '/farms');
    expect(within(mobileNavigation).getByRole('link', { name: 'Market' })).toHaveAttribute('href', '/resources');
    expect(within(mobileNavigation).getByRole('link', { name: 'Alerts' })).toHaveAttribute('href', '/alerts');

    await act(async () => {
      fireEvent.click(within(mobileNavigation).getByRole('button', { name: 'More' }));
    });
    expect(within(mobileNavigation).getByRole('link', { name: 'Cart' })).toHaveAttribute('href', '/cart');
    expect(within(mobileNavigation).getByRole('link', { name: 'Orders' })).toHaveAttribute('href', '/orders');
    expect(within(mobileNavigation).getByRole('link', { name: 'Forum' })).toHaveAttribute('href', '/forum');
    expect(within(mobileNavigation).getByRole('link', { name: 'Experts' })).toHaveAttribute('href', '/consultations');
    expect(within(mobileNavigation).getByRole('button', { name: /Hindi/ })).toBeInTheDocument();
    expect(within(mobileNavigation).getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });
});
