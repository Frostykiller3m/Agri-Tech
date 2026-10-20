import { Container, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

function LoadingPage() {
  const { t } = useTranslation();

  return (
    <Container as="main" id="main-content" tabIndex="-1" className="state-page" aria-live="polite">
      <Spinner animation="border" role="status" aria-label={t('loading')} />
      <span className="visually-hidden">{t('loading')}</span>
    </Container>
  );
}

export default LoadingPage;
