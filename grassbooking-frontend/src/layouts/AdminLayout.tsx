import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { Navbar } from '../components/common/Navbar';

export const AdminLayout = () => (
  <div className="flex h-screen overflow-hidden bg-ink-50">
    <div className="hidden md:block">
      <Sidebar />
    </div>
    <div className="flex-1 flex flex-col min-h-0 min-w-0">
      <Navbar />
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <Outlet />
      </div>
    </div>
  </div>
);
