import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import { fetchNotifications } from '../api/alerts.js';
import { useCart } from '../context/CartContext.jsx';
import ActionIcon from './ActionIcon.jsx';

const navLinkClassName = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;
const dropdownItemClassName = ({ isActive }) => `dropdown-item${isActive ? ' active' : ''}`;
const languageCodes = { en: 'EN', hi: 'हिं', mr: 'मरा' };

function isPathActive(pathname, route) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function AppNavbar() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout, updateLanguage } = useAuth();
  const { itemCount } = useCart();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    try {
      const data = await fetchNotifications({ page: 1, limit: 1 });
      setUnreadCount(data.unreadCount);
    } catch {
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  useEffect(() => { void loadUnreadCount(); }, [loadUnreadCount]);

  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage || i18n.language;
  }, [i18n.language, i18n.resolvedLanguage]);

  useEffect(() => {
    window.addEventListener('notifications-updated', loadUnreadCount);
    return () => window.removeEventListener('notifications-updated', loadUnreadCount);
  }, [loadUnreadCount]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleLanguageChange = async (language) => {
    try {
      if (isAuthenticated) await updateLanguage(language);
      else await i18n.changeLanguage(language);
    } catch {
      // Keep the current language when the profile update fails.
    }
  };

  const initials = user?.name
    ?.trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => Array.from(part)[0])
    .join('')
    .toLocaleUpperCase() || 'U';
  const languageCode = languageCodes[(i18n.resolvedLanguage || i18n.language).split('-')[0]] || 'EN';

  return (
    <>
    <Navbar className="app-nav" expand="md" collapseOnSelect>
      <Container>
        <Navbar.Brand as={Link} to="/">
          {t('appName')}
        </Navbar.Brand>
        <Navbar.Toggle aria-label={t('toggleNavigation')} aria-controls="app-navigation" />
        <Navbar.Collapse id="app-navigation">
          <Nav className="me-auto">
            {isAuthenticated && <NavLink className={navLinkClassName} to="/dashboard"><ActionIcon name="dashboard" />{t('navDashboard')}</NavLink>}
            {isAuthenticated && (
              <NavDropdown
                id="my-farm-menu"
                className={`app-nav-dropdown${isPathActive(pathname, '/dashboard') || isPathActive(pathname, '/farms') ? ' active' : ''}`}
                title={<><ActionIcon name="farms" />{t('navMyFarm')}</>}
              >
                <NavDropdown.Item as={NavLink} className={dropdownItemClassName} to="/dashboard">
                  <ActionIcon name="dashboard" />{t('navDashboard')}
                </NavDropdown.Item>
                <NavDropdown.Item as={NavLink} className={dropdownItemClassName} to="/farms">
                  <ActionIcon name="farms" />{t('navFarms')}
                </NavDropdown.Item>
              </NavDropdown>
            )}
            {isAuthenticated && (
              <NavDropdown
                id="marketplace-menu"
                className={`app-nav-dropdown${['/resources', '/orders'].some((route) => isPathActive(pathname, route)) ? ' active' : ''}`}
                title={<><ActionIcon name="resources" />{t('navMarketplace')}</>}
              >
                <NavDropdown.Item as={NavLink} className={dropdownItemClassName} to="/resources">
                  <ActionIcon name="resources" />{t('navCatalog')}
                </NavDropdown.Item>
                {['farmer', 'admin'].includes(user?.role) && (
                  <NavDropdown.Item as={NavLink} className={dropdownItemClassName} to="/orders">
                    <ActionIcon name="orders" />{t('navOrders')}
                  </NavDropdown.Item>
                )}
              </NavDropdown>
            )}
            {isAuthenticated && (
              <NavDropdown
                id="community-menu"
                className={`app-nav-dropdown${['/forum', '/consultations'].some((route) => isPathActive(pathname, route)) ? ' active' : ''}`}
                title={<><ActionIcon name="forum" />{t('navCommunity')}</>}
              >
                <NavDropdown.Item as={NavLink} className={dropdownItemClassName} to="/forum">
                  <ActionIcon name="forum" />{t('navForum')}
                </NavDropdown.Item>
                <NavDropdown.Item as={NavLink} className={dropdownItemClassName} to="/consultations">
                  <ActionIcon name="consultations" />{t('navExperts')}
                </NavDropdown.Item>
              </NavDropdown>
            )}
            {user?.role === 'admin' && <NavLink className={navLinkClassName} to="/admin"><ActionIcon name="admin" />{t('navAdmin')}</NavLink>}
          </Nav>
          <Nav className="navbar-utilities align-items-lg-center gap-lg-2 ms-lg-auto">
            {user?.role === 'farmer' && (
              <NavLink
                className={`${navLinkClassName({ isActive: isPathActive(pathname, '/cart') || isPathActive(pathname, '/checkout') })} nav-utility-link`}
                to="/cart"
                aria-label={itemCount > 0 ? t('navCartCount', { count: itemCount }) : t('navCart')}
                title={t('navCart')}
              >
                <ActionIcon name="cart" />
                {itemCount > 0 && <Badge bg="success" pill className="utility-badge" aria-hidden="true">{itemCount > 99 ? '99+' : itemCount}</Badge>}
              </NavLink>
            )}
            {isAuthenticated && (
              <NavLink
                className={`${navLinkClassName({ isActive: isPathActive(pathname, '/alerts') })} nav-utility-link`}
                to="/alerts"
                aria-label={unreadCount > 0 ? t('navAlertsCount', { count: unreadCount }) : t('navAlerts')}
                title={t('navAlerts')}
              >
                <ActionIcon name="alerts" />
                {unreadCount > 0 && <Badge bg="danger" pill className="utility-badge" aria-hidden="true">{unreadCount > 99 ? '99+' : unreadCount}</Badge>}
              </NavLink>
            )}
            <NavDropdown
              id="language-menu"
              className="app-nav-dropdown language-menu"
              title={<><ActionIcon name="globe" /><span aria-label={t('languageLabel')}>{languageCode}</span></>}
            >
              <NavDropdown.Item as="button" active={i18n.language === 'en'} onClick={() => handleLanguageChange('en')}>
                {t('languageEnglish')} <span className="language-code">EN</span>
              </NavDropdown.Item>
              <NavDropdown.Item as="button" active={i18n.language === 'hi'} onClick={() => handleLanguageChange('hi')}>
                {t('languageHindi')} <span className="language-code">हिं</span>
              </NavDropdown.Item>
              <NavDropdown.Item as="button" active={i18n.language === 'mr'} onClick={() => handleLanguageChange('mr')}>
                {t('languageMarathi')} <span className="language-code">मरा</span>
              </NavDropdown.Item>
            </NavDropdown>
            {isAuthenticated ? (
              <NavDropdown
                id="user-menu"
                className="app-nav-dropdown user-menu"
                title={<span className="user-avatar" aria-label={t('navUserMenu')}>{initials}</span>}
              >
                <NavDropdown.Item as={NavLink} className={dropdownItemClassName} to="/profile">
                  <ActionIcon name="user" />{t('navProfile')}
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item as="button" onClick={handleLogout}>
                  <ActionIcon name="logout" />{t('navLogout')}
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <NavLink className={navLinkClassName} to="/login"><ActionIcon name="login" />{t('navLogin')}</NavLink>
                <Button as={Link} to="/register" variant="success"><ActionIcon name="user" />{t('navRegister')}</Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
    {isAuthenticated && (
      <Nav as="nav" className="mobile-tab-bar" aria-label={t('mobileNavigation')}>
        <NavLink className="mobile-tab" to="/dashboard" aria-label={t('navHome')}>
          <ActionIcon name="dashboard" /><span>{t('navHome')}</span>
        </NavLink>
        <NavLink className="mobile-tab" to="/farms" aria-label={t('navFarms')}>
          <ActionIcon name="farms" /><span>{t('navFarms')}</span>
        </NavLink>
        <NavLink className="mobile-tab" to="/resources" aria-label={t('navMarket')}>
          <ActionIcon name="resources" /><span>{t('navMarket')}</span>
        </NavLink>
        <NavLink className={navLinkClassName} to="/alerts" aria-label={t('navAlerts')}>
          <ActionIcon name="alerts" />
          {unreadCount > 0 && <Badge bg="danger" pill className="mobile-tab-badge" aria-hidden="true">{unreadCount > 99 ? '99+' : unreadCount}</Badge>}
          <span>{t('navAlerts')}</span>
        </NavLink>
        <NavDropdown drop="up" id="mobile-more-menu" className="mobile-more-menu" title={<><ActionIcon name="dashboard" /><span>{t('navMore')}</span></>}>
          {user?.role === 'farmer' && <NavDropdown.Item as={NavLink} className={dropdownItemClassName} to="/cart"><ActionIcon name="cart" />{t('navCart')}</NavDropdown.Item>}
          {['farmer', 'admin'].includes(user?.role) && <NavDropdown.Item as={NavLink} className={dropdownItemClassName} to="/orders"><ActionIcon name="orders" />{t('navOrders')}</NavDropdown.Item>}
          <NavDropdown.Item as={NavLink} className={dropdownItemClassName} to="/forum"><ActionIcon name="forum" />{t('navForum')}</NavDropdown.Item>
          <NavDropdown.Item as={NavLink} className={dropdownItemClassName} to="/consultations"><ActionIcon name="consultations" />{t('navExperts')}</NavDropdown.Item>
          {user?.role === 'admin' && <NavDropdown.Item as={NavLink} className={dropdownItemClassName} to="/admin"><ActionIcon name="admin" />{t('navAdmin')}</NavDropdown.Item>}
          <NavDropdown.Item as={NavLink} className={dropdownItemClassName} to="/profile"><ActionIcon name="user" />{t('navProfile')}</NavDropdown.Item>
          <NavDropdown.Divider />
          <NavDropdown.Item as="button" onClick={() => handleLanguageChange('en')}>{t('languageEnglish')} <span className="language-code">EN</span></NavDropdown.Item>
          <NavDropdown.Item as="button" onClick={() => handleLanguageChange('hi')}>{t('languageHindi')} <span className="language-code">हिं</span></NavDropdown.Item>
          <NavDropdown.Item as="button" onClick={() => handleLanguageChange('mr')}>{t('languageMarathi')} <span className="language-code">मरा</span></NavDropdown.Item>
          <NavDropdown.Divider />
          <NavDropdown.Item as="button" onClick={handleLogout}><ActionIcon name="logout" />{t('navLogout')}</NavDropdown.Item>
        </NavDropdown>
      </Nav>
    )}
    </>
  );
}

export default AppNavbar;
