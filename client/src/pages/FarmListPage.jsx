import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Card, Col, Container, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { deleteFarm } from '../api/farms.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useFarmList } from '../hooks/useAgriQueries.js';
import LoadingPage from '../components/LoadingPage.jsx';
import ActionIcon from '../components/ActionIcon.jsx';
import PageHeader from '../components/PageHeader.jsx';
import EmptyState from '../components/EmptyState.jsx';

function FarmListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [deleteError, setDeleteError] = useState('');
  const farmsQuery = useFarmList(user, page, 20);
  const farms = farmsQuery.data?.farms || [];
  const pagination = farmsQuery.data?.pagination || { page, totalPages: 1 };
  const isLoading = farmsQuery.isLoading;
  const error = farmsQuery.isError;

  const handleDelete = async (farm) => {
    if (!window.confirm(t('deleteConfirm', { name: farm.name }))) return;
    setDeleteError('');
    try {
      await deleteFarm(farm._id);
      await queryClient.invalidateQueries({ queryKey: ['farms', user?._id || user?.id] });
    } catch {
      setDeleteError(t('deleteError'));
    }
  };

  if (isLoading) return <LoadingPage />;

  return (
    <Container as="main" id="main-content" tabIndex="-1" className="content-page">
      <PageHeader
        title={t('farmsTitle')}
        subtitle={t('farmsDescription')}
        action={<Button as={Link} to="/farms/new" variant="success"><ActionIcon name="plus" />{t('addFarm')}</Button>}
      />
      {error && (
        <Alert variant="danger" role="alert">
          {t('farmsLoadError')}
        </Alert>
      )}
      {deleteError && (
        <Alert variant="danger" role="alert">
          {deleteError}
        </Alert>
      )}
      {!error && farms.length === 0 && (
        <EmptyState
          icon={<ActionIcon name="farms" />}
          title={t('farmsEmptyTitle')}
          description={t('farmsEmptyDescription')}
          actionLabel={t('addFarm')}
          onAction={() => navigate('/farms/new')}
          steps={[t('farmsStepFarm'), t('farmsStepCrop'), t('farmsStepSoil')]}
        />
      )}
      <Row xs={1} md={2} xl={3} className="g-4">
        {farms.map((farm) => (
          <Col key={farm._id}>
            <Card className="farm-card h-100">
              <Card.Body>
                <Card.Title>{farm.name}</Card.Title>
                <Card.Text>
                  {farm.district}, {farm.state}
                </Card.Text>
                <Card.Text>
                  {farm.areaInAcres} {t('farm.area').toLowerCase()}
                </Card.Text>
                <div className="d-flex flex-wrap gap-2">
                  <Button as={Link} to={`/farms/${farm._id}`} variant="outline-success">
                    {t('viewFarm')}
                  </Button>
                  <Button as={Link} to={`/farms/${farm._id}/edit`} variant="outline-secondary">
                    {t('editFarm')}
                  </Button>
                  <Button variant="outline-danger" onClick={() => handleDelete(farm)}>
                    {t('deleteFarm')}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      {pagination.totalPages > 1 && (
        <div className="pagination-row">
          <Button
            variant="outline-secondary"
            disabled={pagination.page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            ‹
          </Button>
          <span>
            {pagination.page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline-secondary"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            ›
          </Button>
        </div>
      )}
    </Container>
  );
}

export default FarmListPage;
