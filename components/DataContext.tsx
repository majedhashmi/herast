import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Personnel, Post, Shift, LeaveRequest, Report, NewRecord } from '../types';
import { getTodayJalaliString, addDaysJalali } from '../utils/jalali';

// --- MOCK DATA ---
const MOCK_PERSONNEL: Personnel[] = [
  { id: 1, created_at: new Date(Date.now() - 2 * 86400000).toISOString(), name: 'علی', family: 'رضایی', code: 'P1001', phone: '09123456789', role: 'نگهبان', status: 'فعال' },
  { id: 2, created_at: new Date(Date.now() - 5 * 86400000).toISOString(), name: 'حسین', family: 'محمدی', code: 'P1002', phone: '09123456780', role: 'سرشیفت', status: 'فعال' },
  { id: 3, created_at: new Date(Date.now() - 10 * 86400000).toISOString(), name: 'مهدی', family: 'کریمی', code: 'M2001', phone: '09123456781', role: 'مدیر', status: 'فعال' },
  { id: 4, created_at: new Date(Date.now() - 1 * 86400000).toISOString(), name: 'رضا', family: 'احمدی', code: 'P1003', phone: '09123456782', role: 'نگهبان', status: 'مرخصی' },
  { id: 5, created_at: new Date().toISOString(), name: 'سعید', family: 'قاسمی', code: 'P1004', phone: '09123456783', role: 'نگهبان', status: 'غیرفعال' },
];

const MOCK_POSTS: Post[] = [
  { id: 1, created_at: new Date().toISOString(), name: 'ورودی اصلی', location: 'درب شمالی', priority: 'حیاتی', notes: 'کنترل دقیق ورود و خروج الزامی است.' },
  { id: 2, created_at: new Date().toISOString(), name: 'محوطه پارکینگ', location: 'بخش جنوبی', priority: 'مهم', notes: '' },
  { id: 3, created_at: new Date().toISOString(), name: 'ساختمان اداری', location: 'طبقه همکف', priority: 'عادی', notes: 'نظارت بر دوربین‌های لابی' },
];

const MOCK_SHIFTS: Shift[] = [
  { id: 1, created_at: new Date().toISOString(), date: getTodayJalaliString(), type: 'روز', personnel_id: 1, post_id: 1 },
  { id: 2, created_at: new Date().toISOString(), date: getTodayJalaliString(), type: 'شب', personnel_id: 2, post_id: 1 },
  { id: 3, created_at: new Date().toISOString(), date: addDaysJalali(getTodayJalaliString(), 1), type: 'روز', personnel_id: 2, post_id: 2 },
  { id: 4, created_at: new Date().toISOString(), date: addDaysJalali(getTodayJalaliString(), 1), type: 'شب', personnel_id: 1, post_id: 3 },
];

const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [
  { id: 1, created_at: new Date().toISOString(), personnel_id: 4, start_date: getTodayJalaliString(), end_date: addDaysJalali(getTodayJalaliString(), 2), status: 'تایید شده' },
  { id: 2, created_at: new Date().toISOString(), personnel_id: 1, start_date: addDaysJalali(getTodayJalaliString(), 5), end_date: addDaysJalali(getTodayJalaliString(), 6), status: 'در انتظار' },
];

const MOCK_REPORTS: Report[] = [
  { id: 1, created_at: new Date().toISOString(), personnel_id: 2, date: addDaysJalali(getTodayJalaliString(), -1), content: 'بازرسی از پست شماره ۳ انجام شد و مورد مشکوکی مشاهده نشد. سیستم دوربین‌ها سالم است.', author: 'مهدی کریمی' },
  { id: 2, created_at: new Date().toISOString(), personnel_id: 1, date: addDaysJalali(getTodayJalaliString(), -2), content: 'گزارش ورود یک خودروی ناشناس در ساعت ۲ بامداد که پس از بررسی مشخص شد مربوط به تیم تاسیسات بوده است.', author: 'حسین محمدی' },
];


interface AppData {
  personnel: Personnel[];
  posts: Post[];
  shifts: Shift[];
  leaveRequests: LeaveRequest[];
  reports: Report[];
}

