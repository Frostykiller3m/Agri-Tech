import { Card, Container } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

function DashboardPage() {
  const { t } = useTranslation();

  return (
    <Container as="main" id="main-content" tabIndex="-1" className="content-page">
      <p className="eyebrow">{t('navDashboard')}</p>
      <h1>{t('dashboardTitle')}</h1>
      <Card className="empty-card"><Card.Body>{t('dashboardDescription')}</Card.Body></Card>
    </Container>
  );
}

export default DashboardPage;
