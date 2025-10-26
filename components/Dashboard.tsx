


// fix: Import useState and useEffect to resolve 'cannot find name' errors.
import React, { useState, useEffect } from 'react';
import type { View } from '../App';
import { UsersIcon, LeaveIcon, ExclamationTriangleIcon, UserPlusIcon, ReportIcon, PostIcon, ArrowUpRightIcon, DocumentPlusIcon } from './Icons';
import { formatJalaliDate } from '../utils/jalali';
import { useData } from './DataContext';

type StatCardColor = 'indigo' | 'green' | 'yellow' | 'red';

const colorMap: Record<StatCardColor, { bg: string; text: string; shadow: string; }> = {
    indigo: {
        bg: 'bg-indigo-100 dark:bg-indigo-900/50',
        text: 'text-indigo-500 dark:text-indigo-400',
        shadow: 'hover:shadow-indigo-500/20'
    },
    green: {
        bg: 'bg-green-100 dark:bg-green-900/50',
        text: 'text-green-500 dark:text-green-400',
        shadow: 'hover:shadow-green-500/20'
    },
    yellow: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/50',
        text: 'text-yellow-500 dark:text-yellow-400',
        shadow: 'hover:shadow-yellow-500/20'
    },
    red: {
        bg: 'bg-red-100 dark:bg-red-900/50',
        text: 'text-red-500 dark:text-red-400',
        shadow: 'hover:shadow-red-500/20'
    }
};

// fix: Made the icon prop type more specific to `React.ReactElement<React.ComponentProps<'svg'>>` to fix cloneElement type error.
const StatCard: React.FC<{ title: string; value: string; icon: React.ReactElement<React.ComponentProps<'svg'>>; color: StatCardColor; style?: React.CSSProperties }> = ({ title, value, icon, color, style }) => {
    const colors = colorMap[color];
    return (
        <div style={style} className={`bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-[var(--color-border-dark)] flex items-center gap-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${colors.shadow}`}>
            <div className={`p-3 rounded-full ${colors.bg}`}>
                {React.cloneElement(icon, { className: `w-6 h-6 ${colors.text}` })}
            </div>
            <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
            </div>
        </div>
    );
};

const SkeletonCard: React.FC = () => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-[var(--color-border-dark)] flex items-center gap-4">
        <div className="w-12 h-12 rounded-full skeleton-loader"></div>
        <div className="flex-1 space-y-2">
            <div className="h-4 w-20 skeleton-loader"></div>
            <div className="h-8 w-12 skeleton-loader"></div>
        </div>
    </div>
);

const QuickAction: React.FC<{ title: string; icon: React.ReactNode; onClick: () => void }> = ({ title, icon, onClick }) => (
    <button onClick={onClick} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-slate-700/50 hover:bg-indigo-50 dark:hover:bg-slate-700 w-full text-right group transition-colors duration-200">
        <div className="flex items-center gap-3">
            {icon}
            <span className="font-semibold text-gray-700 dark:text-gray-200">{title}</span>
        </div>
        <ArrowUpRightIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-transform group-hover:scale-110" />
    </button>
);


interface DashboardProps {
    setActiveView: (view: View) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActiveView }) => {
  const { personnel, leaveRequests, loading: isDataLoading } = useData();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate data fetching for dashboard animations
    const timer = setTimeout(() => setIsLoading(isDataLoading), 700);
    return () => clearTimeout(timer);
  }, [isDataLoading]);

  const recentActivities = [
    { id: 1, text: 'شیفت شب برای علی رضایی ثبت شد.', time: '۲ ساعت پیش' },
    { id: 2, text: 'درخواست مرخصی حسین محمدی تایید شد.', time: '۵ ساعت پیش' },
    { id: 3, text: 'گزارش بازرسی از پست شماره ۳ ثبت شد.', time: 'دیروز' },
    { id: 4, text: 'مهدی کریمی به عنوان نیروی جدید اضافه شد.', time: '۲ روز پیش' },
  ].slice(0, 4);

  const onLeavePersonnel = personnel
    .filter(p => p.status === 'مرخصی')
    .map(p => {
        // fix: Changed personnelId to personnel_id to match type definition.
        const leave = leaveRequests.find(lr => lr.personnel_id === p.id && lr.status === 'تایید شده');
        return {
            id: p.id,
            name: `${p.name} ${p.family}`,
            // fix: Changed endDate to end_date to match type definition.
            until: leave ? leave.end_date : 'نامشخص'
        }
    });

  const totalPersonnel = personnel.length;
  const activePersonnel = personnel.filter(p => p.status === 'فعال').length;
  const onLeave = personnel.filter(p => p.status === 'مرخصی').length;


  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">داشبورد مدیریتی</h2>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-stagger-in">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard style={{animationDelay: '100ms'}} title="کل پرسنل" value={totalPersonnel.toString()} icon={<UsersIcon />} color="indigo" />
            <StatCard style={{animationDelay: '200ms'}} title="نیروهای فعال" value={activePersonnel.toString()} icon={<UsersIcon />} color="green" />
            <StatCard style={{animationDelay: '300ms'}} title="در مرخصی" value={onLeave.toString()} icon={<LeaveIcon />} color="yellow" />
            <StatCard style={{animationDelay: '400ms'}} title="هشدارهای کاری" value="۱" icon={<ExclamationTriangleIcon />} color="red" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-[var(--color-border-dark)] shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">دسترسی سریع</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <QuickAction title="افزودن نیروی جدید" icon={<UserPlusIcon className="w-6 h-6 text-indigo-500"/>} onClick={() => setActiveView('personnel')} />
                    <QuickAction title="ثبت گزارش عملکرد" icon={<DocumentPlusIcon className="w-6 h-6 text-green-500"/>} onClick={() => setActiveView('reports')} />
                    <QuickAction title="افزودن پست جدید" icon={<PostIcon className="w-6 h-6 text-sky-500"/>} onClick={() => setActiveView('posts')} />
                    <QuickAction title="ثبت درخواست مرخصی" icon={<LeaveIcon className="w-6 h-6 text-yellow-500"/>} onClick={() => setActiveView('leaves')} />
                </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-[var(--color-border-dark)] shadow-sm">
              <h3 className="text-lg font-semibold mb-4 border-b pb-3 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-slate-700">فعالیت‌های اخیر</h3>
              <ul className="space-y-4">
                {recentActivities.map(activity => (
                  <li key={activity.id} className="flex justify-between items-center">
                    <p className="text-gray-700 dark:text-gray-300">{activity.text}</p>
                    <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 pr-4">{activity.time}</span>
                  </li>
                ))}
              </ul>
            </div>
        </div>

        {/* Personnel on Leave */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-[var(--color-border-dark)] shadow-sm">
          <h3 className="text-lg font-semibold mb-4 border-b pb-3 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-slate-700">پرسنل در مرخصی</h3>
          <ul className="space-y-3">
             {isLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                    <li key={i} className="flex justify-between items-center py-1">
                        <div className="h-5 w-24 skeleton-loader"></div>
                        <div className="h-5 w-16 skeleton-loader"></div>
                    </li>
                ))
             ) : onLeavePersonnel.length > 0 ? (
                onLeavePersonnel.map(person => (
                    <li key={person.id} className="flex justify-between items-center">
                        <span className="font-medium text-gray-600 dark:text-gray-300">{person.name}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">تا {formatJalaliDate(person.until)}</span>
                    </li>
                ))
             ) : (
                <li className="text-center text-gray-400 dark:text-gray-500 py-4">
                    هیچ پرسنلی در مرخصی نیست.
                </li>
             )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;