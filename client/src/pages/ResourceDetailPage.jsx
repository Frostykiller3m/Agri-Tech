import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Container, Form, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';

import { fetchResource } from '../api/resources.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

function ResourceDetailPage() {
  const { t } = useTranslation();
  const { resourceId } = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchResource(resourceId)
      .then((value) => { if (active) setResource(value); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [resourceId]);

  return (
    <main id="main-content" tabIndex="-1" className="content-page">
      <Container>
        <Button as={Link} to="/resources" variant="outline-secondary" className="mb-4">{t('resourceBackToCatalog')}</Button>
        {loading ? (
          <div className="state-page" role="status"><Spinner animation="border" /><span>{t('loading')}</span></div>
        ) : error || !resource ? (
          <Alert variant="danger" role="alert">{t('resourceDetailError')}</Alert>
        ) : (
          <Card className="resource-detail-card">
            {resource.imageUrl && <Card.Img variant="top" src={resource.imageUrl} alt={resource.name} />}
            <Card.Body>
              <p className="eyebrow">{t(`resourceCategories.${resource.category}`)}</p>
              <h1>{resource.name}</h1>
              <p className="resource-detail-description">{resource.description}</p>
              <dl className="resource-detail-facts">
                <dt>{t('resourcePrice')}</dt><dd>{t('resourcePriceValue', { price: resource.price, unit: resource.unit })}</dd>
                <dt>{t('resourceStock')}</dt><dd>{resource.stock} {resource.unit}</dd>
              </dl>
              {user?.role === 'farmer' && (
                <div className="resource-purchase-row">
                  <Form.Group controlId="resource-quantity">
                    <Form.Label>{t('cartQuantity')}</Form.Label>
                    <Form.Control type="number" min="1" max={resource.stock} value={quantity} disabled={resource.stock < 1} onChange={(event) => setQuantity(Number(event.target.value))} />
                  </Form.Group>
                  <Button variant="success" disabled={resource.stock < 1 || quantity < 1 || quantity > resource.stock} onClick={() => { addItem(resource, quantity); setAdded(true); }}>
                    {resource.stock < 1 ? t('resourceOutOfStock') : t('cartAddToCart')}
                  </Button>
                </div>
              )}
              {added && <Alert className="mt-3 mb-0" variant="success" role="status">{t('cartAdded')}</Alert>}
              {resource.status !== 'approved' && <Badge bg="warning">{t(`resourceStatuses.${resource.status}`)}</Badge>}
            </Card.Body>
          </Card>
        )}
      </Container>
    </main>
  );
}

export default ResourceDetailPage;
