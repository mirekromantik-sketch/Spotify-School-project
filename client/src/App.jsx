// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import Homepage from './strony/homepage';
import Login from './strony/login';
import Main from './strony/main';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/main" element={<Main />} />
    </Routes>
  );
}

export default App;
