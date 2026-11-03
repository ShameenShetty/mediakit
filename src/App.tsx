import { HashRouter, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import HomePage from './modules/dashboard/HomePage';
import SettingsPage from './modules/settings/SettingsPage';
import { UpscalePage } from './modules/advanced/UpscalePage';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path='/' element={<HomePage />} />

          <Route path='/upscale' element={<UpscalePage />} />

          <Route path='/settings' element={<SettingsPage />} />
        </Route>

      </Routes>
    </HashRouter>
  );
}

export default App;
