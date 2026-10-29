import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Dashboard from './modules/dashboard/Dashboard';
import ReEncodeMp4 from './modules/audio/ReEncodeMp4';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path='/' element={<Dashboard />} />
          <Route path='/re-encode-mp4' element={<ReEncodeMp4 />} />
          <Route path='' />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
