import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Profiles from './pages/Profiles';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/profiles" replace />} />
        <Route path="/profiles" element={<Profiles />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}
