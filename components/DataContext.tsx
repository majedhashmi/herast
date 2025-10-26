import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Personnel, Post, Shift, LeaveRequest, Report } from '../types';
import { getTodayJalaliString, addDaysJalali } from '../utils/jalali';

// Centralize mock data to be used as initial seed
const mockPersonnel: Personnel[] = [
  { id: 1, name: 'علی', family: 'رضایی', code: 'P1001', phone: '09123456789', role: 'سرشیفت', status: 'فعال' },
  { id: 2, name: 'حسین', family: 'محمدی', code: 'P1002', phone: '09123456780', role: 'نگهبان', status: 'فعال' },
  { id: 3, name: 'مهدی', family: 'کریمی', code: 'P1003', phone: '09123456781', role: 'نگهبان', status: 'فعال' },
  { id: 4, name: 'رضا', family: 'قاسمی', code: 'P1004', phone: '09123456782', role: 'نگهبان', status: 'فعال' },
  { id: 5, name: 'محمد', family: 'احمدی', code: 'P1005', phone: '09123456783', role: 'مدیر', status: 'فعال' },
];
const mockPosts: Post[] = [
  { id: 1, name: 'ورودی اصلی', location: 'درب شمالی', priority: 'حیاتی', notes: 'بررسی کارت شناسایی الزامی است.' },
  { id: 2, name: 'ساختمان اداری', location: 'لابی طبقه همکف', priority: 'مهم', notes: 'نظارت بر ورود و خروج مراجعین.' },
  { id: 3, name: 'انبار شماره ۱', location: 'بخش جنوبی مجموعه', priority: 'مهم', notes: '' },
  { id: 4, name: 'محوطه پارکینگ', location: 'کل محوطه بیرونی', priority: 'عادی', notes: 'گشت‌زنی دوره‌ای هر ۲ ساعت.' },
];
const mockShifts: Shift[] = [
  { id: 1, date: '1403/05/03', type: 'روز', personnelId: 1, postId: 1 },
  { id: 2, date: '1403/05/03', type: 'شب', personnelId: 3, postId: 1 },
  { id: 3, date: '1403/05/04', type: 'روز', personnelId: 2, postId: 2 },
  { id: 4, date: '1403/05/04', type: 'شب', personnelId: 1, postId: 2 },
  { id: 5, date: '1403/05/08', type: 'روز', personnelId: 3, postId: 3 },
  { id: 6, date: '1403/06/10', type: 'روز', personnelId: 1, postId: 4 },
];
const mockLeaveRequests: LeaveRequest[] = [
  { id: 1, personnelId: 2, startDate: '1403/05/02', endDate: '1403/05/05', status: 'تایید شده' },
  { id: 2, personnelId: 4, startDate: '1403/05/11', endDate: '1403/05/12', status: 'تایید شده' },
  { id: 3, personnelId: 1, startDate: '1403/06/01', endDate: '1403/06/05', status: 'تایید شده' },
  { id: 4, personnelId: 3, startDate: '1403/05/03', endDate: '1403/05/03', status: 'تایید شده' },
];
const mockReports: Report[] = [
    { id: 1, personnelId: 1, date: '1403/05/15', content: 'عملکرد عالی در مدیریت شیفت شب و بازرسی دقیق از محوطه. مورد خاصی گزارش نشد.', author: 'محمد احمدی' },
    { id: 2, personnelId: 3, date: '1403/05/14', content: 'گزارش تاخیر ۱۰ دقیقه‌ای در شروع پست به دلیل مشکلات ترافیکی.', author: 'علی رضایی' },
    { id: 3, personnelId: 2, date: '1403/05/12', content: 'گزارش بازگشت از مرخصی و تحویل پست بدون مشکل.', author: 'علی رضایی' },
];

interface AppData {
  personnel: Personnel[];
  posts: Post[];
  shifts: Shift[];
  leaveRequests: LeaveRequest[];
  reports: Report[];
}

interface DataContextType extends AppData {
  setPersonnel: React.Dispatch<React.SetStateAction<Personnel[]>>;
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  setLeaveRequests: React.Dispatch<React.SetStateAction<LeaveRequest[]>>;
  setReports: React.Dispatch<React.SetStateAction<Report[]>>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'securityShiftAppData';

const initialData: AppData = {
    personnel: mockPersonnel,
    posts: mockPosts,
    shifts: mockShifts,
    leaveRequests: mockLeaveRequests,
    reports: mockReports
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setPersonnel(parsedData.personnel || initialData.personnel);
        setPosts(parsedData.posts || initialData.posts);
        setShifts(parsedData.shifts || initialData.shifts);
        setLeaveRequests(parsedData.leaveRequests || initialData.leaveRequests);
        setReports(parsedData.reports || initialData.reports);
      } else {
        // Seed with dynamic mock data for a better first-run experience
        const todayFormatted = getTodayJalaliString();
        
        const dynamicShifts = [
          { id: 9991, date: todayFormatted, type: 'روز' as const, personnelId: 1, postId: 1 },
          { id: 9992, date: todayFormatted, type: 'شب' as const, personnelId: 3, postId: 2 },
        ];
        
        const dynamicLeave = [
          { id: 9993, personnelId: 2, startDate: todayFormatted, endDate: addDaysJalali(todayFormatted, 2), status: 'تایید شده' as const },
        ];

        const dynamicPersonnel = initialData.personnel.map(p => {
            if (p.id === 2) return { ...p, status: 'مرخصی' as const };
            return p;
        });

        setPersonnel(dynamicPersonnel);
        setPosts(initialData.posts);
        setShifts([...initialData.shifts, ...dynamicShifts]);
        setLeaveRequests([...initialData.leaveRequests, ...dynamicLeave]);
        setReports(initialData.reports);
      }
    } catch (error) {
      console.error("Failed to load data from local storage:", error);
      // Fallback to initial data on error
      setPersonnel(initialData.personnel);
      setPosts(initialData.posts);
      setShifts(initialData.shifts);
      setLeaveRequests(initialData.leaveRequests);
      setReports(initialData.reports);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        const dataToStore = {
          personnel,
          posts,
          shifts,
          leaveRequests,
          reports,
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToStore));
      } catch (error) {
        console.error("Failed to save data to local storage:", error);
      }
    }
  }, [personnel, posts, shifts, leaveRequests, reports, isLoaded]);

  const value = {
    personnel, setPersonnel,
    posts, setPosts,
    shifts, setShifts,
    leaveRequests, setLeaveRequests,
    reports, setReports
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};