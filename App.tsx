
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
import { MenuIcon, SunIcon, MoonIcon, DashboardIcon } from './components/Icons';
import { ToastProvider } from './components/Toast';
import { ThemeProvider, useTheme } from './components/ThemeContext';
import { DataProvider, useData } from './components/DataContext';
import { AuthProvider, useAuth } from './components/AuthContext';


export type View = 'dashboard' | 'personnel' | 'calendar' | 'posts' | 'leaves' | 'reports' | 'status-report' | 'analytics';

const AppContent: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { loading: isDataLoading } = useData();
  const { UserSwitcher } = useAuth();


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

  if (isDataLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-4 text-xl font-semibold">
           <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-4 border-indigo-200 dark:border-indigo-800 rounded-full"></div>
              <div className="absolute inset-0 border-t-4 border-indigo-500 dark:border-indigo-400 rounded-full animate-spin"></div>
            </div>
          <span>در حال بارگذاری داده‌ها...</span>
        </div>
         <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">لطفا کمی صبر کنید</p>
      </div>
    );
  }

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
            <div className="flex items-center gap-4">
               <UserSwitcher />
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
    </div>
  );
};


const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <DataProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </DataProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
