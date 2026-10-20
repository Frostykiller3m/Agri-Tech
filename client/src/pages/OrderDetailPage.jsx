import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Container, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';

import { cancelOrder, fetchOrder, updateOrderStatus } from '../api/orders.js';
import { useAuth } from '../context/AuthContext.jsx';

const statusVariant = { placed: 'primary', approved: 'info', shipped: 'warning', delivered: 'success', cancelled: 'secondary' };
const nextStatuses = { placed: ['approved', 'cancelled'], approved: ['shipped', 'cancelled'], shipped: ['delivered'], delivered: [], cancelled: [] };

function OrderDetailPage() {
  const { t } = useTranslation();
  const { orderId } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState(false);
  const [updating, setUpdating] = useState(false);

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setOrder(await fetchOrder(orderId));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { void loadOrder(); }, [loadOrder]);

  const changeStatus = async (status) => {
    setUpdating(true);
    setActionError(false);
    try {
      setOrder(isAdmin ? await updateOrderStatus(order._id, status) : await cancelOrder(order._id));
    } catch {
      setActionError(true);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <main id="main-content" tabIndex="-1" className="content-page">
      <Container>
        <div className="page-heading">
          <div><p className="eyebrow">{t('orderEyebrow')}</p><h1>{t('orderDetailTitle')}</h1></div>
          <Button as={Link} to="/orders" variant="outline-secondary">{t('backToOrders')}</Button>
        </div>
        {loading ? (
          <div className="state-page" role="status"><Spinner animation="border" /><span>{t('loading')}</span></div>
        ) : error || !order ? (
          <Alert variant="danger" role="alert">{t('orderDetailError')}</Alert>
        ) : (
          <>
            {actionError && <Alert variant="danger" role="alert">{t('orderUpdateError')}</Alert>}
            <Card className="order-detail-card">
              <Card.Body>
                <div className="order-list-heading">
                  <div><h2>{t('orderNumber', { id: order._id.slice(-8).toUpperCase() })}</h2><small>{new Date(order.createdAt).toLocaleString()}</small></div>
                  <Badge bg={statusVariant[order.status]}>{t(`orderStatuses.${order.status}`)}</Badge>
                </div>
                {isAdmin && <p>{t('orderCustomer', { name: order.user?.name || '', email: order.user?.email || '' })}</p>}
                <h3>{t('orderItems')}</h3>
                <div className="order-lines">
                  {order.items.map((item) => (
                    <div className="order-line" key={item.resource}>
                      <span>{item.name} × {item.qty} {item.unit ? `(${item.unit})` : ''}</span>
                      <strong>{t('orderTotalValue', { amount: (item.price * item.qty).toFixed(2) })}</strong>
                    </div>
                  ))}
                  <div className="order-line total-line"><span>{t('cartEstimatedTotal')}</span><strong>{t('orderTotalValue', { amount: order.total.toFixed(2) })}</strong></div>
                </div>
                <h3>{t('checkoutDeliveryAddress')}</h3>
                <address className="order-address">
                  {order.deliveryAddress.recipientName}<br />
                  {order.deliveryAddress.phone}<br />
                  {order.deliveryAddress.addressLine1}<br />
                  {order.deliveryAddress.addressLine2 && <>{order.deliveryAddress.addressLine2}<br /></>}
                  {[order.deliveryAddress.city, order.deliveryAddress.state, order.deliveryAddress.postalCode].join(', ')}
                </address>
                <p><strong>{t('checkoutPaymentMethod')}:</strong> {t('checkoutCod')}</p>

                <h3>{t('orderTrackingTitle')}</h3>
                <ol className="order-timeline">
                  {order.statusHistory.map((entry, index) => (
                    <li key={`${entry.status}-${entry.at}-${index}`}>
                      <Badge bg={statusVariant[entry.status]}>{t(`orderStatuses.${entry.status}`)}</Badge>
                      <span>{new Date(entry.at).toLocaleString()}</span>
                      {entry.by?.name && <small>{entry.by.name}</small>}
                    </li>
                  ))}
                </ol>

                {isAdmin && nextStatuses[order.status]?.length > 0 && (
                  <div className="order-actions">
                    {nextStatuses[order.status].map((status) => (
                      <Button key={status} disabled={updating} variant={status === 'cancelled' ? 'outline-danger' : 'success'} onClick={() => changeStatus(status)}>
                        {t(`orderActions.${status}`)}
                      </Button>
                    ))}
                  </div>
                )}
                {!isAdmin && order.status === 'placed' && (
                  <Button disabled={updating} variant="outline-danger" onClick={() => changeStatus('cancelled')}>{t('orderCancel')}</Button>
                )}
              </Card.Body>
            </Card>
          </>
        )}
      </Container>
    </main>
  );
}

export default OrderDetailPage;
