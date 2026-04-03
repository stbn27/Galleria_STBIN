import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import JobsBar from '../shared/JobsBar';
import JobsDrawer from '../shared/JobsDrawer';
import LogsDrawer from '../shared/LogsDrawer';
import { useUiStore } from '../../store/uiStore';

const Layout: React.FC = () => {
  const { theme } = useUiStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Relative positioning on main keeps the layout structured so drawers can be absolute
  return (
    <div className="flex h-screen w-full bg-[var(--bg-primary)] overflow-hidden text-[var(--text-primary)] font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col relative w-full h-full overflow-hidden">
        <TopBar />
        <JobsBar />
        <main className="flex-1 relative overflow-y-auto w-full h-full">
          <Outlet />
        </main>
        <JobsDrawer />
        <LogsDrawer />
      </div>
    </div>
  );
};

export default Layout;
