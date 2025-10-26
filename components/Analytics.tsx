

import React, { useState, useMemo, useEffect } from 'react';
import { getJalaliDate, jalaliMonthNames, toPersianDigits } from '../utils/jalali';
import type { Personnel, Shift, LeaveRequest, Post } from '../types';
import { useData } from './DataContext'; // New: Import useData hook

const StatCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
    <div className="bg-white dark:bg-[#1f2937] p-4 rounded-xl border border-gray-200 dark:border-[#374151] shadow-sm">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-1">{value}</p>
    </div>
);

const SkeletonStatCard: React.FC = () => (
    <div className="bg-white dark:bg-[#1f2937] p-4 rounded-xl border border-gray-200 dark:border-[#374151] shadow-sm space-y-2">
        <div className="h-4 w-2/3 skeleton-loader"></div>
        <div className="h-8 w-1/3 skeleton-loader"></div>
    </div>
);

const BarChart: React.FC<{ data: { label: string; day: number; night: number }[]; yAxisLabel: string; }> = ({ data, yAxisLabel }) => {
    const maxValue = Math.max(...data.map(d => d.day + d.night), 1); // Avoid division by zero
    return (
        <div className="w-full h-72 p-4 flex flex-col">
            <div className="flex-grow flex items-end gap-2 md:gap-4">
                {data.map(({ label, day, night }) => (
                    <div key={label} className="flex-1 flex flex-col items-center gap-1 group">
                        <div className="relative w-full h-full flex flex-col-reverse items-center">
                            <div className="w-full bg-yellow-300 dark:bg-yellow-500 rounded-t-md transition-all duration-300" style={{ height: `${(day / maxValue) * 100}%` }}></div>
                            <div className="w-full bg-sky-400 dark:bg-sky-600 transition-all duration-300" style={{ height: `${(night / maxValue) * 100}%` }}></div>
                            <div className="absolute -top-6 opacity-0 group-hover:opacity-100 bg-slate-700 dark:bg-slate-900 text-white text-xs px-2 py-1 rounded-md transition-opacity">
                                کل: {day + night}
                            </div>
                        </div>
                        <span className="text-xs text-center text-gray-500 dark:text-gray-400">{label}</span>
                    </div>
                ))}
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">{yAxisLabel}</span>
        </div>
    );
};

const SkeletonBarChart: React.FC = () => (
    <div className="w-full h-72 p-4 flex flex-col">
        <div className="flex-grow flex items-end gap-2 md:gap-4">
            {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex-1 flex flex-col-reverse items-center gap-1">
                    <div className="w-full skeleton-loader" style={{ height: `${Math.random() * 60 + 20}%` }}></div>
                </div>
            ))}
        </div>
         <div className="h-4 w-20 skeleton-loader mx-auto mt-2"></div>
    </div>
);

const Analytics: React.FC = () => {
    const { personnel, shifts } = useData();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);
    const { year: currentYear, month: currentMonth } = getJalaliDate(currentDate);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 500); // Simulate loading on month change
        return () => clearTimeout(timer);
    }, [currentYear, currentMonth]);

    const analyticsData = useMemo(() => {
        const monthStr = `${currentYear}/${String(currentMonth).padStart(2, '0')}`;
        const shiftsInMonth = shifts.filter(s => s.date.startsWith(monthStr));
        
        const shiftDistribution = personnel.map(p => {
            // fix: Changed personnelId to personnel_id to match type definition.
            const personShifts = shiftsInMonth.filter(s => s.personnel_id === p.id);
            return {
                label: `${p.name} ${p.family.charAt(0)}.`,
                day: personShifts.filter(s => s.type === 'روز').length,
                night: personShifts.filter(s => s.type === 'شب').length,
            };
        });

        const mostActive = shiftDistribution.reduce((max, p) => (p.day + p.night) > (max.day + max.night) ? p : max, { label: '-', day: 0, night: 0 });
        const mostActivePerson = mostActive.day + mostActive.night > 0 ? mostActive.label.replace('.', '') : '-';
        
        return {
            totalShifts: shiftsInMonth.length,
            mostActivePerson,
            shiftDistribution,
        };
    }, [currentYear, currentMonth, personnel, shifts]);

    const goToPreviousMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    const goToNextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-bold">تحلیل و بررسی عملکرد</h2>
                <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-[#1f2937] rounded-lg">
                    <button onClick={goToPreviousMonth} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700" aria-label="ماه قبل">&lt;</button>
                    <span className="font-semibold text-lg w-32 text-center">{jalaliMonthNames[currentMonth - 1]} {toPersianDigits(currentYear)}</span>
                    <button onClick={goToNextMonth} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700" aria-label="ماه بعد">&gt;</button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <>
                        <SkeletonStatCard />
                        <SkeletonStatCard />
                        <SkeletonStatCard />
                    </>
                ) : (
                    <>
                        <StatCard title="کل شیفت‌های این ماه" value={toPersianDigits(analyticsData.totalShifts)} />
                        <StatCard title="پرکارترین پرسنل" value={analyticsData.mostActivePerson} />
                        <StatCard title="میانگین شیفت روزانه" value={toPersianDigits((analyticsData.totalShifts / 30).toFixed(1))} />
                    </>
                )}
            </div>

            <div className="bg-white dark:bg-[#1f2937] p-4 rounded-xl border border-gray-200 dark:border-[#374151] shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">توزیع شیفت بین پرسنل</h3>
                 <div className="flex items-center gap-4 text-sm mb-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-yellow-300 dark:bg-yellow-500"></div>
                        <span>روز</span>
                    </div>
                     <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-sky-400 dark:bg-sky-600"></div>
                        <span>شب</span>
                    </div>
                </div>
                {isLoading ? <SkeletonBarChart /> : <BarChart data={analyticsData.shiftDistribution} yAxisLabel="تعداد شیفت" />}
            </div>
        </div>
    );
};

export default Analytics;