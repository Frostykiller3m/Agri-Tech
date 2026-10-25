import { Badge } from 'react-bootstrap';

function PageHeader({ title, subtitle, action, count, as: Heading = 'h1', titleId = 'page-header-title' }) {
  return (
    <header className="page-header">
      <div className="page-header-copy">
        <div className="page-header-title-row">
          <Heading className="page-header-title" id={titleId}>{title}</Heading>
          {count !== undefined && <Badge bg="success" pill>{count}</Badge>}
        </div>
        {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </header>
  );
}

export default PageHeader;
