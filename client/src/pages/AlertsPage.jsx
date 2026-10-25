import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Container, Pagination, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

import { fetchNotifications, markNotificationRead } from '../api/alerts.js';
import ExpertAlertForm from '../components/ExpertAlertForm.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ActionIcon from '../components/ActionIcon.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const severityVariant = { low: 'success', medium: 'info', high: 'warning', critical: 'danger' };

function AlertsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchNotifications({ page, limit: 20 });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setTotalPages(data.pagination.totalPages);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { void loadNotifications(); }, [loadNotifications]);

  const handleRead = async (notification) => {
    try {
      await markNotificationRead(notification._id);
      setNotifications((current) => current.map((item) => (
        item._id === notification._id ? { ...item, readAt: new Date().toISOString() } : item
      )));
      setUnreadCount((count) => Math.max(0, count - 1));
      window.dispatchEvent(new Event('notifications-updated'));
    } catch {
      setError(true);
    }
  };

  return (
    <main id="main-content" tabIndex="-1" className="content-page">
      <Container>
        <div className="page-heading">
          <div>
            <p className="eyebrow">{t('alertsEyebrow')}</p>
            <h1>{t('alertsTitle')}</h1>
            <p className="page-description">{t('alertsDescription')}</p>
          </div>
          <Badge bg="success" pill>{t('unreadCount', { count: unreadCount })}</Badge>
        </div>

        {user?.role === 'expert' && <ExpertAlertForm />}

        {error && <Alert variant="danger" role="alert">{t('alertsLoadError')}</Alert>}
        {loading ? (
          <div className="state-page" role="status"><Spinner animation="border" /><span>{t('loading')}</span></div>
        ) : notifications.length === 0 ? (
          <EmptyState icon={<ActionIcon name="alerts" />} title={t('alertsEmptyTitle')} description={t('alertsEmpty')} />
        ) : (
          <>
            <div className="alerts-list">
              {notifications.map(({ _id, alert, readAt, createdAt }) => alert && (
                <Card className={`alert-card ${readAt ? 'alert-read' : ''}`} key={_id}>
                  <Card.Body>
                    <div className="alert-card-heading">
                      <div>
                        <Badge bg={severityVariant[alert.severity] || 'secondary'}>{t(`severity.${alert.severity}`, { defaultValue: alert.severity })}</Badge>
                        <span className="alert-type">{t(`alertTypes.${alert.type}`, { defaultValue: alert.type })}</span>
                      </div>
                      <time dateTime={createdAt}>{new Date(createdAt).toLocaleString()}</time>
                    </div>
                    <h2>{alert.title}</h2>
                    <p>{alert.message}</p>
                    {alert.region?.state && <small>{[alert.region.district, alert.region.state].filter(Boolean).join(', ')}</small>}
                    {!readAt && <Button className="mark-read-button" variant="outline-success" size="sm" onClick={() => handleRead({ _id })}>{t('markAsRead')}</Button>}
                  </Card.Body>
                </Card>
              ))}
            </div>
            {totalPages > 1 && (
              <Pagination className="pagination-row">
                <Pagination.Prev disabled={page <= 1} onClick={() => setPage((current) => current - 1)} />
                <Pagination.Item active>{page}</Pagination.Item>
                <Pagination.Next disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} />
              </Pagination>
            )}
          </>
        )}
      </Container>
    </main>
  );
}

export default AlertsPage;
