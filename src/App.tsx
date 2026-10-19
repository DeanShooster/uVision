import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router';
import AlgorithmsPage from './components/algorithms/AlgorithmsPage';
import AnimationsPage from './components/animations/AnimationsPage';
import CityPage from './components/animations/CityPage';
import SolarSystemPage from './components/animations/SolarSystemPage';
import AppShell from './components/layout/AppShell';
import ComputationsPage from './components/computations/ComputationsPage';
import HomePage from './components/home/HomePage';
import ClothPage from './components/motion/ClothPage';
import FlockPage from './components/motion/FlockPage';
import MotionPage from './components/motion/MotionPage';
import NotFound from './components/not-found/NotFound';
import PathPage from './components/path/PathPage';
import SortPage from './components/sort/SortPage';

function LegacySortRedirect() {
  const { algorithmId } = useParams();
  const to = algorithmId ? `/algorithms/sorting/${algorithmId}` : '/algorithms/sorting';
  return <Navigate to={to} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/animations/solar-system" element={<SolarSystemPage />} />
        <Route path="/animations/city-delivery" element={<CityPage />} />
        <Route path="/motion/flock" element={<FlockPage />} />
        <Route path="/motion/cloth" element={<ClothPage />} />
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/algorithms" element={<AlgorithmsPage />} />
          <Route path="/algorithms/sorting" element={<SortPage />} />
          <Route path="/algorithms/sorting/:algorithmId" element={<SortPage />} />
          <Route path="/algorithms/pathfinding" element={<PathPage />} />
          <Route path="/algorithms/pathfinding/:algorithmId" element={<PathPage />} />
          <Route path="/algorithms/computations" element={<ComputationsPage />} />
          <Route path="/algorithms/computations/:algorithmId" element={<ComputationsPage />} />
          <Route path="/sort" element={<LegacySortRedirect />} />
          <Route path="/sort/:algorithmId" element={<LegacySortRedirect />} />
          <Route path="/animations" element={<AnimationsPage />} />
          <Route path="/animations/:pieceId" element={<AnimationsPage />} />
          <Route path="/motion" element={<MotionPage />} />
          <Route path="/motion/:pieceId" element={<MotionPage />} />
          <Route path="/canvas" element={<Navigate to="/motion" replace />} />
          <Route path="/algorithm" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
