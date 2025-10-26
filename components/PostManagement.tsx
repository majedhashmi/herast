
import React, { useState } from 'react';
import type { Post, NewRecord } from '../types';
import Modal from './Modal';
import { useToast } from './Toast';
import { PlusIcon, EditIcon, DeleteIcon, FolderOpenIcon, ExclamationTriangleIcon } from './Icons';
import { useData } from './DataContext';
import { useAuth } from './AuthContext';

const SkeletonRow: React.FC = () => (
    <tr className="border-b border-gray-200 dark:border-slate-700">
        <td className="p-4"><div className="h-5 w-8 skeleton-loader"></div></td>
        <td className="p-4"><div className="h-5 w-32 skeleton-loader"></div></td>
        <td className="p-4"><div className="h-5 w-24 skeleton-loader"></div></td>
        <td className="p-4"><div className="h-5 w-16 skeleton-loader"></div></td>
        <td className="p-4"><div className="flex gap-2"><div className="h-7 w-7 rounded-full skeleton-loader"></div><div className="h-7 w-7 rounded-full skeleton-loader"></div></div></td>
    </tr>
);


const PostManagement: React.FC = () => {
  const { posts, addPost, updatePost, deletePost, loading } = useData();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [deletingPost, setDeletingPost] = useState<Post | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getPriorityClass = (priority: 'عادی' | 'مهم' | 'حیاتی') => {
    switch (priority) {
      case 'حیاتی': return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300';
      case 'مهم': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300';
      case 'عادی': return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-300';
    }
  };

  const handleAddPost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const newPost: NewRecord<Post> = {
      name: formData.get('name') as string,
      location: formData.get('location') as string,
      priority: formData.get('priority') as 'عادی' | 'مهم' | 'حیاتی',
      notes: formData.get('notes') as string,
    };
    try {
        await addPost(newPost);
        setIsAddModalOpen(false);
        showToast('پست جدید با موفقیت افزوده شد.', 'success');
    } catch(error: any) {
        showToast(`خطا در افزودن پست: ${error.message}`, 'error');
    } finally {
        setIsSubmitting(false);
    }
  };

  const openEditModal = (post: Post) => {
    setEditingPost(post);
    setIsEditModalOpen(true);
  };
  
  const handleUpdatePost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPost) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const updatedData: Partial<Post> = {
        name: formData.get('name') as string,
        location: formData.get('location') as string,
        priority: formData.get('priority') as 'عادی' | 'مهم' | 'حیاتی',
        notes: formData.get('notes') as string,
    };
    
    try {
        await updatePost(editingPost.id, updatedData);
        setIsEditModalOpen(false);
        setEditingPost(null);
        showToast('پست با موفقیت به‌روزرسانی شد.', 'success');
    } catch(error: any) {
        showToast(`خطا در به‌روزرسانی پست: ${error.message}`, 'error');
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const openDeleteModal = (post: Post) => {
    setDeletingPost(post);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingPost) return;
    setIsSubmitting(true);
    try {
        await deletePost(deletingPost.id);
        setIsDeleteModalOpen(false);
        setDeletingPost(null);
        showToast('پست با موفقیت حذف شد.', 'success');
    } catch(error: any) {
        showToast(`خطا در حذف پست: ${error.message}`, 'error');
    } finally {
        setIsSubmitting(false);
    }
  };

  const canManage = user?.role === 'مدیر' || user?.role === 'سرشیفت';

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-2xl font-bold">مدیریت پست‌ها</h2>
          {canManage && (
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm hover:shadow-md"
              aria-label="افزودن پست جدید"
            >
              <PlusIcon className="w-5 h-5" />
              <span>افزودن پست جدید</span>
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-x-auto shadow-sm">
          <table className="w-full min-w-max text-right">
            <thead className="border-b border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 dark:backdrop-blur-sm sticky top-0 z-10">
              <tr>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 w-16">#</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">نام پست</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">مکان</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">اهمیت</th>
                {canManage && <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">عملیات</th>}
              </tr>
            </thead>
            <tbody className="animate-stagger-in">
              {loading ? (
                  Array.from({length: 4}).map((_, i) => <SkeletonRow key={i} />)
              ) : posts.length > 0 ? posts.map((post, index) => (
                <tr key={post.id} className="border-b border-gray-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60" style={{ animationDelay: `${index * 50}ms` }}>
                  <td className="p-4">{index + 1}</td>
                  <td className="p-4 font-medium">{post.name}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">{post.location}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityClass(post.priority)}`}>
                      {post.priority}
                    </span>
                  </td>
                  {canManage && (
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                          <button onClick={() => openEditModal(post)} className="p-1.5 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400" title="ویرایش" aria-label={`ویرایش پست ${post.name}`}>
                              <EditIcon className="w-5 h-5" />
                          </button>
                          <button onClick={() => openDeleteModal(post)} className="p-1.5 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600 hover:text-red-500 dark:hover:text-red-400" title="حذف" aria-label={`حذف پست ${post.name}`}>
                              <DeleteIcon className="w-5 h-5" />
                          </button>
                      </div>
                    </td>
                  )}
                </tr>
              )) : (
                <tr>
                    <td colSpan={canManage ? 5 : 4} className="text-center p-16">
                      <div className="flex flex-col items-center gap-4 text-gray-500 dark:text-gray-400">
                        <FolderOpenIcon className="w-16 h-16 text-gray-300 dark:text-gray-600" aria-hidden="true"/>
                        <h3 className="text-lg font-medium">هیچ پستی ثبت نشده است</h3>
                        {canManage && <p className="text-sm">برای شروع، یک پست جدید از دکمه بالا اضافه کنید.</p>}
                      </div>
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal title="افزودن پست جدید" isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
        <form onSubmit={handleAddPost} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="add-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نام پست</label>
              <input 
                type="text" 
                name="name" 
                id="add-name" 
                required 
                minLength={3}
                className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500"
                aria-label="نام پست جدید"
              />
            </div>
            <div>
              <label htmlFor="add-location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">مکان</label>
              <input 
                type="text" 
                name="location" 
                id="add-location" 
                required 
                className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500"
                aria-label="مکان پست"
              />
            </div>
          </div>
          <div>
            <label htmlFor="add-priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اهمیت</label>
            <select name="priority" id="add-priority" required className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500" aria-label="سطح اهمیت پست">
              <option value="عادی">عادی</option>
              <option value="مهم">مهم</option>
              <option value="حیاتی">حیاتی</option>
            </select>
          </div>
           <div>
            <label htmlFor="add-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">یادداشت‌ها (اختیاری)</label>
            <textarea 
              name="notes" 
              id="add-notes" 
              rows={3}
              placeholder="دستورالعمل‌های خاص یا تجهیزات مورد نیاز..."
              className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500"
              aria-label="یادداشت‌های مربوط به پست"
            ></textarea>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600" aria-label="انصراف از افزودن پست">انصراف</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-500/50" aria-label="ذخیره پست جدید">
              {isSubmitting ? 'در حال ذخیره...' : 'ذخیره'}
            </button>
          </div>
        </form>
      </Modal>

      {editingPost && (
        <Modal title="ویرایش پست" isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
            <form onSubmit={handleUpdatePost} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نام پست</label>
                  <input 
                    type="text" 
                    name="name" 
                    id="edit-name" 
                    defaultValue={editingPost.name} 
                    required 
                    minLength={3}
                    className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500"
                    aria-label="نام پست"
                  />
                </div>
                <div>
                  <label htmlFor="edit-location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">مکان</label>
                  <input 
                    type="text" 
                    name="location" 
                    id="edit-location" 
                    defaultValue={editingPost.location}
                    required 
                    className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500"
                    aria-label="مکان پست"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="edit-priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اهمیت</label>
                <select name="priority" id="edit-priority" defaultValue={editingPost.priority} required className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500" aria-label="سطح اهمیت پست">
                  <option value="عادی">عادی</option>
                  <option value="مهم">مهم</option>
                  <option value="حیاتی">حیاتی</option>
                </select>
              </div>
              <div>
                <label htmlFor="edit-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">یادداشت‌ها (اختیاری)</label>
                <textarea 
                  name="notes" 
                  id="edit-notes" 
                  rows={3}
                  defaultValue={editingPost.notes}
                  placeholder="دستورالعمل‌های خاص یا تجهیزات مورد نیاز..."
                  className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500"
                  aria-label="یادداشت‌های مربوط به پست"
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600" aria-label="انصراف از ویرایش پست">انصراف</button>
                  <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-500/50" aria-label="به‌روزرسانی پست">
                    {isSubmitting ? 'در حال به‌روزرسانی...' : 'به‌روزرسانی'}
                  </button>
              </div>
            </form>
        </Modal>
      )}

    <Modal title="اخطار: حذف پست" isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <div className="flex flex-col items-center text-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mb-4" aria-hidden="true"/>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
                آیا از حذف پست "<span className="font-semibold">{deletingPost?.name}</span>" مطمئن هستید؟
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
                این عمل
                <span className="font-semibold text-red-600 dark:text-red-400 mx-1">غیرقابل بازگشت</span>
                است و ممکن است بر شیفت‌های ثبت شده تاثیر بگذارد.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-8 w-full">
                <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="px-6 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 w-full sm:w-auto order-2 sm:order-1" aria-label="انصراف از حذف پست">انصراف</button>
                <button type="button" onClick={handleConfirmDelete} disabled={isSubmitting} className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 dark:disabled:bg-red-500/50 w-full sm:w-auto order-1 sm:order-2" aria-label={`تایید حذف پست ${deletingPost?.name}`}>
                    {isSubmitting ? 'در حال حذف...' : 'بله، حذف کن'}
                </button>
            </div>
        </div>
    </Modal>
    </>
  );
};

export default PostManagement;
