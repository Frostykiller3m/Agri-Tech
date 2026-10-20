import { useEffect, useState } from 'react';

import { fetchConsultationImage } from '../api/consultations.js';

function ConsultationImage({ path, alt }) {
  const [source, setSource] = useState('');

  useEffect(() => {
    let active = true;
    let objectUrl = '';
    fetchConsultationImage(path)
      .then((url) => {
        objectUrl = url;
        if (active) setSource(url);
        else URL.revokeObjectURL(url);
      })
      .catch(() => { if (active) setSource(''); });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);

  if (!source) return <div className="consultation-image-placeholder" role="status" aria-label={alt} />;
  return <img className="consultation-image" src={source} alt={alt} />;
}

export default ConsultationImage;
