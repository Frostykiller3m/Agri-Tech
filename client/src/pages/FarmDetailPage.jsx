import { useEffect, useState } from 'react';
import { Alert, Button, Card, Container } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';

import { fetchCrops } from '../api/crops.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useFarm } from '../hooks/useAgriQueries.js';
import CropTracker from '../components/CropTracker.jsx';
import LoadingPage from '../components/LoadingPage.jsx';
import SoilReports from '../components/SoilReports.jsx';
import WeatherCard from '../components/WeatherCard.jsx';

function FarmDetailPage() {
  const { t } = useTranslation();
  const { farmId } = useParams();
  const { user } = useAuth();
  const farmQuery = useFarm(user, farmId);
  const farm = farmQuery.data;
  const [crops, setCrops] = useState([]);
  const isLoading = farmQuery.isLoading;
  const error = farmQuery.isError;
  const [cropError, setCropError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadCrops() {
      if (!farm) return;
      try {
        const cropData = await fetchCrops(farmId);
        if (active) setCrops(cropData.crops);
      } catch {
        if (active) setCropError(t('cropLoadError'));
      }
    }
    void loadCrops();
    return () => {
      active = false;
    };
  }, [farm, farmId, t]);

  if (isLoading) return <LoadingPage />;

  return (
    <Container as="main" id="main-content" tabIndex="-1" className="content-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{t('farmDetailTitle')}</p>
          <h1>{farm?.name || t('farmDetailTitle')}</h1>
        </div>
        {farm && (
          <Button as={Link} to={`/farms/${farm._id}/edit`} variant="success">
            {t('editFarm')}
          </Button>
        )}
      </div>
      {error && (
        <Alert variant="danger" role="alert">
          {t('farm.loadError')}
        </Alert>
      )}
      {farm && (
        <Card className="detail-card">
          <Card.Body>
            <dl className="farm-details">
              <dt>{t('farm.district')}</dt>
              <dd>{farm.district}</dd>
              <dt>{t('farm.state')}</dt>
              <dd>{farm.state}</dd>
              <dt>{t('farm.area')}</dt>
              <dd>{farm.areaInAcres}</dd>
              <dt>{t('farm.soilType')}</dt>
              <dd>{t(`farm.types.${farm.soilType}`)}</dd>
              <dt>{t('farm.irrigationType')}</dt>
              <dd>{t(`farm.types.${farm.irrigationType}`)}</dd>
              <dt>{t('farm.location')}</dt>
              <dd>{farm.location.coordinates.join(', ')}</dd>
            </dl>
            <p className="page-description">{t('farmDetailDescription')}</p>
            <Button as={Link} to="/farms" variant="outline-secondary">
              {t('backToFarms')}
            </Button>
          </Card.Body>
        </Card>
      )}
      {cropError && (
        <Alert variant="danger" role="alert">
          {cropError}
        </Alert>
      )}
      {farm && !cropError && (
        <CropTracker farmId={farm._id} crops={crops} onCropsChange={setCrops} />
      )}
      {farm && <SoilReports farmId={farm._id} />}
      {farm && <WeatherCard farmId={farm._id} />}
    </Container>
  );
}

export default FarmDetailPage;
