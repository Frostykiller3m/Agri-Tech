import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Pagination,
  Row,
  Spinner,
} from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { createResource, updateResourceStatus } from '../api/resources.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useResourceList } from '../hooks/useAgriQueries.js';
import PageHeader from '../components/PageHeader.jsx';

const emptyForm = {
  name: '',
  category: 'seed',
  description: '',
  price: '',
  stock: '',
  unit: '',
  imageUrl: '',
};

function ResourcesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin';
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');

  const resourceParams = {
    page,
    limit: 12,
    ...(search ? { search } : {}),
    ...(category ? { category } : {}),
    ...(isAdmin && status ? { status } : {}),
  };
  const resourcesQuery = useResourceList(user, resourceParams);
  const resources = resourcesQuery.data?.resources || [];
  const pagination = resourcesQuery.data?.pagination || { page, totalPages: 1 };
  const isLoading = resourcesQuery.isLoading;
  const error = resourcesQuery.isError;

  const applyFilters = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setActionError('');
    setNotice('');
    try {
      await createResource({
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
      });
      setForm(emptyForm);
      setPage(1);
      setStatus('pending');
      await queryClient.invalidateQueries({ queryKey: ['resources', user?._id || user?.id] });
      setNotice(t('resourceCreated'));
    } catch {
      setActionError(t('resourceSaveError'));
    }
  };

  const handleStatus = async (resource, nextStatus) => {
    setActionError('');
    try {
      const updated = await updateResourceStatus(resource._id, nextStatus);
      await queryClient.invalidateQueries({ queryKey: ['resources', user?._id || user?.id] });
      setNotice(t(nextStatus === 'approved' ? 'resourceApproved' : 'resourceRejected'));
    } catch {
      setActionError(t('resourceUpdateError'));
    }
  };

  const categories = ['seed', 'fertilizer', 'pesticide', 'equipment'];

  return (
    <main id="main-content" tabIndex="-1" className="content-page">
      <Container>
        <PageHeader title={t('resourceTitle')} subtitle={t('resourceDescription')} />

        {notice && (
          <Alert variant="success" role="status">
            {notice}
          </Alert>
        )}
        {actionError && (
          <Alert variant="danger" role="alert">
            {actionError}
          </Alert>
        )}

        {isAdmin && (
          <Card className="resource-admin-form">
            <Card.Body>
              <h2>{t('resourceCreateTitle')}</h2>
              <p className="page-description">{t('resourcePendingNotice')}</p>
              <Form onSubmit={handleCreate}>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group controlId="resource-name">
                      <Form.Label>{t('resourceName')}</Form.Label>
                      <Form.Control
                        required
                        minLength={2}
                        maxLength={140}
                        value={form.name}
                        onChange={(event) => setForm({ ...form, name: event.target.value })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="resource-category">
                      <Form.Label>{t('resourceCategory')}</Form.Label>
                      <Form.Select
                        value={form.category}
                        onChange={(event) => setForm({ ...form, category: event.target.value })}
                      >
                        {categories.map((value) => (
                          <option key={value} value={value}>
                            {t(`resourceCategories.${value}`)}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group controlId="resource-description">
                      <Form.Label>{t('resourceDescriptionLabel')}</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        required
                        minLength={5}
                        maxLength={3000}
                        value={form.description}
                        onChange={(event) => setForm({ ...form, description: event.target.value })}
                      />
                    </Form.Group>
                  </Col>
                  <Col sm={4}>
                    <Form.Group controlId="resource-price">
                      <Form.Label>{t('resourcePrice')}</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={form.price}
                        onChange={(event) => setForm({ ...form, price: event.target.value })}
                      />
                    </Form.Group>
                  </Col>
                  <Col sm={4}>
                    <Form.Group controlId="resource-stock">
                      <Form.Label>{t('resourceStock')}</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        step="1"
                        required
                        value={form.stock}
                        onChange={(event) => setForm({ ...form, stock: event.target.value })}
                      />
                    </Form.Group>
                  </Col>
                  <Col sm={4}>
                    <Form.Group controlId="resource-unit">
                      <Form.Label>{t('resourceUnit')}</Form.Label>
                      <Form.Control
                        required
                        maxLength={40}
                        value={form.unit}
                        onChange={(event) => setForm({ ...form, unit: event.target.value })}
                        placeholder={t('resourceUnitPlaceholder')}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={8}>
                    <Form.Group controlId="resource-image">
                      <Form.Label>{t('resourceImageUrl')}</Form.Label>
                      <Form.Control
                        type="url"
                        value={form.imageUrl}
                        onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4} className="d-flex align-items-end">
                    <Button type="submit" variant="success" className="w-100">
                      {t('resourceCreate')}
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        )}

        <Form className="resource-filters" onSubmit={applyFilters}>
          <Form.Group className="resource-search" controlId="resource-search">
            <Form.Label>{t('resourceSearch')}</Form.Label>
            <Form.Control
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t('resourceSearchPlaceholder')}
            />
          </Form.Group>
          <Form.Group controlId="resource-category-filter">
            <Form.Label>{t('resourceCategory')}</Form.Label>
            <Form.Select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
            >
              <option value="">{t('resourceAllCategories')}</option>
              {categories.map((value) => (
                <option key={value} value={value}>
                  {t(`resourceCategories.${value}`)}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          {isAdmin && (
            <Form.Group controlId="resource-status-filter">
              <Form.Label>{t('resourceStatusLabel')}</Form.Label>
              <Form.Select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">{t('resourceAllStatuses')}</option>
                {['pending', 'approved', 'rejected'].map((value) => (
                  <option key={value} value={value}>
                    {t(`resourceStatuses.${value}`)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          )}
          <Button type="submit" variant="outline-success">
            {t('resourceSearchButton')}
          </Button>
        </Form>

        {error && (
          <Alert variant="danger" role="alert">
            {t('resourceLoadError')}
          </Alert>
        )}
        {isLoading ? (
          <div className="state-page" role="status">
            <Spinner animation="border" />
            <span>{t('loading')}</span>
          </div>
        ) : !error && resources.length === 0 ? (
          <Card className="empty-card">
            <Card.Body>{t('resourceEmpty')}</Card.Body>
          </Card>
        ) : (
          <Row xs={1} md={2} xl={3} className="g-4 resource-grid">
            {resources.map((resource) => (
              <Col key={resource._id}>
                <Card className="resource-card h-100">
                  {resource.imageUrl && (
                    <Card.Img variant="top" src={resource.imageUrl} alt={resource.name} />
                  )}
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between gap-2">
                      <Badge bg="success-subtle" text="success">
                        {t(`resourceCategories.${resource.category}`)}
                      </Badge>
                      {isAdmin && (
                        <Badge
                          bg={
                            resource.status === 'approved'
                              ? 'success'
                              : resource.status === 'rejected'
                                ? 'danger'
                                : 'warning'
                          }
                        >
                          {t(`resourceStatuses.${resource.status}`)}
                        </Badge>
                      )}
                    </div>
                    <Card.Title className="mt-3">{resource.name}</Card.Title>
                    <Card.Text className="resource-description">{resource.description}</Card.Text>
                    <strong className="resource-price">
                      {t('resourcePriceValue', { price: resource.price, unit: resource.unit })}
                    </strong>
                    <div className="mt-auto pt-3 d-flex flex-wrap gap-2">
                      <Button as={Link} to={`/resources/${resource._id}`} variant="outline-success">
                        {t('resourceViewDetails')}
                      </Button>
                      {isAdmin && resource.status === 'pending' && (
                        <>
                          <Button
                            variant="success"
                            onClick={() => handleStatus(resource, 'approved')}
                          >
                            {t('resourceApprove')}
                          </Button>
                          <Button
                            variant="outline-danger"
                            onClick={() => handleStatus(resource, 'rejected')}
                          >
                            {t('resourceReject')}
                          </Button>
                        </>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {!isLoading && pagination.totalPages > 1 && (
          <Pagination className="pagination-row">
            <Pagination.Prev
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
            />
            <Pagination.Item active>{pagination.page}</Pagination.Item>
            <Pagination.Next
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((current) => current + 1)}
            />
          </Pagination>
        )}
      </Container>
    </main>
  );
}

export default ResourcesPage;
