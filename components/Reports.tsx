
import React, { useState } from 'react';
import type { Report, Personnel, NewRecord } from '../types';
import Modal from './Modal';
import { useToast } from './Toast';
import { EditIcon, DeleteIcon, PlusIcon, FolderOpenIcon, ExclamationTriangleIcon } from './Icons';
import { formatJalaliDate, getTodayJalaliString } from '../utils/jalali';
import { useData } from './DataContext';
import { useAuth } from './AuthContext';

const SkeletonReportCard: React.FC = () => (
    <div className="bg-white dark:bg-[#1f2937] p-4 rounded-xl border border-gray-200 dark:border-[#374151] shadow-sm">
        <div className="flex justify-between items-start border-b border-gray-200 dark:border-[#374151] pb-3 mb-3">
            <div>
                <div className="h-6 w-32 skeleton-loader mb-2"></div>
                <div className="h-4 w-24 skeleton-loader"></div>
            </div>
            <div className="h-5 w-20 skeleton-loader"></div>
        </div>
        <div className="space-y-2">
            <div className="h-4 w-full skeleton-loader"></div>
            <div className="h-4 w-5/6 skeleton-loader"></div>
        </div>
    </div>
);


const Reports: React.FC = () => {
    const { reports, personnel, addReport, updateReport, deleteReport, loading } = useData();
    const { user } = useAuth();
    const { showToast } = useToast();
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [editingReport, setEditingReport] = useState<Report | null>(null);
    const [deletingReport, setDeletingReport] = useState<Report | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getPersonnelName = (id: number) => {
        const p = personnel.find(p => p.id === id);
        return p ? `${p.name} ${p.family}` : 'نامشخص';
    };

    const handleAddReport = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) {
            showToast('برای ثبت گزارش باید وارد شوید.', 'error');
            return;
        }
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const todayFormatted = getTodayJalaliString();
        const newReport: NewRecord<Report> = {
            personnel_id: Number(formData.get('personnelId')),
            date: todayFormatted,
            content: formData.get('content') as string,
            author: `${user.name} ${user.family}`,
        };
        try {
            await addReport(newReport);
            setIsAddModalOpen(false);
            showToast('گزارش جدید با موفقیت ثبت شد.', 'success');
        } catch(error: any) {
            showToast(`خطا در ثبت گزارش: ${error.message}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditModal = (report: Report) => {
        setEditingReport(report);
        setIsEditModalOpen(true);
    };

    const handleUpdateReport = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if(!editingReport) return;
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const updatedData: Partial<Report> = {
            personnel_id: Number(formData.get('personnelId')),
            content: formData.get('content') as string,
        };
        try {
            await updateReport(editingReport.id, updatedData);
            setIsEditModalOpen(false);
            setEditingReport(null);
            showToast('گزارش با موفقیت به‌روزرسانی شد.', 'success');
        } catch(error: any) {
            showToast(`خطا در ویرایش گزارش: ${error.message}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDeleteModal = (report: Report) => {
        setDeletingReport(report);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingReport) return;
        setIsSubmitting(true);
        try {
            await deleteReport(deletingReport.id);
            setIsDeleteModalOpen(false);
            setDeletingReport(null);
            showToast('گزارش با موفقیت حذف شد.', 'success');
        } catch(error: any) {
            showToast(`خطا در حذف گزارش: ${error.message}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const canManage = user?.role === 'مدیر' || user?.role === 'سرشیفت';

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-2xl font-bold">گزارش‌ها و ردیابی عملکرد</h2>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm hover:shadow-md"
                        aria-label="ثبت گزارش جدید"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>ثبت گزارش جدید</span>
                    </button>
                </div>

                <div className="space-y-4 animate-stagger-in">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => <SkeletonReportCard key={i} />)
                    ) : reports.length > 0 ? reports.map((report, index) => (
                        <div key={report.id} className="bg-white dark:bg-[#1f2937] p-4 rounded-xl border border-gray-200 dark:border-[#374151] group shadow-sm hover:shadow-lg transition-shadow duration-300" style={{ animationDelay: `${index * 100}ms` }}>
                           <div className="flex justify-between items-start border-b border-gray-200 dark:border-slate-700 pb-3 mb-3">
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-gray-100">{getPersonnelName(report.personnel_id)}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">ثبت توسط: {report.author}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">{formatJalaliDate(report.date)}</span>
                                    {canManage && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEditModal(report)} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-indigo-500 dark:hover:text-indigo-400" aria-label={`ویرایش گزارش ${getPersonnelName(report.personnel_id)} در تاریخ ${formatJalaliDate(report.date)}`}>
                                                <EditIcon className="w-5 h-5"/>
                                            </button>
                                            <button onClick={() => openDeleteModal(report)} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-red-500 dark:hover:text-red-400" aria-label={`حذف گزارش ${getPersonnelName(report.personnel_id)} در تاریخ ${formatJalaliDate(report.date)}`}>
                                                <DeleteIcon className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    )}
                                </div>
                           </div>
                           <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{report.content}</p>
                        </div>
                    )) : (
                        <div className="text-center bg-white dark:bg-[#1f2937] p-16 rounded-xl border border-gray-200 dark:border-[#374151] shadow-sm">
                            <div className="flex flex-col items-center gap-4 text-gray-500 dark:text-gray-400">
                                <FolderOpenIcon className="w-16 h-16 text-gray-300 dark:text-gray-600" aria-hidden="true"/>
                                <h3 className="text-lg font-medium">هیچ گزارشی ثبت نشده است</h3>
                                <p className="text-sm">برای شروع، یک گزارش جدید از دکمه بالا ثبت کنید.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Modal title="ثبت گزارش عملکرد جدید" isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
                <form onSubmit={handleAddReport} className="space-y-4">
                     <div>
                        <label htmlFor="add-rep-personnelId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">مربوط به پرسنل</label>
                        <select name="personnelId" id="add-rep-personnelId" required className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500" aria-label="انتخاب پرسنل مرتبط با گزارش">
                            {personnel.map(p => (
                            <option key={p.id} value={p.id}>{p.name} {p.family}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="add-rep-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">متن گزارش</label>
                        <textarea 
                          name="content" 
                          id="add-rep-content" 
                          rows={4} 
                          required 
                          minLength={20}
                          className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500"
                          aria-label="متن گزارش"
                        ></textarea>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600" aria-label="انصراف از ثبت گزارش">انصراف</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-500/50" aria-label="ذخیره گزارش">
                            {isSubmitting ? 'در حال ذخیره...' : 'ذخیره گزارش'}
                        </button>
                    </div>
                </form>
            </Modal>
            
            {editingReport && (
                 <Modal title="ویرایش گزارش عملکرد" isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
                    <form onSubmit={handleUpdateReport} className="space-y-4">
                        <div>
                            <label htmlFor="edit-rep-personnelId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">مربوط به پرسنل</label>
                            <select name="personnelId" id="edit-rep-personnelId" defaultValue={editingReport.personnel_id} required className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500" aria-label="انتخاب پرسنل مرتبط با گزارش">
                                {personnel.map(p => (
                                <option key={p.id} value={p.id}>{p.name} {p.family}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="edit-rep-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">متن گزارش</label>
                            <textarea 
                              name="content" 
                              id="edit-rep-content" 
                              rows={4} 
                              defaultValue={editingReport.content} 
                              required 
                              minLength={20} 
                              className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500"
                              aria-label="متن گزارش"
                            ></textarea>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600" aria-label="انصراف از ویرایش گزارش">انصراف</button>
                            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-500/50" aria-label="به‌روزرسانی گزارش">
                                {isSubmitting ? 'در حال به‌روزرسانی...' : 'به‌روزرسانی گزارش'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            <Modal title="تایید حذف گزارش" isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
                <div className="flex flex-col items-center text-center">
                    <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mb-4" aria-hidden="true"/>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
                        آیا از حذف این گزارش مطمئن هستید؟
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                        گزارش مربوط به 
                        <span className="font-bold mx-1">{deletingReport && getPersonnelName(deletingReport.personnel_id)}</span>
                        در تاریخ
                        <span className="font-bold mx-1">{deletingReport && formatJalaliDate(deletingReport.date)}</span>
                        حذف خواهد شد. این عمل
                        <span className="font-semibold text-red-600 dark:text-red-400 mx-1">قابل بازگشت نیست.</span>
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-3 pt-8 w-full">
                        <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="px-6 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 w-full sm:w-auto order-2 sm:order-1" aria-label="انصراف از حذف گزارش">انصراف</button>
                        <button type="button" onClick={handleConfirmDelete} disabled={isSubmitting} className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 dark:disabled:bg-red-500/50 w-full sm:w-auto order-1 sm:order-2" aria-label={`تایید حذف گزارش ${deletingReport && getPersonnelName(deletingReport.personnel_id)}`}>
                            {isSubmitting ? 'در حال حذف...' : 'بله، حذف کن'}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default Reports;
