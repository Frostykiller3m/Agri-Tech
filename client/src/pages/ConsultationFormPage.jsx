import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { createConsultation } from '../api/consultations.js';
import { fetchCrops } from '../api/crops.js';
import { fetchFarms } from '../api/farms.js';
import { compressImage } from '../utils/compressImage.js';

function ConsultationFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [farmId, setFarmId] = useState('');
  const [cropId, setCropId] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [loadingFarms, setLoadingFarms] = useState(true);
  const [loadingCrops, setLoadingCrops] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchFarms({ page: 1, limit: 100 })
      .then((data) => {
        if (active) setFarms(data.farms);
      })
      .catch(() => {
        if (active) setError(t('consultationFarmsError'));
      })
      .finally(() => {
        if (active) setLoadingFarms(false);
      });
    return () => {
      active = false;
    };
  }, [t]);

  useEffect(() => {
    if (!farmId) {
      setCrops([]);
      setCropId('');
      return undefined;
    }
    let active = true;
    setLoadingCrops(true);
    fetchCrops(farmId)
      .then((data) => {
        if (active) setCrops(data.crops);
      })
      .catch(() => {
        if (active) setError(t('consultationCropsError'));
      })
      .finally(() => {
        if (active) setLoadingCrops(false);
      });
    return () => {
      active = false;
    };
  }, [farmId, t]);

  const handleFiles = async (event) => {
    const selected = [...event.target.files];
    if (selected.length > 3) {
      setError(t('consultationImageCountError'));
      setFiles([]);
    } else if (
      selected.some(
        (file) => !['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type),
      )
    ) {
      setError(t('consultationImageTypeError'));
      setFiles([]);
    } else {
      try {
        const optimized = await Promise.all(selected.map(compressImage));
        if (optimized.some((file) => file.size > 2 * 1024 * 1024)) {
          setError(t('consultationImageSizeError'));
          setFiles([]);
        } else {
          setError('');
          setFiles(optimized);
        }
      } catch {
        setError(t('consultationImageTypeError'));
        setFiles([]);
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    const payload = new FormData();
    payload.append('topic', topic);
    payload.append('description', description);
    if (farmId) payload.append('farmId', farmId);
    if (cropId) payload.append('cropId', cropId);
    files.forEach((file) => payload.append('images', file));
    try {
      const consultation = await createConsultation(payload);
      navigate(`/consultations/${consultation._id}`, { replace: true });
    } catch (requestError) {
      const message = requestError.response?.data?.message;
      setError(
        message?.includes('2 MB')
          ? t('consultationImageSizeError')
          : message?.includes('image')
            ? t('consultationImageTypeError')
            : t('consultationCreateError'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main id="main-content" tabIndex="-1" className="content-page">
      <Container>
        <Button as={Link} to="/consultations" variant="outline-secondary" className="mb-4">
          {t('consultationBack')}
        </Button>
        <Card className="form-card consultation-form-card">
          <Card.Body>
            <p className="eyebrow">{t('consultationEyebrow')}</p>
            <h1>{t('consultationNewTitle')}</h1>
            <p className="page-description">{t('consultationImageLimits')}</p>
            {error && (
              <Alert variant="danger" role="alert">
                {error}
              </Alert>
            )}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="consultation-topic">
                <Form.Label>{t('consultationTopic')}</Form.Label>
                <Form.Control
                  required
                  minLength={3}
                  maxLength={160}
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                />
              </Form.Group>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="consultation-farm">
                    <Form.Label>{t('consultationFarmOptional')}</Form.Label>
                    <Form.Select
                      disabled={loadingFarms}
                      value={farmId}
                      onChange={(event) => {
                        setFarmId(event.target.value);
                        setCropId('');
                      }}
                    >
                      <option value="">{t('consultationNoFarm')}</option>
                      {farms.map((farm) => (
                        <option key={farm._id} value={farm._id}>
                          {farm.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="consultation-crop">
                    <Form.Label>{t('consultationCropOptional')}</Form.Label>
                    <Form.Select
                      disabled={!farmId || loadingCrops}
                      value={cropId}
                      onChange={(event) => setCropId(event.target.value)}
                    >
                      <option value="">{t('consultationNoCrop')}</option>
                      {crops.map((crop) => (
                        <option key={crop._id} value={crop._id}>
                          {crop.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3" controlId="consultation-description">
                <Form.Label>{t('consultationDescription')}</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={6}
                  required
                  minLength={5}
                  maxLength={10000}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-4" controlId="consultation-images">
                <Form.Label>{t('consultationImages')}</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  multiple
                  onChange={handleFiles}
                />
                {files.length > 0 && (
                  <Form.Text>
                    {t('consultationSelectedImages', {
                      count: files.length,
                      names: files.map((file) => file.name).join(', '),
                    })}
                  </Form.Text>
                )}
              </Form.Group>
              <div className="form-actions">
                <Button as={Link} to="/consultations" variant="outline-secondary">
                  {t('cancel')}
                </Button>
                <Button type="submit" variant="success" disabled={submitting}>
                  {submitting ? t('loading') : t('consultationCreate')}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </main>
  );
}

export default ConsultationFormPage;
