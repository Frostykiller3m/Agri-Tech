import { useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { createOrder } from '../api/orders.js';
import { useCart } from '../context/CartContext.jsx';

const initialAddress = {
  recipientName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '',
};

function CheckoutPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, estimatedTotal, clearCart } = useCart();
  const [address, setAddress] = useState(initialAddress);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!items.length) return <Navigate to="/cart" replace />;

  const updateAddress = (event) => setAddress((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const order = await createOrder({
        items: items.map((item) => ({ resource: item.resourceId, qty: item.qty })),
        deliveryAddress: address,
      });
      clearCart();
      navigate(`/orders/${order._id}`, { replace: true });
    } catch (requestError) {
      setError(requestError.response?.status === 409 ? t('checkoutStockError') : t('checkoutError'));
    } finally {
      setSubmitting(false);
    }
  };

  const fields = [
    ['recipientName', 'checkoutRecipient', 'text', 2],
    ['phone', 'checkoutPhone', 'tel', 8],
    ['addressLine1', 'checkoutAddress1', 'text', 3],
    ['addressLine2', 'checkoutAddress2', 'text', 0],
    ['city', 'checkoutCity', 'text', 2],
    ['state', 'checkoutState', 'text', 2],
    ['postalCode', 'checkoutPostalCode', 'text', 3],
  ];

  return (
    <main id="main-content" tabIndex="-1" className="content-page">
      <Container>
        <div className="page-heading"><div><p className="eyebrow">{t('cartTitle')}</p><h1>{t('checkoutTitle')}</h1></div></div>
        {error && <Alert variant="danger" role="alert">{error}</Alert>}
        <Row className="g-4">
          <Col lg={7}>
            <Card className="form-card checkout-card">
              <Card.Body>
                <h2>{t('checkoutDeliveryAddress')}</h2>
                <Form onSubmit={handleSubmit}>
                  <Row className="g-3">
                    {fields.map(([name, label, type, minLength]) => (
                      <Col md={name.startsWith('addressLine') ? 12 : 6} key={name}>
                        <Form.Group controlId={`checkout-${name}`}>
                          <Form.Label>{t(label)}</Form.Label>
                          <Form.Control
                            name={name}
                            type={type}
                            required={name !== 'addressLine2'}
                            minLength={minLength || undefined}
                            maxLength={name === 'phone' ? 30 : 200}
                            value={address[name]}
                            onChange={updateAddress}
                          />
                        </Form.Group>
                      </Col>
                    ))}
                  </Row>
                  <div className="payment-method-note"><strong>{t('checkoutPaymentMethod')}</strong><span>{t('checkoutCod')}</span></div>
                  <div className="form-actions mt-4">
                    <Button as={Link} to="/cart" variant="outline-secondary">{t('cancel')}</Button>
                    <Button type="submit" variant="success" disabled={submitting}>
                      {submitting ? <><Spinner size="sm" className="me-2" />{t('checkoutPlacing')}</> : t('checkoutPlaceOrder')}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={5}>
            <Card className="order-summary-card">
              <Card.Body>
                <h2>{t('cartSummary')}</h2>
                {items.map((item) => (
                  <div className="order-summary-line" key={item.resourceId}>
                    <span>{item.name} × {item.qty}</span><strong>{(item.price * item.qty).toFixed(2)}</strong>
                  </div>
                ))}
                <div className="order-summary-line total-line"><span>{t('cartEstimatedTotal')}</span><strong>{estimatedTotal.toFixed(2)}</strong></div>
                <p className="page-description">{t('cartPriceNote')}</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </main>
  );
}

export default CheckoutPage;
