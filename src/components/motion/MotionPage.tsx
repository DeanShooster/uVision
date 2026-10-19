import { useParams } from 'react-router';
import { useDictionary } from '../../dictionary/dictionary';
import PieceLobby from '../lobby/PieceLobby';
import MotionPreview from './MotionPreview';

export default function MotionPage() {
  const dictionary = useDictionary();
  const { pieceId } = useParams();
  const motion = dictionary.motion;

  return (
    <PieceLobby
      documentTitle={motion.documentTitle}
      brandTitle={dictionary.brand.titled}
      title={motion.title}
      lede={motion.lede}
      navLabel={motion.nav}
      basePath="/motion"
      pieces={motion.pieces}
      pieceId={pieceId}
      missingTitle={motion.missingTitle}
      missingBody={motion.missingBody}
      renderPreview={(id) => <MotionPreview id={id} />}
    />
  );
}
