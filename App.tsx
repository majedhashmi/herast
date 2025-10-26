
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PersonnelManagement from './components/PersonnelManagement';
import ShiftCalendar from './components/ShiftCalendar';
import PostManagement from './components/PostManagement';
import LeaveManagement from './components/LeaveManagement';
import Reports from './components/Reports';
import StatusReport from './components/StatusReport';
import Analytics from './components/Analytics';
import AiAssistant from './components/AiAssistant'; // New
import { MenuIcon, SunIcon, MoonIcon } from './components/Icons';
import { ToastProvider } from './components/Toast';
import { ThemeProvider, useTheme } from './components/ThemeContext';
import { DataProvider } from './components/DataContext';

export type View = 'dashboard' | 'personnel' | 'calendar' | 'posts' | 'leaves' | 'reports' | 'status-report' | 'analytics';

const AppContent: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard setActiveView={setActiveView} />;
      case 'personnel':
        return <PersonnelManagement />;
      case 'calendar':
        return <ShiftCalendar />;
      case 'posts':
        return <PostManagement />;
      case 'leaves':
        return <LeaveManagement />;
      case 'reports':
        return <Reports />;
      case 'status-report':
        return <StatusReport />;
      case 'analytics':
        return <Analytics />;
      default:
        return <Dashboard setActiveView={setActiveView} />;
    }
  };

  return (
    <div className="min-h-screen text-gray-800 dark:text-gray-200">
      <div className="flex">
        <Sidebar activeView={activeView} setActiveView={setActiveView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <main className="flex-1 transition-all duration-300 ease-in-out md:mr-64 print:mr-0">
          <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-[var(--color-border-dark)] p-4 flex justify-between items-center sticky top-0 z-20 print:hidden">
            <div className="flex items-center gap-4">
              <button className="md:hidden p-2 text-gray-500 dark:text-gray-400" onClick={() => setIsSidebarOpen(true)}>
                <MenuIcon className="w-6 h-6" />
              </button>
               <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 hidden sm:block">سامانه مدیریت حراست</h1>
            </div>
            <div className="flex items-center gap-2">
               <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-900"
                aria-label={`تغییر به پوسته ${theme === 'light' ? 'تاریک' : 'روشن'}`}
                aria-live="polite"
              >
                <div className="relative w-6 h-6 overflow-hidden">
                    {/* Sun Icon -- visible in dark mode, slides in from top */}
                    <div className={`absolute inset-0 transform transition-transform duration-500 ease-in-out ${theme === 'light' ? 'translate-y-full' : 'translate-y-0'}`}>
                        <SunIcon className="w-6 h-6" aria-hidden="true" />
                    </div>
                    {/* Moon Icon -- visible in light mode, slides in from top */}
                    <div className={`absolute inset-0 transform transition-transform duration-500 ease-in-out ${theme === 'light' ? 'translate-y-0' : '-translate-y-full'}`}>
                        <MoonIcon className="w-6 h-6" aria-hidden="true" />
                    </div>
                </div>
              </button>
            </div>
          </header>
          <div className="p-4 sm:p-6 md:p-8">
            {renderView()}
          </div>
        </main>
      </div>
      <AiAssistant />
    </div>
  );
};


const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;