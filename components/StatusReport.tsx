
import React from 'react';
import type { Personnel, Shift, LeaveRequest, Post } from '../types';
import { PrinterIcon } from './Icons';
import { formatJalaliDate, getTodayJalaliString } from '../utils/jalali';
import { useData } from './DataContext'; // New: Import useData hook

interface PersonnelWithDetails extends Personnel {
    shiftType?: 'روز' | 'شب';
    postName?: string;
}

const StatusReport: React.FC = () => {
    const { personnel, posts, shifts, leaveRequests } = useData(); // New: Import useData hook

    const todayFormatted = getTodayJalaliString();

    const onDayShift: PersonnelWithDetails[] = [];
    const onNightShift: PersonnelWithDetails[] = [];
    const onLeave: PersonnelWithDetails[] = [];
    const available: PersonnelWithDetails[] = [];

    const personnelOnShiftIds = new Set<number>();
    const personnelOnLeaveIds = new Set<number>();
    
    // Categorize personnel on shift
    shifts.filter(s => s.date === todayFormatted).forEach(shift => {
        const person = personnel.find(p => p.id === shift.personnelId);
        const post = posts.find(p => p.id === shift.postId);
        if (person) {
            personnelOnShiftIds.add(person.id);
            const personWithDetails = { ...person, shiftType: shift.type, postName: post?.name };
            if (shift.type === 'روز') {
                onDayShift.push(personWithDetails);
            } else {
                onNightShift.push(personWithDetails);
            }
        }
    });

    // Categorize personnel on leave
    leaveRequests.filter(req => req.status === 'تایید شده' && todayFormatted >= req.startDate && todayFormatted <= req.endDate).forEach(req => {
        const person = personnel.find(p => p.id === req.personnelId);
        if (person && !personnelOnShiftIds.has(person.id)) { // A person can't be on shift and on leave
            personnelOnLeaveIds.add(person.id);
            onLeave.push(person);
        }
    });

    // Categorize available personnel
    personnel.forEach(person => {
        if (person.status === 'فعال' && !personnelOnShiftIds.has(person.id) && !personnelOnLeaveIds.has(person.id)) {
            available.push(person);
        }
    });
    
    const handlePrint = () => {
        window.print();
    }
    
    return (
        <div className="space-y-6" id="report-page">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">گزارش وضعیت روزانه پرسنل</h2>
                    <p className="text-gray-500 dark:text-gray-400">وضعیت برای تاریخ: {formatJalaliDate(todayFormatted)}</p>
                </div>
                <button
                    onClick={handlePrint}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                    <PrinterIcon className="w-5 h-5" />
                    <span>چاپ گزارش</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatusColumn title="شیفت روز" personnel={onDayShift} color="yellow" />
                <StatusColumn title="شیفت شب" personnel={onNightShift} color="sky" />
                <StatusColumn title="در مرخصی" personnel={onLeave} color="green" />
                <StatusColumn title="آماده به کار" personnel={available} color="gray" />
            </div>
        </div>
    );
};

interface StatusColumnProps {
    title: string;
    personnel: PersonnelWithDetails[];
    color: 'yellow' | 'sky' | 'green' | 'gray';
}

const StatusColumn: React.FC<StatusColumnProps> = ({ title, personnel, color }) => {
    const colorClasses = {
        yellow: { border: 'border-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-300' },
        sky: { border: 'border-sky-400', bg: 'bg-sky-50 dark:bg-sky-500/10', text: 'text-sky-600 dark:text-sky-300' },
        green: { border: 'border-green-400', bg: 'bg-green-50 dark:bg-green-500/10', text: 'text-green-600 dark:text-green-300' },
        gray: { border: 'border-gray-400 dark:border-gray-600', bg: 'bg-gray-100 dark:bg-[#1f2937]', text: 'text-gray-600 dark:text-gray-300' },
    };

    return (
        <div className={`rounded-xl ${colorClasses[color].bg} border-t-4 ${colorClasses[color].border} shadow-sm`}>
             <div className="p-4">
                <h3 className={`text-lg font-bold flex justify-between items-center text-gray-800 dark:text-gray-100`}>
                    {title}
                    <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${colorClasses[color].bg === 'bg-gray-100 dark:bg-[#1f2937]' ? 'bg-gray-200 dark:bg-slate-700' : ''}`}>
                        {personnel.length} نفر
                    </span>
                </h3>
            </div>
            <div className="space-y-3 p-4 pt-0">
                {personnel.length > 0 ? personnel.map(p => (
                    <div key={p.id} className="bg-white dark:bg-slate-700/50 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600/50">
                        <p className="font-semibold text-gray-900 dark:text-gray-50">{p.name} {p.family}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{p.role}</p>
                        {p.postName && <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1 font-medium">پست: {p.postName}</p>}
                    </div>
                )) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">موردی یافت نشد.</p>
                )}
            </div>
        </div>
    );
}

export default StatusReport;