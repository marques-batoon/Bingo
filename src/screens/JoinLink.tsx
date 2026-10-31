import { Navigate, useParams } from 'react-router-dom';
import { isValidRoomCode, normalizeRoomCode } from '../lib/roomCode';

/** /join/CODE: the shareable link. The room screen does the actual joining. */
export default function JoinLink() {
  const code = normalizeRoomCode(useParams().code ?? '');
  return <Navigate to={isValidRoomCode(code) ? `/room/${code}` : '/'} replace />;
}
