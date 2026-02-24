import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import SignDocument from './pages/SignDocument';
import SignatureApp from './pages/SignatureApp';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/register" element={<Register setToken={setToken} />} />
        <Route path="/sign/:token" element={<SignDocument />} />
        <Route path="/" element={<SignatureApp token={token} setToken={setToken} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
