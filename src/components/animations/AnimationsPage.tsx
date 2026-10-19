import { useParams } from 'react-router';
import { useDictionary } from '../../dictionary/dictionary';
import PieceLobby from '../lobby/PieceLobby';
import ScenePreview from './ScenePreview';

export default function AnimationsPage() {
  const dictionary = useDictionary();
  const { pieceId } = useParams();
  const animations = dictionary.animations;

  return (
    <PieceLobby
      documentTitle={animations.documentTitle}
      brandTitle={dictionary.brand.titled}
      title={animations.title}
      lede={animations.lede}
      navLabel={animations.nav}
      basePath="/animations"
      pieces={animations.pieces}
      pieceId={pieceId}
      missingTitle={animations.missingTitle}
      missingBody={animations.missingBody}
      renderPreview={(id) => <ScenePreview id={id} />}
    />
  );
}
