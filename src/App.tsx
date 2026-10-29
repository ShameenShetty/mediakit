import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Dashboard from './modules/dashboard/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path='/' element={<Dashboard />} />
          <Route>Second page</Route>
          <Route>Third page</Route>
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
