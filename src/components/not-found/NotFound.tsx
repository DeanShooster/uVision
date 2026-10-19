import { useEffect } from 'react';
import { Link } from 'react-router';
import { useDictionary } from '../../dictionary/dictionary';

export default function NotFound() {
  const dictionary = useDictionary();

  useEffect(() => {
    document.title = dictionary.brand.titled(dictionary.notFound.documentTitle);
  }, [dictionary]);

  return (
    <div className="page narrow">
      <p className="eyebrow">{dictionary.notFound.eyebrow}</p>
      <h1>{dictionary.notFound.title}</h1>
      <p>{dictionary.notFound.body}</p>
      <Link to="/" className="button primary">{dictionary.notFound.home}</Link>
    </div>
  );
}
