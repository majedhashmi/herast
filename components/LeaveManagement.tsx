
import React, { useState, useEffect } from 'react';
import type { LeaveRequest, Personnel, NewRecord } from '../types';
import Modal from './Modal';
import { useToast } from './Toast';
import { PlusIcon, CheckIcon, XMarkIcon, FolderOpenIcon } from './Icons';
import JalaliDatePicker from './JalaliDatePicker';
import { formatJalaliDate, jalaliToGregorian } from '../utils/jalali';
import { useData } from './DataContext';
import { useAuth } from './AuthContext';

const AddLeaveModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (request: NewRecord<LeaveRequest>) => void;
    isSubmitting: boolean;
    personnel: Personnel[];
    currentUser: Personnel | null;
}> = ({ isOpen, onClose, onSubmit, isSubmitting, personnel, currentUser }) => {
    const isManager = currentUser?.role === 'مدیر' || currentUser?.role === 'سرشیفت';
    
    // If not a manager, default to the current user and make the dropdown read-only.
    // Otherwise, default to the first person in the list.
    const defaultPersonnelId = !isManager && currentUser ? currentUser.id : (personnel[0]?.id || 0);
    
    const [personnelId, setPersonnelId] = useState<number>(defaultPersonnelId);
    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);

    // Reset form fields when modal opens/closes, respecting the current user's role
    useEffect(() => {
        if (isOpen) {
            setPersonnelId(!isManager && currentUser ? currentUser.id : (personnel[0]?.id || 0));
            setStartDate(null);
            setEndDate(null);
        }
    }, [isOpen, personnel, currentUser, isManager]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (personnelId && startDate && endDate) {
            onSubmit({ personnel_id: personnelId, start_date: startDate, end_date: endDate, status: 'در انتظار' });
        }
    };
    
    const handleSelectStartDate = (date: string | null) => {
        setStartDate(date);
        if (date && endDate) {
            const [sY, sM, sD] = date.split('/').map(Number);
            const [eY, eM, eD] = endDate.split('/').map(Number);
            const gregorianStartDate = new Date(...jalaliToGregorian(sY, sM, sD));
            const gregorianEndDate = new Date(...jalaliToGregorian(eY, eM, eD));
            
            if (gregorianStartDate > gregorianEndDate) {
                setEndDate(null);
            }
        }
    }

    return (
        <Modal title="ثبت درخواست مرخصی جدید" isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                <label htmlFor="personnelId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">پرسنل</label>
                <select 
                    name="personnelId" 
                    id="personnelId" 
                    required 
                    className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 dark:disabled:bg-slate-700/50"
                    value={personnelId}
                    onChange={(e) => setPersonnelId(Number(e.target.value))}
                    disabled={!isManager}
                    aria-label="انتخاب پرسنل برای مرخصی"
                >
                    {isManager ? (
                        personnel.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.name} {p.family}
                            </option>
                        ))
                    ) : currentUser ? (
                        <option value={currentUser.id}>
                            {currentUser.name} {currentUser.family}
                        </option>
                    ) : null}
                </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاریخ شروع</label>
                    <JalaliDatePicker
                        id="startDate"
                        selectedDate={startDate}
                        onSelectDate={handleSelectStartDate}
                        highlightRangeWith={endDate}
                        aria-label="تاریخ شروع مرخصی"
                    />
                </div>
                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاریخ پایان</label>
                    <JalaliDatePicker
                        id="endDate"
                        selectedDate={endDate}
                        onSelectDate={setEndDate}
                        minDate={startDate} // End date cannot be before start date
                        highlightRangeWith={startDate}
                        aria-label="تاریخ پایان مرخصی"
                    />
                </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600" aria-label="انصراف از ثبت درخواست مرخصی">انصراف</button>
                <button type="submit" disabled={isSubmitting || !startDate || !endDate} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-500/50" aria-label="ثبت درخواست مرخصی">
                    {isSubmitting ? 'در حال ثبت...' : 'ثبت درخواست'}
                </button>
                </div>
            </form>
        </Modal>
    );
};

const SkeletonRow: React.FC = () => (
    <tr className="border-b border-gray-200 dark:border-slate-700">
        <td className="p-4"><div className="h-5 w-32 skeleton-loader"></div></td>
        <td className="p-4"><div className="h-5 w-24 skeleton-loader"></div></td>
        <td className="p-4"><div className="h-5 w-24 skeleton-loader"></div></td>
        <td className="p-4"><div className="h-5 w-20 skeleton-loader"></div></td>
        <td className="p-4"><div className="flex gap-2"><div className="h-7 w-7 rounded-full skeleton-loader"></div><div className="h-7 w-7 rounded-full skeleton-loader"></div></div></td>
    </tr>
);

