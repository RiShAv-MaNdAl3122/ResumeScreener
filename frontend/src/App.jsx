import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

// Layouts
import PublicLayout from './components/PublicLayout';
import DashboardLayout from './components/DashboardLayout';

// Page Components
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Screening from './pages/Screening';
import Results from './pages/Results';
import Candidates from './pages/Candidates';
import Candidate from './pages/Candidate';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes with Navbar and Footer */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* Protected Routes with Sidebar and Topbar */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/screen" element={<Screening />} />
            <Route path="/candidates" element={<Candidates />} />
            <Route path="/results" element={<Results />} />
            <Route path="/candidate/:id" element={<Candidate />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              borderRadius: '8px',
              border: '1px solid rgba(0,0,0,0.09)',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
