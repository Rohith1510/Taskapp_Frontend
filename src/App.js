import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import { supabase } from './supabaseClient';
import './App.css';

function AppRoutes({ session }) {
  return (
    <Routes>
      <Route path="/" element={session ? <Navigate to="/dashboard" /> : <Auth />} />
      <Route path="/dashboard" element={session ? <Dashboard session={session} /> : <Navigate to="/" />} />
      {/* <Route path="/dashboard" element={<Dashboard session={session} />} /> */}
    </Routes>
  );
}

function App() {
  const [session, setSession] = useState();

  useEffect(() => {
    supabase.auth.getSession().then((result) => {
      const session = result?.data?.session ;
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sessionData) => {
      setSession(sessionData );
    });
    return () => subscription.unsubscribe();
  }, []);

  // useEffect(() => {
  //   if (window.location.hash === '#') {
  //     window.history.replaceState(null, '', window.location.pathname);
  //   }
  // }, [session]);

  return (
    <Router>
      <div className="App">
        <h1>Task Management App</h1>
        <AppRoutes session={session} />
        
      </div>
    </Router>
  );
}

export default App;
