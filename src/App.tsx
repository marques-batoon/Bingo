import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './screens/Home';
import JoinLink from './screens/JoinLink';
import RoomScreen from './screens/RoomScreen';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/join/:code" element={<JoinLink />} />
      <Route path="/room/:code" element={<RoomScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
