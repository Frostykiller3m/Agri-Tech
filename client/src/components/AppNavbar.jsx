import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Container, Form, Nav, Navbar } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import { fetchNotifications } from '../api/alerts.js';
import { useCart } from '../context/CartContext.jsx';
import ActionIcon from './ActionIcon.jsx';

function AppNavbar() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout, updateLanguage } = useAuth();
  const { itemCount } = useCart();
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

  const handleLanguageChange = async (event) => {
    try {
      if (isAuthenticated) await updateLanguage(event.target.value);
      else await i18n.changeLanguage(event.target.value);
    } catch {
      // Keep the current language when the profile update fails.
    }
  };

  return (
    <Navbar className="app-nav" expand="lg" collapseOnSelect>
      <Container>
        <Navbar.Brand as={Link} to="/">
          {t('appName')}
        </Navbar.Brand>
        <Navbar.Toggle aria-label={t('toggleNavigation')} aria-controls="app-navigation" />
        <Navbar.Collapse id="app-navigation">
          <Nav className="me-auto">
            {isAuthenticated && <Nav.Link as={Link} to="/dashboard"><ActionIcon name="dashboard" />{t('navDashboard')}</Nav.Link>}
            {isAuthenticated && <Nav.Link as={Link} to="/farms"><ActionIcon name="farms" />{t('farmsTitle')}</Nav.Link>}
            {isAuthenticated && <Nav.Link as={Link} to="/resources"><ActionIcon name="resources" />{t('resourceTitle')}</Nav.Link>}
            {user?.role === 'farmer' && <Nav.Link as={Link} to="/cart"><ActionIcon name="cart" />{t('cartTitle')} {itemCount > 0 && <Badge bg="success" pill>{itemCount > 99 ? '99+' : itemCount}</Badge>}</Nav.Link>}
            {['farmer', 'admin'].includes(user?.role) && <Nav.Link as={Link} to="/orders"><ActionIcon name="orders" />{t(user.role === 'admin' ? 'orderManagementTitle' : 'myOrdersTitle')}</Nav.Link>}
            {isAuthenticated && <Nav.Link as={Link} to="/forum"><ActionIcon name="forum" />{t('forumTitle')}</Nav.Link>}
            {isAuthenticated && <Nav.Link as={Link} to="/consultations"><ActionIcon name="consultations" />{t('consultationTitle')}</Nav.Link>}
            {isAuthenticated && (
              <Nav.Link as={Link} to="/alerts">
                <ActionIcon name="alerts" />
                {t('alertsTitle')}{' '}
                {unreadCount > 0 && <Badge bg="danger" pill>{unreadCount > 99 ? '99+' : unreadCount}</Badge>}
              </Nav.Link>
            )}
            {user?.role === 'admin' && <Nav.Link as={Link} to="/admin"><ActionIcon name="admin" />{t('navAdmin')}</Nav.Link>}
          </Nav>
          <Nav className="align-items-lg-center gap-lg-2">
            <Form.Select
              aria-label={t('languageLabel')}
              className="language-select"
              value={i18n.language}
              onChange={handleLanguageChange}
            >
              <option value="en">{t('languageEnglish')}</option>
              <option value="hi">{t('languageHindi')}</option>
              <option value="mr">{t('languageMarathi')}</option>
            </Form.Select>
            {isAuthenticated ? (
              <Button variant="outline-success" onClick={handleLogout}><ActionIcon name="logout" />{t('navLogout')}</Button>
            ) : (
              <>
                <Nav.Link as={Link} to="/login"><ActionIcon name="login" />{t('navLogin')}</Nav.Link>
                <Button as={Link} to="/register" variant="success"><ActionIcon name="user" />{t('navRegister')}</Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AppNavbar;
