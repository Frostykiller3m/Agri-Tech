import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Container, Form, Pagination, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { fetchConsultations } from '../api/consultations.js';
import { useAuth } from '../context/AuthContext.jsx';
import ActionIcon from '../components/ActionIcon.jsx';
import PageHeader from '../components/PageHeader.jsx';

function ConsultationsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [consultations, setConsultations] = useState([]);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchConsultations({ page, limit: 20, ...(status ? { status } : {}) });
      setConsultations(data.consultations);
      setPagination(data.pagination);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { void load(); }, [load]);

  return (
    <main id="main-content" tabIndex="-1" className="content-page">
      <Container>
        <PageHeader
          title={t('consultationTitle')}
          subtitle={t('consultationDescriptionIntro')}
          action={user?.role === 'farmer' && <Button as={Link} to="/consultations/new" variant="success"><ActionIcon name="plus" />{t('consultationNew')}</Button>}
        />
        {user?.role !== 'expert' && <div className="consultation-filters">
          <Form.Group controlId="consultation-status-filter">
            <Form.Label>{t('consultationStatusLabel')}</Form.Label>
            <Form.Select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
              <option value="">{t('consultationAllStatuses')}</option>
              {['open', 'answered', 'closed'].map((value) => <option key={value} value={value}>{t(`consultationStatuses.${value}`)}</option>)}
            </Form.Select>
          </Form.Group>
        </div>}
        {loading ? <div className="state-page" role="status"><Spinner animation="border" /><span>{t('loading')}</span></div>
          : error ? <Alert variant="danger" role="alert">{t('consultationLoadError')}</Alert>
            : consultations.length === 0 ? <Card className="empty-card"><Card.Body>{t('consultationEmpty')}</Card.Body></Card>
              : <div className="consultation-list">{consultations.map((consultation) => (
                <Card className="consultation-card" key={consultation._id}><Card.Body>
                  <div className="consultation-card-heading"><Badge bg={consultation.status === 'closed' ? 'secondary' : consultation.status === 'answered' ? 'success' : 'warning'}>{t(`consultationStatuses.${consultation.status}`)}</Badge><small>{new Date(consultation.updatedAt || consultation.createdAt).toLocaleString()}</small></div>
                  <h2><Link to={`/consultations/${consultation._id}`}>{consultation.topic}</Link></h2>
                  <p className="consultation-preview">{consultation.description}</p>
                  <div className="consultation-card-meta">
                    <span>{t('consultationFarmer', { name: consultation.farmer?.name || '' })}</span>
                    {consultation.farm && <span>{t('consultationFarmValue', { name: consultation.farm.name })}</span>}
                    <span>{t('consultationResponseCount', { count: consultation.responses.length })}</span>
                  </div>
                  <Button as={Link} to={`/consultations/${consultation._id}`} variant="outline-success" size="sm">{t('consultationOpen')}</Button>
                </Card.Body></Card>
              ))}</div>}
        {!loading && !error && pagination.totalPages > 1 && <Pagination className="pagination-row"><Pagination.Prev disabled={page <= 1} onClick={() => setPage((value) => value - 1)} /><Pagination.Item active>{pagination.page}</Pagination.Item><Pagination.Next disabled={page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)} /></Pagination>}
      </Container>
    </main>
  );
}

export default ConsultationsPage;
