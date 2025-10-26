
import React, { useState, useEffect } from 'react';
import type { Personnel, NewRecord } from '../types';
import Modal from './Modal';
import { useToast } from './Toast';
import { PlusIcon, EditIcon, DeleteIcon, FolderOpenIcon, ExclamationTriangleIcon } from './Icons';
import { useData } from './DataContext';
import { useAuth } from './AuthContext';

const SkeletonRow: React.FC = () => (
    <tr className="border-b border-gray-200 dark:border-slate-700">
        <td className="p-4"><div className="h-5 w-16 skeleton-loader"></div></td>
        <td className="p-4"><div className="h-5 w-32 skeleton-loader"></div></td>
        <td className="p-4"><div className="h-5 w-20 skeleton-loader"></div></td>
        <td className="p-4"><div className="h-5 w-24 skeleton-loader"></div></td>
        <td className="p-4"><div className="h-5 w-20 skeleton-loader"></div></td>
        <td className="p-4"><div className="flex gap-2"><div className="h-7 w-7 rounded-full skeleton-loader"></div><div className="h-7 w-7 rounded-full skeleton-loader"></div></div></td>
    </tr>
);

const PersonnelManagement: React.FC = () => {
  const { personnel, addPersonnel, updatePersonnel, deletePersonnel, loading } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [editingPerson, setEditingPerson] = useState<Personnel | null>(null);
  const [deletingPerson, setDeletingPerson] = useState<Personnel | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredPersonnel = personnel.filter(p =>
    `${p.name} ${p.family}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusClass = (status: 'فعال' | 'مرخصی' | 'غیرفعال') => {
    switch (status) {
      case 'فعال': return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300';
      case 'مرخصی': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300';
      case 'غیرفعال': return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300';
    }
  };

  const handleAddPersonnel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const newPerson: NewRecord<Personnel> = {
      name: formData.get('name') as string,
      family: formData.get('family') as string,
      code: formData.get('code') as string,
      phone: formData.get('phone') as string,
      role: formData.get('role') as 'نگهبان' | 'سرشیفت' | 'مدیر',
      status: 'فعال',
    };
    try {
        await addPersonnel(newPerson);
        setIsAddModalOpen(false);
        showToast('نیروی جدید با موفقیت افزوده شد.', 'success');
    } catch (error: any) {
        showToast(`خطا در افزودن نیرو: ${error.message}`, 'error');
    } finally {
        setIsSubmitting(false);
    }
  };

  const openEditModal = (person: Personnel) => {
    setEditingPerson(person);
    setIsEditModalOpen(true);
  };
  
  const handleUpdatePersonnel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPerson) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const updatedData: Partial<Personnel> = {
        name: formData.get('name') as string,
        family: formData.get('family') as string,
        code: formData.get('code') as string,
        phone: formData.get('phone') as string,
        role: formData.get('role') as 'نگهبان' | 'سرشیفت' | 'مدیر',
    };
    try {
        await updatePersonnel(editingPerson.id, updatedData);
        setIsEditModalOpen(false);
        setEditingPerson(null);
        showToast('اطلاعات نیرو با موفقیت به‌روزرسانی شد.', 'success');
    } catch(error: any) {
        showToast(`خطا در به‌روزرسانی: ${error.message}`, 'error');
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const openDeleteModal = (person: Personnel) => {
    setDeletingPerson(person);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingPerson) return;
    setIsSubmitting(true);
    try {
        await deletePersonnel(deletingPerson.id);
        setIsDeleteModalOpen(false);
        setDeletingPerson(null);
        showToast('نیرو با موفقیت حذف شد.', 'success');
    } catch(error: any) {
        showToast(`خطا در حذف نیرو: ${error.message}`, 'error');
    } finally {
        setIsSubmitting(false);
    }
  }

  const canManage = user?.role === 'مدیر';

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-2xl font-bold">مدیریت پرسنل</h2>
          <div className="w-full md:w-auto flex gap-2">
            <input
                type="text"
                placeholder="جستجو (نام، کد پرسنلی...)"
                className="w-full md:w-64 p-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="جستجو در لیست پرسنل"
              />
            {canManage && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shrink-0 flex items-center gap-2 shadow-sm hover:shadow-md"
                aria-label="افزودن نیروی جدید"
              >
                <PlusIcon className="w-5 h-5" />
                <span>افزودن نیرو</span>
              </button>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-x-auto shadow-sm">
          <table className="w-full min-w-max text-right">
            <thead className="border-b border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 dark:backdrop-blur-sm sticky top-0 z-10">
              <tr>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">کد پرسنلی</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">نام و نام خانوادگی</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">سمت</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">شماره تماس</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">وضعیت</th>
                {canManage && <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">عملیات</th>}
              </tr>
            </thead>
            <tbody className="animate-stagger-in">
              {loading ? (
                  Array.from({length: 5}).map((_, i) => <SkeletonRow key={i} />)
              ) : filteredPersonnel.length > 0 ? filteredPersonnel.map((person, index) => (
                <tr key={person.id} className="border-b border-gray-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60" style={{ animationDelay: `${index * 50}ms` }}>
                  <td className="p-4">{person.code}</td>
                  <td className="p-4 font-medium">{person.name} {person.family}</td>
                  <td className="p-4">{person.role}</td>
                  <td className="p-4" style={{direction: 'ltr', textAlign: 'right'}}>{person.phone}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(person.status)}`}>
                      {person.status}
                    </span>
                  </td>
                  {canManage && (
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditModal(person)} className="p-1.5 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400" title="ویرایش" aria-label={`ویرایش اطلاعات ${person.name} ${person.family}`}>
                            <EditIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => openDeleteModal(person)} className="p-1.5 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600 hover:text-red-500 dark:hover:text-red-400" title="حذف" aria-label={`حذف ${person.name} ${person.family}`}>
                            <DeleteIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )) : (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="text-center p-16">
                    <div className="flex flex-col items-center gap-4 text-gray-500 dark:text-gray-400">
                      <FolderOpenIcon className="w-16 h-16 text-gray-300 dark:text-gray-600" />
                      <h3 className="text-lg font-medium">هیچ پرسنلی یافت نشد</h3>
                      {canManage && <p className="text-sm">برای شروع، یک نیروی جدید از دکمه بالا اضافه کنید.</p>}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Add Modal */}
      <Modal title="افزودن نیروی جدید" isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
        <form onSubmit={handleAddPersonnel} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="add-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نام</label>
              <input type="text" name="name" id="add-name" required className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500" aria-label="نام پرسنل"/>
            </div>
            <div>
              <label htmlFor="add-family" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نام خانوادگی</label>
              <input type="text" name="family" id="add-family" required className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500" aria-label="نام خانوادگی پرسنل"/>
            </div>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="add-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">کد پرسنلی</label>
              <input 
                type="text" 
                name="code" 
                id="add-code" 
                required 
                minLength={4}
                maxLength={10}
                pattern="[A-Za-z0-9]+"
                title="کد پرسنلی باید حداقل 4 و حداکثر 10 کاراکتر و شامل حروف و اعداد انگلیسی باشد."
                className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500" 
                aria-label="کد پرسنلی"/>
            </div>
            <div>
              <label htmlFor="add-phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">شماره تماس</label>
              <input 
                type="tel" 
                name="phone" 
                id="add-phone" 
                required 
                minLength={11}
                maxLength={11}
                pattern="09[0-9]{9}"
                title="شماره تماس باید با 09 شروع شود و 11 رقم باشد."
                className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500" 
                aria-label="شماره تماس پرسنل"/>
            </div>
          </div>
          <div>
            <label htmlFor="add-role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">سمت</label>
            <select name="role" id="add-role" required className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500" aria-label="سمت پرسنل">
              <option value="نگهبان">نگهبان</option>
              <option value="سرشیفت">سرشیفت</option>
              <option value="مدیر">مدیر</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600" aria-label="انصراف از افزودن نیرو">انصراف</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-500/50" aria-label="ذخیره نیروی جدید">
              {isSubmitting ? 'در حال ذخیره...' : 'ذخیره'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      {editingPerson && (
        <Modal title="ویرایش اطلاعات نیرو" isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
            <form onSubmit={handleUpdatePersonnel} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نام</label>
                <input type="text" name="name" id="edit-name" defaultValue={editingPerson.name} required className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500" aria-label="نام پرسنل"/>
                </div>
                <div>
                <label htmlFor="edit-family" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نام خانوادگی</label>
                <input type="text" name="family" id="edit-family" defaultValue={editingPerson.family} required className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500" aria-label="نام خانوادگی پرسنل"/>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <label htmlFor="edit-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">کد پرسنلی</label>
                <input 
                  type="text" 
                  name="code" 
                  id="edit-code" 
                  defaultValue={editingPerson.code} 
                  required 
                  minLength={4} 
                  maxLength={10} 
                  pattern="[A-Za-z0-9]+" 
                  title="کد پرسنلی باید حداقل 4 و حداکثر 10 کاراکتر و شامل حروف و اعداد انگلیسی باشد."
                  className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500" 
                  aria-label="کد پرسنلی"/>
                </div>
                <div>
                <label htmlFor="edit-phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">شماره تماس</label>
                <input 
                  type="tel" 
                  name="phone" 
                  id="edit-phone" 
                  defaultValue={editingPerson.phone} 
                  required 
                  minLength={11} 
                  maxLength={11} 
                  pattern="09[0-9]{9}" 
                  title="شماره تماس باید با 09 شروع شود و 11 رقم باشد."
                  className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500" 
                  aria-label="شماره تماس پرسنل"/>
                </div>
            </div>
            <div>
                <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">سمت</label>
                <select name="role" id="edit-role" defaultValue={editingPerson.role} required className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500" aria-label="سمت پرسنل">
                <option value="نگهبان">نگهبان</option>
                <option value="سرشیفت">سرشیفت</option>
                <option value="مدیر">مدیر</option>
                </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600" aria-label="انصراف از ویرایش نیرو">انصراف</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-500/50" aria-label="به‌روزرسانی اطلاعات نیرو">
                    {isSubmitting ? 'در حال به‌روزرسانی...' : 'به‌روزرسانی'}
                </button>
            </div>
            </form>
        </Modal>
      )}

    {/* Delete Modal */}
    <Modal title="تایید حذف نیرو" isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <div className="flex flex-col items-center text-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
                آیا از حذف
                <span className="font-bold mx-1">{deletingPerson?.name} {deletingPerson?.family}</span>
                از لیست پرسنل مطمئن هستید؟
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
                این عمل
                <span className="font-semibold text-red-600 dark:text-red-400 mx-1">غیرقابل بازگشت</span>
                است و تمام اطلاعات مربوط به این پرسنل حذف خواهد شد.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-8 w-full">
                <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="px-6 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 w-full sm:w-auto order-2 sm:order-1" aria-label="انصراف از حذف">انصراف</button>
                <button type="button" onClick={handleConfirmDelete} disabled={isSubmitting} className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 dark:disabled:bg-red-500/50 w-full sm:w-auto order-1 sm:order-2" aria-label={`تایید حذف ${deletingPerson?.name} ${deletingPerson?.family}`}>
                    {isSubmitting ? 'در حال حذف...' : 'بله، حذف کن'}
                </button>
            </div>
        </div>
    </Modal>
    </>
  );
};

export default PersonnelManagement;