const LeaveManagement: React.FC = () => {
  const { personnel, leaveRequests, addLeaveRequest, updateLeaveRequest, updatePersonnelStatus, loading } = useData();
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const sortedLeaveRequests = [...leaveRequests].sort((a, b) => {
    if (a.status === 'در انتظار' && b.status !== 'در انتظار') return -1;
    if (a.status !== 'در انتظار' && b.status === 'در انتظار') return 1;
    // Assuming created_at exists and is a string that can be compared
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const getPersonnelName = (id: number) => {
    const p = personnel.find(p => p.id === id);
    return p ? `${p.name} ${p.family}` : 'نامشخص';
  };

  const getStatusClass = (status: 'تایید شده' | 'در انتظار' | 'رد شده') => {
    switch (status) {
      case 'تایید شده': return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300';
      case 'در انتظار': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300';
      case 'رد شده': return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300';
    }
  };
  
  const handleAddLeave = async (requestData: NewRecord<LeaveRequest>) => {
    setIsSubmitting(true);
    try {
        await addLeaveRequest(requestData);
        setIsAddModalOpen(false);
        showToast('درخواست مرخصی با موفقیت ثبت شد.', 'success');
    } catch(error: any) {
        showToast(`خطا در ثبت درخواست: ${error.message}`, 'error');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: 'تایید شده' | 'رد شده', personnelId: number) => {
    try {
        await updateLeaveRequest(id, { status: newStatus });

        // If approved, update the personnel's status as well.
        // If rejected, we might need logic to revert status if it was previously 'مرخصی', but for now we keep it simple.
        if (newStatus === 'تایید شده') {
            await updatePersonnelStatus(personnelId, 'مرخصی');
        } else if (newStatus === 'رد شده') {
            // Optional: Revert status to 'فعال' if the user was on leave because of THIS request.
            // This requires more complex state management, so we'll leave it as an improvement.
            // For now, we assume status is managed elsewhere or manually corrected.
            // A simple check could be to see if any OTHER approved leave requests exist for this user.
             await updatePersonnelStatus(personnelId, 'فعال');
        }
        
        const message = newStatus === 'تایید شده' ? 'درخواست مرخصی تایید شد.' : 'درخواست مرخصی رد شد.';
        showToast(message, 'success');

    } catch(error: any) {
        showToast(`خطا در تغییر وضعیت: ${error.message}`, 'error');
    }
  };

  const canManage = user?.role === 'مدیر' || user?.role === 'سرشیفت';

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-2xl font-bold">مدیریت مرخصی‌ها</h2>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm hover:shadow-md"
            aria-label="ثبت درخواست مرخصی جدید"
          >
            <PlusIcon className="w-5 h-5" />
            <span>ثبت درخواست جدید</span>
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-x-auto shadow-sm">
          <table className="w-full min-w-max text-right">
            <thead className="border-b border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 dark:backdrop-blur-sm sticky top-0 z-10">
              <tr>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">نام پرسنل</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">تاریخ شروع</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">تاریخ پایان</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">وضعیت</th>
                {canManage && <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">عملیات</th>}
              </tr>
            </thead>
            <tbody className="animate-stagger-in">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
              ) : sortedLeaveRequests.length > 0 ? sortedLeaveRequests.map((request, index) => (
                <tr key={request.id} className="border-b border-gray-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60" style={{ animationDelay: `${index * 50}ms` }}>
                  <td className="p-4 font-medium">{getPersonnelName(request.personnel_id)}</td>
                  <td className="p-4">{formatJalaliDate(request.start_date)}</td>
                  <td className="p-4">{formatJalaliDate(request.end_date)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  {canManage && (
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                      {request.status === 'در انتظار' ? (
                        <>
                            <button onClick={() => handleStatusChange(request.id, 'تایید شده', request.personnel_id)} className="p-1.5 rounded-full text-gray-400 hover:bg-green-100 dark:hover:bg-green-500/20 hover:text-green-600 dark:hover:text-green-300" title="تایید" aria-label={`تایید درخواست مرخصی ${getPersonnelName(request.personnel_id)}`}>
                              <CheckIcon className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleStatusChange(request.id, 'رد شده', request.personnel_id)} className="p-1.5 rounded-full text-gray-400 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-300" title="رد" aria-label={`رد درخواست مرخصی ${getPersonnelName(request.personnel_id)}`}>
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                        </>
                      ) : (
                        <span className="text-gray-400 cursor-not-allowed">-</span>
                      )}
                      </div>
                    </td>
                  )}
                </tr>
              )) : (
                <tr>
                    <td colSpan={canManage ? 5 : 4} className="text-center p-16">
                        <div className="flex flex-col items-center gap-4 text-gray-500 dark:text-gray-400">
                            <FolderOpenIcon className="w-16 h-16 text-gray-300 dark:text-gray-600" aria-hidden="true"/>
                            <h3 className="text-lg font-medium">هیچ درخواست مرخصی ثبت نشده است</h3>
                            <p className="text-sm">برای ثبت درخواست جدید، از دکمه "ثبت درخواست جدید" استفاده کنید.</p>
                        </div>
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <AddLeaveModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddLeave}
        isSubmitting={isSubmitting}
        personnel={personnel}
        currentUser={user}
      />
    </>
  );
};

export default LeaveManagement;
