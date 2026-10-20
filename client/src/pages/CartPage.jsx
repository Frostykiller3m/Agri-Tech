import { Alert, Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import ActionIcon from '../components/ActionIcon.jsx';

function CartPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { items, estimatedTotal, setQuantity, removeItem } = useCart();
  const canCheckout = user?.role === 'farmer' && items.length > 0
    && items.every((item) => item.stock > 0 && item.qty <= item.stock);

  return (
    <main id="main-content" tabIndex="-1" className="content-page">
      <Container>
        <div className="page-heading">
          <div><p className="eyebrow">{t('resourceTitle')}</p><h1>{t('cartTitle')}</h1></div>
          <Button as={Link} to="/resources" variant="outline-success">{t('resourceBackToCatalog')}</Button>
        </div>
        {items.length === 0 ? (
          <Card className="empty-card"><Card.Body>{t('cartEmpty')}</Card.Body></Card>
        ) : (
          <Row className="g-4">
            <Col lg={8}>
              <div className="cart-items">
                {items.map((item) => (
                  <Card className="cart-item-card" key={item.resourceId}>
                    <Card.Body>
                      {item.imageUrl && <img className="cart-item-image" src={item.imageUrl} alt={item.name} />}
                      <div className="cart-item-info">
                        <h2>{item.name}</h2>
                        <p>{t('resourcePriceValue', { price: item.price, unit: item.unit })}</p>
                        <small>{t('cartStockAvailable', { count: item.stock, unit: item.unit })}</small>
                      </div>
                      <Form.Group className="cart-quantity" controlId={`cart-quantity-${item.resourceId}`}>
                        <Form.Label>{t('cartQuantity')}</Form.Label>
                        <Form.Control type="number" min="1" max={Math.max(1, item.stock)} step="1" value={item.qty} onChange={(event) => setQuantity(item.resourceId, Number(event.target.value))} />
                      </Form.Group>
                      <Button variant="outline-danger" onClick={() => removeItem(item.resourceId)}>{t('cartRemove')}</Button>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            </Col>
            <Col lg={4}>
              <Card className="order-summary-card">
                <Card.Body>
                  <h2>{t('cartSummary')}</h2>
                  <div className="order-summary-line"><span>{t('cartItems')}</span><strong>{items.reduce((count, item) => count + item.qty, 0)}</strong></div>
                  <div className="order-summary-line"><span>{t('cartEstimatedTotal')}</span><strong>{estimatedTotal.toFixed(2)}</strong></div>
                  <p className="page-description">{t('cartPriceNote')}</p>
                  {user?.role !== 'farmer' && <Alert variant="info">{t('cartFarmerOnly')}</Alert>}
                  {user?.role === 'farmer' && items.some((item) => item.qty > item.stock || item.stock < 1) && (
                    <Alert variant="warning">{t('cartStockWarning')}</Alert>
                  )}
                  <Button as={Link} to="/checkout" variant="success" className="w-100" disabled={!canCheckout}><ActionIcon name="arrow" />{t('cartCheckout')}</Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    </main>
  );
}

export default CartPage;