interface DataContextType extends AppData {
  loading: boolean;
  addPersonnel: (person: NewRecord<Personnel>) => Promise<void>;
  updatePersonnel: (id: number, updates: Partial<Personnel>) => Promise<void>;
  deletePersonnel: (id: number) => Promise<void>;
  updatePersonnelStatus: (id: number, status: 'فعال' | 'مرخصی' | 'غیرفعال') => Promise<void>;
  addPost: (post: NewRecord<Post>) => Promise<void>;
  updatePost: (id: number, updates: Partial<Post>) => Promise<void>;
  deletePost: (id: number) => Promise<void>;
  addShift: (shift: NewRecord<Shift>) => Promise<void>;
  addMultipleShifts: (shifts: NewRecord<Shift>[]) => Promise<void>;
  updateShift: (id: number, updates: Partial<Shift>) => Promise<void>;
  deleteShift: (id: number) => Promise<void>;
  addLeaveRequest: (req: NewRecord<LeaveRequest>) => Promise<void>;
  updateLeaveRequest: (id: number, updates: Partial<LeaveRequest>) => Promise<void>;
  addReport: (report: NewRecord<Report>) => Promise<void>;
  updateReport: (id: number, updates: Partial<Report>) => Promise<void>;
  deleteReport: (id: number) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    // Simulate fetching data with a delay
    setLoading(true);
    const timer = setTimeout(() => {
      setPersonnel(MOCK_PERSONNEL);
      setPosts(MOCK_POSTS);
      setShifts(MOCK_SHIFTS);
      setLeaveRequests(MOCK_LEAVE_REQUESTS);
      setReports(MOCK_REPORTS);
      setLoading(false);
    }, 1200); // 1.2 second delay to show loading indicator

    return () => clearTimeout(timer);
  }, []);
  
  // --- MUTATION FUNCTIONS (Local State Manipulation) ---

  const addPersonnel = async (person: NewRecord<Personnel>) => {
    const newPerson: Personnel = { ...person, id: Date.now(), created_at: new Date().toISOString() };
    setPersonnel(prev => [...prev, newPerson]);
  };
  
  const updatePersonnel = async (id: number, updates: Partial<Personnel>) => {
    setPersonnel(prev => prev.map(p => p.id === id ? { ...p, ...updates } as Personnel : p));
  };
  
  const deletePersonnel = async (id: number) => {
    setPersonnel(prev => prev.filter(p => p.id !== id));
  };
  
  const updatePersonnelStatus = async (id: number, status: 'فعال' | 'مرخصی' | 'غیرفعال') => {
    await updatePersonnel(id, { status });
  };
  
  const addPost = async (post: NewRecord<Post>) => {
    const newPost: Post = { ...post, id: Date.now(), created_at: new Date().toISOString() };
    setPosts(p => [...p, newPost]);
  };
  
  const updatePost = async (id: number, updates: Partial<Post>) => {
    setPosts(p => p.map(post => post.id === id ? { ...post, ...updates } as Post : post));
  };

  const deletePost = async (id: number) => {
    setPosts(p => p.filter(post => post.id !== id));
  };
  
  const addShift = async (shift: NewRecord<Shift>) => {
    const newShift: Shift = { ...shift, id: Date.now(), created_at: new Date().toISOString() };
    setShifts(s => [...s, newShift]);
  };
  
  const addMultipleShifts = async (shiftsToAdd: NewRecord<Shift>[]) => {
    const newShifts: Shift[] = shiftsToAdd.map(s => ({ ...s, id: Date.now() + Math.random(), created_at: new Date().toISOString() }));
    setShifts(s => [...s, ...newShifts]);
  };
  
  const updateShift = async (id: number, updates: Partial<Shift>) => {
    setShifts(s => s.map(shift => shift.id === id ? { ...shift, ...updates } as Shift : shift));
  };
  
  const deleteShift = async (id: number) => {
    setShifts(s => s.filter(shift => shift.id !== id));
  };

  const addLeaveRequest = async (req: NewRecord<LeaveRequest>) => {
    const newReq: LeaveRequest = { ...req, id: Date.now(), created_at: new Date().toISOString() };
    setLeaveRequests(lr => [newReq, ...lr]);
  };
  
  const updateLeaveRequest = async (id: number, updates: Partial<LeaveRequest>) => {
    setLeaveRequests(lr => lr.map(req => req.id === id ? { ...req, ...updates } as LeaveRequest : req));
  };

  const addReport = async (report: NewRecord<Report>) => {
    const newReport: Report = { ...report, id: Date.now(), created_at: new Date().toISOString() };
    setReports(r => [newReport, ...r]);
  };

  const updateReport = async (id: number, updates: Partial<Report>) => {
    setReports(r => r.map(report => report.id === id ? { ...report, ...updates } as Report : report));
  };
  
  const deleteReport = async (id: number) => {
    setReports(r => r.filter(report => report.id !== id));
  };

  const value: DataContextType = {
    loading,
    personnel,
    posts,
    shifts,
    leaveRequests,
    reports,
    addPersonnel,
    updatePersonnel,
    deletePersonnel,
    updatePersonnelStatus,
    addPost,
    updatePost,
    deletePost,
    addShift,
    addMultipleShifts,
    updateShift,
    deleteShift,
    addLeaveRequest,
    updateLeaveRequest,
    addReport,
    updateReport,
    deleteReport,
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
