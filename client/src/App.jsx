// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import Dom from './strony/dom';
import Login from './strony/login';
import DomZalogowany from './strony/dom_zalogowany';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dom />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dom_zalogowany" element={<DomZalogowany />} />
    </Routes>
  );
}

export default App;
