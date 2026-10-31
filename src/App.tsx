import { HashRouter, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import ReEncodeMp4 from './modules/audio/ReEncodeMp4';
import Dashboard from './modules/dashboard/Dashboard';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path='/' element={<Dashboard />} />
          <Route path='/convert' element={<ReEncodeMp4 />} />
          <Route path='' />
        </Route>

      </Routes>
    </HashRouter>
  );
}

export default App;
