import { HashRouter, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Home from './modules/dashboard/Home';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path='/' element={<Home />} />
          <Route path='' />
        </Route>

      </Routes>
    </HashRouter>
  );
}

export default App;
