import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Container, Form, Pagination, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { fetchOrders } from '../api/orders.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ActionIcon from '../components/ActionIcon.jsx';

const statusVariant = { placed: 'primary', approved: 'info', shipped: 'warning', delivered: 'success', cancelled: 'secondary' };

function OrdersPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchOrders({ page, limit: 20, ...(status ? { status } : {}) });
      setOrders(data.orders);
      setPagination(data.pagination);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { void loadOrders(); }, [loadOrders]);

  return (
    <main id="main-content" tabIndex="-1" className="content-page">
      <Container>
        <PageHeader
          title={t(isAdmin ? 'orderManagementTitle' : 'myOrdersTitle')}
          action={isAdmin && (
            <Form.Group controlId="orders-status-filter">
              <Form.Label>{t('orderStatusLabel')}</Form.Label>
              <Form.Select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
                <option value="">{t('orderAllStatuses')}</option>
                {['placed', 'approved', 'shipped', 'delivered', 'cancelled'].map((value) => <option key={value} value={value}>{t(`orderStatuses.${value}`)}</option>)}
              </Form.Select>
            </Form.Group>
          )}
        />
        {error && <Alert variant="danger" role="alert">{t('ordersLoadError')}</Alert>}
        {loading ? (
          <div className="state-page" role="status"><Spinner animation="border" /><span>{t('loading')}</span></div>
        ) : orders.length === 0 ? (
          <EmptyState icon={<ActionIcon name="orders" />} title={t('ordersEmptyTitle')} description={t('ordersEmpty')} />
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <Card className="order-list-card" key={order._id}>
                <Card.Body>
                  <div className="order-list-heading">
                    <div><h2>{t('orderNumber', { id: order._id.slice(-8).toUpperCase() })}</h2><small>{new Date(order.createdAt).toLocaleString()}</small></div>
                    <Badge bg={statusVariant[order.status]}>{t(`orderStatuses.${order.status}`)}</Badge>
                  </div>
                  {isAdmin && <p className="order-customer">{order.user?.name} · {order.user?.email}</p>}
                  <p>{t('orderItemSummary', { count: order.items.reduce((sum, item) => sum + item.qty, 0) })}</p>
                  <div className="order-list-footer"><strong>{t('orderTotalValue', { amount: order.total.toFixed(2) })}</strong><Button as={Link} to={`/orders/${order._id}`} variant="outline-success">{t('orderViewDetails')}</Button></div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
        {!loading && pagination.totalPages > 1 && (
          <Pagination className="pagination-row">
            <Pagination.Prev disabled={page <= 1} onClick={() => setPage((current) => current - 1)} />
            <Pagination.Item active>{page}</Pagination.Item>
            <Pagination.Next disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)} />
          </Pagination>
        )}
      </Container>
    </main>
  );
}

export default OrdersPage;
