import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

const DashboardLayout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Minimal route protection: redirect to /login if no token
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#F5F4F0] font-body-standard text-text-primary antialiased flex flex-col">
      <Sidebar />
      <Header />

      {/* Main Content Area */}
      <div className="flex-1 ml-sidebar-width mt-topbar-height flex flex-col">
        <main className="p-container-padding flex-grow">
          <div className="max-w-[1200px] mx-auto">
            <Outlet />
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default DashboardLayout;
