import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ThemeProvider from './providers/ThemeProvider';
import Header from './components/Header/Header';
import Home from './pages/Home/Home';
import Auth from './pages/Auth/Auth';
import Onboarding from './pages/Onboarding/Onboarding';
import Dashboard from './pages/Dashboard/Dashboard';
import { authService } from './utils/auth';
import './styles/global.css';

function ProtectedOnboarding({ children }) {
  const isAuthenticated = authService.isAuthenticated();
  const hasCompletedOnboarding = authService.hasCompletedOnboarding();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (hasCompletedOnboarding) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function ProtectedDashboard({ children }) {
  const isAuthenticated = authService.isAuthenticated();
  const hasCompletedOnboarding = authService.hasCompletedOnboarding();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

function GuestRoute({ children }) {
  const isAuthenticated = authService.isAuthenticated();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function App() {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check authentication and onboarding status on mount
    setIsChecking(false);
  }, []);

  if (isChecking) {
    return null; // Or a loading spinner
  }

  return (
    <ThemeProvider>
      <Router>
        <div className="app">
          <Header />
          <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/auth"
              element={
                <GuestRoute>
                  <Auth />
                </GuestRoute>
              }
            />
            <Route 
              path="/onboarding" 
              element={
                <ProtectedOnboarding>
                  <Onboarding />
                </ProtectedOnboarding>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedDashboard>
                  <Dashboard />
                </ProtectedDashboard>
              } 
            />
          </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
