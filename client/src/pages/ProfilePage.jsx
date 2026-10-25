import { Card, Container } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../context/AuthContext.jsx';

function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const languageKey = { en: 'languageEnglish', hi: 'languageHindi', mr: 'languageMarathi' }[user?.language] || 'languageEnglish';

  return (
    <main id="main-content" tabIndex="-1" className="content-page">
      <Container>
        <header className="page-heading">
          <div>
            <h1>{t('navProfile')}</h1>
            <p className="page-description">{t('profileDescription')}</p>
          </div>
        </header>
        <Card className="detail-card profile-card">
          <Card.Body>
            <dl className="profile-details">
              <div><dt>{t('profileName')}</dt><dd>{user?.name || t('profileNotProvided')}</dd></div>
              <div><dt>{t('profileEmail')}</dt><dd>{user?.email || t('profileNotProvided')}</dd></div>
              <div><dt>{t('profilePhone')}</dt><dd>{user?.phone || t('profileNotProvided')}</dd></div>
              <div><dt>{t('profileRole')}</dt><dd>{user?.role ? t(`adminRoles.${user.role}`) : t('profileNotProvided')}</dd></div>
              <div><dt>{t('profileLanguage')}</dt><dd>{t(languageKey)}</dd></div>
            </dl>
          </Card.Body>
        </Card>
      </Container>
    </main>
  );
}

export default ProfilePage;
