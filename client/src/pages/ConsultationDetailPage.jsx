import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Container, Form, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';

import { addConsultationResponse, closeConsultation, fetchConsultation } from '../api/consultations.js';
import ConsultationImage from '../components/ConsultationImage.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function ConsultationDetailPage() {
  const { t } = useTranslation();
  const { consultationId } = useParams();
  const { user } = useAuth();
  const [consultation, setConsultation] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try { setConsultation(await fetchConsultation(consultationId)); }
    catch { setError(true); }
    finally { setLoading(false); }
  }, [consultationId]);

  useEffect(() => { void load(); }, [load]);

  const handleResponse = async (event) => {
    event.preventDefault();
    setSaving(true);
    setActionError(false);
    try {
      setConsultation(await addConsultationResponse(consultationId, message));
      setMessage('');
    } catch { setActionError(true); }
    finally { setSaving(false); }
  };

  const handleClose = async () => {
    setSaving(true);
    setActionError(false);
    try { setConsultation(await closeConsultation(consultationId)); }
    catch { setActionError(true); }
    finally { setSaving(false); }
  };

  if (loading) return <main id="main-content" tabIndex="-1" className="content-page"><Container><div className="state-page" role="status"><Spinner animation="border" /><span>{t('loading')}</span></div></Container></main>;
  if (error || !consultation) return <main id="main-content" tabIndex="-1" className="content-page"><Container><Button as={Link} to="/consultations" variant="outline-secondary" className="mb-4">{t('consultationBack')}</Button><Alert variant="danger" role="alert">{t('consultationNotFound')}</Alert></Container></main>;

  const isOwner = consultation.farmer?._id === user?._id;
  const canRespond = user?.role === 'admin'
    ? consultation.status !== 'closed'
    : user?.role === 'expert' && consultation.status === 'open';

  return (
    <main id="main-content" tabIndex="-1" className="content-page">
      <Container>
        <Button as={Link} to="/consultations" variant="outline-secondary" className="mb-4">{t('consultationBack')}</Button>
        {actionError && <Alert variant="danger" role="alert">{t('consultationActionError')}</Alert>}
        <Card className="consultation-detail-card"><Card.Body>
          <div className="consultation-card-heading"><Badge bg={consultation.status === 'closed' ? 'secondary' : consultation.status === 'answered' ? 'success' : 'warning'}>{t(`consultationStatuses.${consultation.status}`)}</Badge><span>{t('consultationFarmer', { name: consultation.farmer?.name || '' })} · {new Date(consultation.createdAt).toLocaleString()}</span></div>
          <h1 className="consultation-detail-title">{consultation.topic}</h1>
          {(consultation.farm || consultation.crop) && <p className="consultation-association">{consultation.farm?.name}{consultation.crop ? ` · ${consultation.crop.name}` : ''}</p>}
          <p className="consultation-detail-description">{consultation.description}</p>
          {consultation.imageUrls.length > 0 && <div className="consultation-images">{consultation.imageUrls.map((path) => <ConsultationImage key={path} path={path} alt={t('consultationAttachedImage')} />)}</div>}
          {isOwner && consultation.status !== 'closed' && <Button className="mt-3" variant="outline-danger" disabled={saving} onClick={handleClose}>{t('consultationClose')}</Button>}
        </Card.Body></Card>

        <section className="consultation-thread" aria-labelledby="consultation-responses-title">
          <div className="section-heading"><h2 id="consultation-responses-title">{t('consultationResponses')}</h2></div>
          {consultation.responses.length === 0 ? <Card className="empty-card"><Card.Body>{t('consultationNoResponses')}</Card.Body></Card> : consultation.responses.map((response) => (
            <Card className="consultation-response-card" key={response._id || `${response.responder?._id}-${response.at}`}><Card.Body>
              <div className="consultation-card-heading"><strong>{response.responder?.name || t('consultationExpert')}</strong><small>{new Date(response.at).toLocaleString()}</small></div>
              <p className="consultation-response-body">{response.message}</p>
            </Card.Body></Card>
          ))}
          {canRespond && <Card className="consultation-compose-card"><Card.Body>
            <h2>{t('consultationWriteResponse')}</h2>
            <Form onSubmit={handleResponse}><Form.Group className="mb-3" controlId="consultation-response"><Form.Label>{t('consultationResponseLabel')}</Form.Label><Form.Control as="textarea" rows={4} required minLength={1} maxLength={5000} value={message} onChange={(event) => setMessage(event.target.value)} /></Form.Group><Button type="submit" variant="success" disabled={saving}>{saving ? t('loading') : t('consultationSendResponse')}</Button></Form>
          </Card.Body></Card>}
        </section>
      </Container>
    </main>
  );
}

export default ConsultationDetailPage;
