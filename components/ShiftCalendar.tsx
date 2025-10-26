
import React, { useState, useEffect, useMemo } from 'react';
import type { Personnel, Shift, Post, LeaveRequest, GeneratedShift, AiGeneratedResponse, NewRecord } from '../types';
import { PlusIcon, EditIcon, DeleteIcon, FilterIcon, ExclamationTriangleIcon } from './Icons';
import Modal from './Modal';
import { getJalaliDate, getDaysInJalaliMonth, getFirstDayOfMonth, jalaliMonthNames, formatJalaliDate, jalaliToGregorian, addDaysJalali, toPersianDigits } from '../utils/jalali';
import { useToast } from './Toast';
import { GoogleGenAI, Type } from "@google/genai";
import JalaliDatePicker from './JalaliDatePicker';
import { useData } from './DataContext'; // New: Import useData hook

const weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

// New component for AI Shift Generation Modal
interface ShiftGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (generatedShifts: GeneratedShift[], summary: string) => void;
    allPersonnel: Personnel[];
    allPosts: Post[];
    currentShifts: Shift[];
    leaveRequests: LeaveRequest[];
}

const ShiftGenerationModal: React.FC<ShiftGenerationModalProps> = ({
    isOpen,
    onClose,
    onGenerate,
    allPersonnel,
    allPosts,
    currentShifts,
    leaveRequests,
}) => {
    const { showToast } = useToast();
    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);
    const [additionalInstructions, setAdditionalInstructions] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedShiftsResponse, setGeneratedShiftsResponse] = useState<AiGeneratedResponse | null>(null);
    const [aiError, setAiError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            // Reset state when modal closes
            setStartDate(null);
            setEndDate(null);
            setAdditionalInstructions('');
            setIsGenerating(false);
            setGeneratedShiftsResponse(null);
            setAiError(null);
        }
    }, [isOpen]);

    const handleSelectStartDate = (date: string | null) => {
        setStartDate(date);
        // If start date changes and is after current end date, clear end date
        if (date && endDate) {
            const [sY, sM, sD] = date.split('/').map(Number);
            const [eY, eM, eD] = endDate.split('/').map(Number);
            const gregorianStartDate = new Date(...jalaliToGregorian(sY, sM, sD));
            const gregorianEndDate = new Date(...jalaliToGregorian(eY, eM, eD));
            
            if (gregorianStartDate > gregorianEndDate) {
                setEndDate(null);
            }
        }
    };

    const handleGenerateShifts = async () => {
        if (!startDate || !endDate) {
            showToast('لطفاً محدوده تاریخ را کامل کنید.', 'error');
            return;
        }

        setIsGenerating(true);
        setAiError(null);
        setGeneratedShiftsResponse(null);

        try {
            // Check for API key and prompt if not selected
            if (!(await window.aistudio.hasSelectedApiKey())) {
                await window.aistudio.openSelectKey();
                // Assume key selection was successful, but ideally, re-check or handle user cancellation.
                // For simplicity, we proceed assuming it's available after the call.
            }

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const formattedPersonnel = allPersonnel.map(p => ({
                id: p.id,
                name: `${p.name} ${p.family}`,
                status: p.status,
                role: p.role,
            }));
            const formattedPosts = allPosts.map(p => ({ id: p.id, name: p.name, location: p.location, priority: p.priority, notes: p.notes }));

            // fix: Corrected property names to snake_case to align with type definitions.
            const prompt = `شما یک برنامه ریز شیفت هوشمند برای پرسنل حراست هستید.
            با در نظر گرفتن پرسنل زیر:
            ${JSON.stringify(formattedPersonnel)}
            و پست‌های زیر با جزئیات کامل:
            ${JSON.stringify(formattedPosts)}
            و شیفت‌های موجود (برای جلوگیری از تداخل):
            ${JSON.stringify(currentShifts.map(s => ({ date: s.date, personnelId: s.personnel_id, postId: s.post_id, type: s.type })))}
            و درخواست‌های مرخصی تایید شده:
            ${JSON.stringify(leaveRequests.filter(lr => lr.status === 'تایید شده').map(lr => ({ personnelId: lr.personnel_id, startDate: lr.start_date, endDate: lr.end_date })))}
            
            یک برنامه شیفت پیشنهادی برای هر روز از ${startDate} تا ${endDate} تولید کنید.
            هر شیفت باید شامل 'date' (فرمت شمسی YYYY/MM/DD)، 'type' ('روز' یا 'شب')، 'personnelName' (نام کامل از لیست پرسنل)، و 'postName' (نام پست از لیست پست‌ها) باشد.
            اطمینان حاصل کنید که هر شیفت به پرسنل در دسترس (نه 'مرخصی' و نه 'غیرفعال' در آن تاریخ خاص) اختصاص داده شود.
            به اولویت پست‌ها توجه کن (پست‌های حیاتی مهم‌تر هستند).
            اگر پرسنلی در تاریخ خاصی در مرخصی تایید شده باشد، نباید برای آن تاریخ شیفت داده شود.
            اگر پرسنلی 'غیرفعال' است، نباید شیفت داده شود.
            ${additionalInstructions ? `علاوه بر این، این دستورالعمل‌ها را در نظر بگیرید: ${additionalInstructions}` : ''}
            لطفاً خروجی را به صورت یک شی JSON شامل یک آرایه از شیفت‌ها و یک خلاصه متنی ارائه دهید.
            `;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-pro",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            shifts: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        date: { type: Type.STRING, description: 'Jalali date in YYYY/MM/DD format' },
                                        type: { type: Type.STRING, enum: ['روز', 'شب'] },
                                        personnelName: { type: Type.STRING, description: 'Full name of the personnel' },
                                        postName: { type: Type.STRING, description: 'Name of the post' },
                                    },
                                    required: ['date', 'type', 'personnelName', 'postName'],
                                },
                            },
                            summary: { type: Type.STRING, description: 'A brief summary of the generated shift plan.' }
                        },
                        required: ['shifts', 'summary']
                    },
                    thinkingConfig: { thinkingBudget: 1024 }
                },
            });

            const jsonStr = response.text.trim();
            const parsedResponse: AiGeneratedResponse = JSON.parse(jsonStr);
            setGeneratedShiftsResponse(parsedResponse);
            showToast('شیفت‌های پیشنهادی با موفقیت تولید شد.', 'success');

        } catch (error: any) {
            console.error('Error generating shifts:', error);
            let errorMessage = 'خطا در تولید شیفت: ';
            if (error.message.includes("Requested entity was not found.")) {
                errorMessage += "کلید API انتخاب نشده یا نامعتبر است. لطفاً کلید API را مجدداً انتخاب کنید.";
                await window.aistudio.openSelectKey(); // Prompt user to select API key again
            } else if (error.message) {
                errorMessage += error.message;
            } else {
                errorMessage += "مشکل ناشناخته‌ای رخ داد.";
            }
            setAiError(errorMessage);
            showToast(errorMessage, 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleApproveShifts = () => {
        if (generatedShiftsResponse) {
            onGenerate(generatedShiftsResponse.shifts, generatedShiftsResponse.summary);
            onClose();
        }
    };

    // UI for inputting generation parameters
    const renderInputForm = () => (
        <form onSubmit={(e) => { e.preventDefault(); handleGenerateShifts(); }} className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
                محدوده تاریخ را برای تولید شیفت‌های هوشمند انتخاب کنید و در صورت نیاز، دستورالعمل‌های اضافی را وارد نمایید.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="ai-start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاریخ شروع</label>
                    <JalaliDatePicker
                        id="ai-start-date"
                        selectedDate={startDate}
                        onSelectDate={handleSelectStartDate}
                        highlightRangeWith={endDate}
                        aria-label="تاریخ شروع تولید شیفت"
                    />
                </div>
                <div>
                    <label htmlFor="ai-end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاریخ پایان</label>
                    <JalaliDatePicker
                        id="ai-end-date"
                        selectedDate={endDate}
                        onSelectDate={setEndDate}
                        minDate={startDate}
                        highlightRangeWith={startDate}
                        aria-label="تاریخ پایان تولید شیفت"
                    />
                </div>
            </div>
            <div>
                <label htmlFor="ai-instructions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">دستورالعمل‌های اضافی (اختیاری)</label>
                <textarea
                    id="ai-instructions"
                    rows={4}
                    className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={additionalInstructions}
                    onChange={(e) => setAdditionalInstructions(e.target.value)}
                    placeholder="مثال: علی رضایی فقط شیفت روز داشته باشد، هر شیفت شب حداقل دو نگهبان..."
                    aria-label="دستورالعمل‌های اضافی برای تولید شیفت"
                ></textarea>
            </div>
            {aiError && (
                <div className="text-red-500 text-sm mt-2 flex items-center gap-2" role="alert">
                    <ExclamationTriangleIcon className="w-5 h-5" />
                    <span>{aiError}</span>
                </div>
            )}
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600" aria-label="انصراف از تولید شیفت">انصراف</button>
                <button
                    type="submit"
                    disabled={isGenerating || !startDate || !endDate}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-500/50 flex items-center gap-2"
                    aria-label="تولید شیفت با هوش مصنوعی"
                >
                    {isGenerating ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>در حال تولید...</span>
                        </>
                    ) : (
                        <span>تولید شیفت</span>
                    )}
                </button>
            </div>
        </form>
    );

    // UI for reviewing generated shifts
    const renderReviewForm = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">شیفت‌های پیشنهادی:</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm italic">{generatedShiftsResponse?.summary}</p>
            {generatedShiftsResponse && generatedShiftsResponse.shifts.length > 0 ? (
                <div className="max-h-80 overflow-y-auto border border-gray-200 dark:border-slate-700 rounded-lg">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 dark:bg-slate-700/50 sticky top-0">
                            <tr>
                                <th className="p-2 font-semibold text-gray-600 dark:text-gray-300">تاریخ</th>
                                <th className="p-2 font-semibold text-gray-600 dark:text-gray-300">پرسنل</th>
                                <th className="p-2 font-semibold text-gray-600 dark:text-gray-300">پست</th>
                                <th className="p-2 font-semibold text-gray-600 dark:text-gray-300">نوع</th>
                            </tr>
                        </thead>
                        <tbody>
                            {generatedShiftsResponse.shifts.map((shift, index) => (
                                <tr key={index} className="border-b border-gray-100 dark:border-slate-700/70 last:border-b-0 hover:bg-gray-50 dark:hover:bg-slate-700/40">
                                    <td className="p-2">{formatJalaliDate(shift.date)}</td>
                                    <td className="p-2">{shift.personnelName}</td>
                                    <td className="p-2">{shift.postName}</td>
                                    <td className="p-2">
                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${shift.type === 'روز' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300' : 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300'}`}>
                                            {shift.type}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">هیچ شیفتی تولید نشد.</p>
            )}
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600" aria-label="لغو و بستن">لغو</button>
                <button
                    type="button"
                    onClick={handleApproveShifts}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    disabled={!generatedShiftsResponse?.shifts.length}
                    aria-label="تایید و افزودن شیفت‌ها به تقویم"
                >
                    تایید و افزودن به تقویم
                </button>
            </div>
        </div>
    );

    return (
        <Modal
            title={generatedShiftsResponse ? "بازبینی شیفت‌های پیشنهادی" : "تولید شیفت هوشمند با AI"}
            isOpen={isOpen}
            onClose={onClose}
        >
            {generatedShiftsResponse ? renderReviewForm() : renderInputForm()}
        </Modal>
    );
};


const ShiftCalendar: React.FC = () => {
  // fix: Refactored to use mutation functions from DataContext instead of a non-existent `setShifts`.
  const { personnel, posts, shifts, leaveRequests, addShift, addMultipleShifts, updateShift, deleteShift } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const { showToast } = useToast();
  
  // Filter states
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<string>('all');
  const [selectedPostId, setSelectedPostId] = useState<string>('all');
  const [selectedShiftType, setSelectedShiftType] = useState<string>('all');

  const { year: currentYear, month: currentMonth } = getJalaliDate(currentDate);
  const { year: todayYear, month: todayMonth, day: todayDay } = getJalaliDate(new Date());


  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState<{year: number, month: number, day: number} | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingShift, setDeletingShift] = useState<Shift | null>(null);
  
  const [calendarGrid, setCalendarGrid] = useState<number[]>([]);
  const [firstDay, setFirstDay] = useState(0);

  // State for shift conflict in Add/Edit modals
  const [shiftConflictWarning, setShiftConflictWarning] = useState<string | null>(null);

  // New state for AI generation modal
  const [isShiftGenerationModalOpen, setIsShiftGenerationModalOpen] = useState(false);

  // New state for recurring shifts checkbox
  const [generateRecurring, setGenerateRecurring] = useState(false);


  const filteredShifts = useMemo(() => {
    return shifts.filter(shift => {
        // fix: Changed personnelId and postId to personnel_id and post_id to match type definitions.
        const personnelMatch = selectedPersonnelId === 'all' || shift.personnel_id === Number(selectedPersonnelId);
        const postMatch = selectedPostId === 'all' || shift.post_id === Number(selectedPostId);
        const typeMatch = selectedShiftType === 'all' || shift.type === selectedShiftType;
        return personnelMatch && postMatch && typeMatch;
    });
  }, [shifts, selectedPersonnelId, selectedPostId, selectedShiftType]);

  useEffect(() => {
    const daysInMonth = getDaysInJalaliMonth(currentYear, currentMonth);
    setCalendarGrid(Array.from({ length: daysInMonth }, (_, i) => i + 1));
    setFirstDay(getFirstDayOfMonth(currentYear, currentMonth));
  }, [currentYear, currentMonth]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getPersonnelName = (id: number) => {
      const p = personnel.find(p => p.id === id);
      return p ? `${p.name} ${p.family}` : 'نامشخص';
  }

  const isPersonnelUnavailable = (personnelId: number, dateStr: string, editingShiftId: number | null = null, shiftsToCheck: Shift[] = shifts): string | null => {
    const person = personnel.find(p => p.id === personnelId);
    if (!person) return 'پرسنل یافت نشد.';

    if (person.status === 'غیرفعال') {
        return `${person.name} ${person.family} غیرفعال است و نمی‌تواند شیفت داشته باشد.`;
    }

    // fix: Changed property names to snake_case to match type definitions.
    const onLeave = leaveRequests.some(req => 
      req.personnel_id === personnelId &&
      req.status === 'تایید شده' &&
      dateStr >= req.start_date &&
      dateStr <= req.end_date
    );
    if (onLeave) {
        return `${person.name} ${person.family} در این تاریخ در مرخصی است.`;
    }

    // Check for existing shifts for the same personnel on the same day, excluding the one being edited
    // fix: Changed personnelId to personnel_id to match type definition.
    const hasExistingShift = shiftsToCheck.some(s => s.id !== editingShiftId && s.personnel_id === personnelId && s.date === dateStr);
    if (hasExistingShift) {
        return `${person.name} ${person.family} در این تاریخ قبلاً شیفت دارد.`;
    }

    return null;
  };

  const getShiftsForDay = (day: number) => {
    const dateStr = `${currentYear}/${String(currentMonth).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    return filteredShifts.filter(s => s.date === dateStr);
  };
  
  const getDayStatus = (day: number) => {
    const dateStr = `${currentYear}/${String(currentMonth).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    const dayShifts = filteredShifts.filter(s => s.date === dateStr);

    let hasConflict = false;
    // fix: Changed personnelId to personnel_id to match type definition.
    const personnelIdsOnThisDay = dayShifts.map(s => s.personnel_id);
    if (new Set(personnelIdsOnThisDay).size !== personnelIdsOnThisDay.length) {
        hasConflict = true;
    }

    const personnelWithStatus = dayShifts.map(shift => {
      // fix: Changed personnelId to personnel_id to match type definition.
      const person = personnel.find(p => p.id === shift.personnel_id);
      if (!person) {
        return { name: 'نامشخص', status: 'نامشخص' };
      }
      
      // fix: Changed property names to snake_case to match type definitions.
      const isOnLeave = leaveRequests.some(req => 
        req.personnel_id === person.id &&
        req.status === 'تایید شده' &&
        dateStr >= req.start_date &&
        dateStr <= req.end_date
      );

      type StatusWithMessage = 'فعال' | 'مرخصی' | 'غیرفعال' | 'تداخل شیفت';
      let currentStatus: StatusWithMessage = person.status as StatusWithMessage;
      
      if(personnelIdsOnThisDay.filter(id => id === person.id).length > 1) {
        currentStatus = 'تداخل شیفت';
        hasConflict = true;
      } else if (isOnLeave) {
        currentStatus = 'مرخصی';
        hasConflict = true;
      } else if (person.status === 'غیرفعال') {
        currentStatus = 'غیرفعال';
        hasConflict = true;
      }
      
      return {
        name: `${person.name} ${person.family}`,
        status: currentStatus,
      };
    });

    return { personnelWithStatus, hasConflict };
  };

  const handleOpenAddModal = (day: number) => {
    setSelectedDateForModal({ year: currentYear, month: currentMonth, day });
    setIsAddModalOpen(true);
    setShiftConflictWarning(null); // Reset warning
    setGenerateRecurring(false); // Reset recurring checkbox
  };

  const handlePersonnelChangeInModal = (e: React.ChangeEvent<HTMLSelectElement>, date: string, editingShiftId: number | null = null) => {
    const personnelId = Number(e.target.value);
    const conflict = isPersonnelUnavailable(personnelId, date, editingShiftId);
    setShiftConflictWarning(conflict);
  };

  // fix: Refactored logic to be safer and avoid type issues.
  const generateRecurringShiftsLogic = (initialShift: NewRecord<Shift>) => {
    const DURATION_IN_DAYS = 90;
    const cycle = ['روز', 'روز', 'روز', 'شب', 'شب', 'شب', 'استراحت', 'استراحت', 'استراحت'];
    const startIndex = initialShift.type === 'روز' ? 0 : 3;

    const newlyGeneratedShifts: NewRecord<Shift>[] = [];

    for (let i = 1; i <= DURATION_IN_DAYS; i++) {
        const currentDateStr = addDaysJalali(initialShift.date, i);
        const cycleIndex = (startIndex + i) % cycle.length;
        const shiftTypeForDay = cycle[cycleIndex];

        if (shiftTypeForDay !== 'استراحت') {
            const conflictWithExisting = isPersonnelUnavailable(initialShift.personnel_id, currentDateStr, null, shifts);
            const conflictWithNew = newlyGeneratedShifts.some(s => s.personnel_id === initialShift.personnel_id && s.date === currentDateStr);

            if (!conflictWithExisting && !conflictWithNew) {
                const recurringShift: NewRecord<Shift> = {
                    date: currentDateStr,
                    personnel_id: initialShift.personnel_id,
                    post_id: initialShift.post_id,
                    type: shiftTypeForDay as 'روز' | 'شب',
                };
                newlyGeneratedShifts.push(recurringShift);
            }
        }
    }
    return newlyGeneratedShifts;
  };

  // fix: Refactored to use `addShift` and `addMultipleShifts` from context.
  const handleAddShift = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDateForModal) return;
    const formData = new FormData(e.currentTarget);
    
    const newShiftDate = `${selectedDateForModal.year}/${String(selectedDateForModal.month).padStart(2, '0')}/${String(selectedDateForModal.day).padStart(2, '0')}`;
    const personnelId = Number(formData.get('personnelId'));

    const conflict = isPersonnelUnavailable(personnelId, newShiftDate);
    if (conflict) {
        setShiftConflictWarning(conflict);
        showToast(conflict, 'error'); // Show toast for immediate feedback
        return;
    }

    const newShift: NewRecord<Shift> = {
        date: newShiftDate,
        personnel_id: personnelId,
        post_id: Number(formData.get('postId')),
        type: formData.get('type') as 'روز' | 'شب',
    };
    
    let allNewShifts: NewRecord<Shift>[] = [newShift];
    let recurringGenerated = false;

    if (generateRecurring) {
        const recurringShifts = generateRecurringShiftsLogic(newShift);
        if (recurringShifts.length > 0) {
            allNewShifts.push(...recurringShifts);
        }
        recurringGenerated = true;
    }
    
    try {
        if (allNewShifts.length > 1) {
            await addMultipleShifts(allNewShifts);
            if (recurringGenerated) showToast(`شیفت اولیه و ${allNewShifts.length - 1} شیفت آتی با موفقیت ایجاد شد.`, 'success');
        } else {
            await addShift(allNewShifts[0]);
             if (recurringGenerated) showToast('شیفت اولیه ثبت شد. شیفت آتی به دلیل تداخل ایجاد نشد.', 'success');
        }

        if (!recurringGenerated) {
            showToast('شیفت جدید با موفقیت ثبت شد.', 'success');
        }
    } catch(error: any) {
        showToast(`خطا در ثبت شیفت: ${error.message}`, 'error');
    }


    setIsAddModalOpen(false);
    setSelectedDateForModal(null);
    setShiftConflictWarning(null);
    setGenerateRecurring(false);
  };

  const handleOpenEditModal = (shift: Shift) => {
    setEditingShift(shift);
    setIsEditModalOpen(true);
    // When opening edit modal, check for conflict for the current person and date
    // fix: Changed personnelId to personnel_id to match type definition.
    const conflict = isPersonnelUnavailable(shift.personnel_id, shift.date, shift.id);
    setShiftConflictWarning(conflict);
  };

  // fix: Refactored to use `updateShift` from context.
  const handleUpdateShift = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingShift) return;

    const formData = new FormData(e.currentTarget);
    const updatedPersonnelId = Number(formData.get('personnelId'));

    const conflict = isPersonnelUnavailable(updatedPersonnelId, editingShift.date, editingShift.id);
    if (conflict) {
        setShiftConflictWarning(conflict);
        showToast(conflict, 'error');
        return;
    }

    const updatedData: Partial<Shift> = {
        personnel_id: updatedPersonnelId,
        post_id: Number(formData.get('postId')),
        type: formData.get('type') as 'روز' | 'شب',
    };

    try {
        await updateShift(editingShift.id, updatedData);
        setIsEditModalOpen(false);
        setEditingShift(null);
        setShiftConflictWarning(null);
        showToast('شیفت با موفقیت به‌روزرسانی شد.', 'success');
    } catch(error: any) {
        showToast(`خطا در به‌روزرسانی شیفت: ${error.message}`, 'error');
    }
  };
  
  const handleOpenDeleteModal = (shift: Shift) => {
    setDeletingShift(shift);
    setIsDeleteModalOpen(true);
  };
    
  // fix: Refactored to use `deleteShift` from context.
  const handleConfirmDelete = async () => {
    if (!deletingShift) return;
    try {
        await deleteShift(deletingShift.id);
        setIsDeleteModalOpen(false);
        setDeletingShift(null);
        showToast('شیفت با موفقیت حذف شد.', 'success');
    } catch(error: any) {
        showToast(`خطا در حذف شیفت: ${error.message}`, 'error');
    }
  };

  // fix: Refactored to use `addMultipleShifts` from context and create valid `NewRecord<Shift>`.
  const handleGeneratedShifts = async (generatedShifts: GeneratedShift[], summary: string) => {
    const newShifts: NewRecord<Shift>[] = generatedShifts.map(gs => {
        const personnelId = getPersonnelIdByName(gs.personnelName);
        const postId = getPostIdByName(gs.postName);

        if (!personnelId) {
            console.warn(`Personnel "${gs.personnelName}" not found for generated shift on ${gs.date}. Skipping.`);
            return null;
        }
        if (!postId) {
            console.warn(`Post "${gs.postName}" not found for generated shift on ${gs.date}. Skipping.`);
            return null;
        }

        // fix: Changed property names to snake_case to match type definitions.
        const alreadyExists = shifts.some(s => s.date === gs.date && s.personnel_id === personnelId && s.type === gs.type && s.post_id === postId);
        if (alreadyExists) {
            console.warn(`Skipping duplicate generated shift for ${gs.personnelName} on ${gs.date} (${gs.type}).`);
            return null;
        }

        // Additional check: Ensure personnel is not unavailable for this specific generated shift
        const unavailabilityReason = isPersonnelUnavailable(personnelId, gs.date);
        if (unavailabilityReason) {
            console.warn(`Skipping generated shift for ${gs.personnelName} on ${gs.date} due to unavailability: ${unavailabilityReason}`);
            return null;
        }

        return {
            date: gs.date,
            type: gs.type,
            personnel_id: personnelId,
            post_id: postId,
        };
    }).filter((s): s is NewRecord<Shift> => s !== null);

    if (newShifts.length > 0) {
        try {
            await addMultipleShifts(newShifts);
            showToast(`تعداد ${newShifts.length} شیفت جدید بر اساس هوش مصنوعی به تقویم اضافه شد.`, 'success');
        } catch (error: any) {
            showToast(`خطا در افزودن شیفت‌های تولید شده: ${error.message}`, 'error');
        }
    } else {
        showToast('هیچ شیفت معتبری برای افزودن به تقویم تولید نشد.', 'success');
    }
  };

  const getPersonnelIdByName = (fullName: string) => {
      const p = personnel.find(p => `${p.name} ${p.family}` === fullName);
      return p?.id;
  };

  const getPostIdByName = (postName: string) => {
      const post = posts.find(p => p.name === postName);
      return post?.id;
  };


  return (
    <>
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-2xl font-bold">تقویم شیفت</h2>
            <button
                onClick={() => setIsShiftGenerationModalOpen(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                aria-label="تولید شیفت هوشمند با هوش مصنوعی"
            >
                <PlusIcon className="w-5 h-5" />
                <span>تولید شیفت هوشمند</span>
            </button>
        </div>

        {/* Filter Section */}
        <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
                <FilterIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" aria-hidden="true"/>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">فیلترها</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div>
                    <label htmlFor="personnel-filter" className="text-xs font-medium text-gray-600 dark:text-gray-400">پرسنل</label>
                    <select
                        id="personnel-filter"
                        value={selectedPersonnelId}
                        onChange={(e) => setSelectedPersonnelId(e.target.value)}
                        className="mt-1 w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        aria-label="فیلتر بر اساس پرسنل"
                    >
                        <option value="all">همه پرسنل</option>
                        {personnel.map(p => (
                            <option key={p.id} value={p.id}>{p.name} {p.family}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="post-filter" className="text-xs font-medium text-gray-600 dark:text-gray-400">پست</label>
                    <select
                        id="post-filter"
                        value={selectedPostId}
                        onChange={(e) => setSelectedPostId(e.target.value)}
                        className="mt-1 w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        aria-label="فیلتر بر اساس پست"
                    >
                        <option value="all">همه پست‌ها</option>
                        {posts.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="type-filter" className="text-xs font-medium text-gray-600 dark:text-gray-400">نوع شیفت</label>
                    <select
                        id="type-filter"
                        value={selectedShiftType}
                        onChange={(e) => setSelectedShiftType(e.target.value)}
                        className="mt-1 w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        aria-label="فیلتر بر اساس نوع شیفت"
                    >
                        <option value="all">همه</option>
                        <option value="روز">روز</option>
                        <option value="شب">شب</option>
                    </select>
                </div>
                <div className="flex items-end">
                    <button
                        onClick={() => {
                            setSelectedPersonnelId('all');
                            setSelectedPostId('all');
                            setSelectedShiftType('all');
                        }}
                        className="w-full h-10 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors text-sm font-semibold"
                        aria-label="پاک کردن تمامی فیلترها"
                    >
                        پاک کردن فیلترها
                    </button>
                </div>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
                <button onClick={goToPreviousMonth} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700" aria-label="ماه قبل">&lt;</button>
                <span className="font-semibold text-lg w-32 text-center">{jalaliMonthNames[currentMonth-1]} {toPersianDigits(currentYear)}</span>
                <button onClick={goToNextMonth} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700" aria-label="ماه بعد">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-gray-500 dark:text-gray-400 mb-2">
            {weekDays.map(day => <div key={day} aria-label={`روز هفته ${day}`}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, index) => <div key={`empty-${index}`} aria-hidden="true" />)}
            {calendarGrid.map(day => {
                const dayShifts = getShiftsForDay(day);
                const isToday = day === todayDay && currentMonth === todayMonth && currentYear === todayYear;
                const { personnelWithStatus, hasConflict } = getDayStatus(day);
                
                return (
                <div key={day} className={`relative border border-gray-200 dark:border-slate-700/80 rounded-lg min-h-[130px] p-1 pt-2 flex flex-col items-center text-sm group/day transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50 ${isToday ? 'bg-indigo-50 dark:bg-indigo-500/10' : ''}`}
                     aria-label={`روز ${day} ${jalaliMonthNames[currentMonth-1]} ${currentYear}`}>
                    {personnelWithStatus.length > 0 && (
                        <div className="absolute bottom-full mb-2 w-max max-w-xs p-2 bg-slate-800 dark:bg-slate-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover/day:opacity-100 group-hover/day:visible transition-opacity duration-200 z-10 pointer-events-none">
                            <h4 className="font-bold border-b border-slate-600 pb-1 mb-1">وضعیت پرسنل</h4>
                            <ul className="space-y-1">
                            {personnelWithStatus.map((p, index) => (
                                <li key={index} className="flex justify-between items-center gap-2">
                                <span>{p.name}</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-white text-[10px] ${
                                    p.status === 'فعال' ? 'bg-green-500/80' : 
                                    p.status === 'مرخصی' || p.status === 'غیرفعال' ? 'bg-red-500/80' : 
                                    'bg-orange-500/80' // For 'تداخل شیفت'
                                }`}>
                                    {p.status}
                                </span>
                                </li>
                            ))}
                            </ul>
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-[-4px] w-2 h-2 bg-slate-800 dark:bg-slate-900 transform rotate-45"></div>
                        </div>
                    )}
                    <div className="flex justify-center items-center relative w-full mb-1">
                      {hasConflict && (
                        // fix: Replace invalid 'title' prop with a <title> child element for SVG accessibility.
                        <ExclamationTriangleIcon className="w-4 h-4 text-red-500 absolute -top-1 right-1" aria-label="هشدار تداخل شیفت">
                          <title>تداخل در برنامه: پرسنل غیرفعال/در مرخصی/شیفت تکراری</title>
                        </ExclamationTriangleIcon>
                      )}
                      <span className={`w-7 h-7 flex items-center justify-center rounded-full font-bold ${isToday ? 'bg-indigo-500 text-white dark:bg-indigo-400 dark:text-slate-900' : 'text-gray-700 dark:text-gray-300'}`}>{toPersianDigits(day)}</span>
                    </div>
                    {dayShifts.length > 0 && !hasConflict && <div className="absolute top-9 left-0 right-0 mx-auto w-1.5 h-1.5 bg-indigo-400 dark:bg-indigo-500 rounded-full"></div>}
                    
                    <div className="mt-1 space-y-1 w-full overflow-hidden px-1">
                        {dayShifts.map(shift => {
                            // fix: Changed postId to post_id to match type definition.
                            const postName = posts.find(p => p.id === shift.post_id)?.name;
                            // fix: Changed personnelId to personnel_id to match type definition.
                            const personnelName = getPersonnelName(shift.personnel_id);
                            return (
                                <div key={shift.id} className="relative group/shift">
                                    <div className={`p-1.5 rounded text-xs shadow-sm ${shift.type === 'روز' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300' : 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300'}`}>
                                    <p className="font-semibold truncate">{personnelName}</p>
                                    <p className="text-xs truncate">{postName}</p>
                                    </div>
                                    <div className="absolute top-1 right-1 opacity-0 group-hover/shift:opacity-100 flex items-center gap-1 transition-opacity bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm rounded-full p-0.5">
                                        <button onClick={() => handleOpenEditModal(shift)} className="p-1 rounded-full text-gray-500 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-600" aria-label={`ویرایش شیفت ${personnelName} در پست ${postName}`}>
                                            <EditIcon className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleOpenDeleteModal(shift)} className="p-1 rounded-full text-gray-500 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-600" aria-label={`حذف شیفت ${personnelName} در پست ${postName}`}>
                                            <DeleteIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <button 
                    onClick={() => handleOpenAddModal(day)}
                    className="absolute bottom-1 right-1 opacity-0 group-hover/day:opacity-100 transition-opacity text-indigo-500 hover:text-indigo-700 p-1"
                    aria-label={`افزودن شیفت برای روز ${day} ${jalaliMonthNames[currentMonth-1]}`}
                    >
                        <PlusIcon className="w-5 h-5" />
                    </button>
                </div>
                );
            })}
            </div>
        </div>
    </div>

    {/* Add Shift Modal */}
    {selectedDateForModal && (
        <Modal 
            title={`افزودن شیفت برای ${formatJalaliDate(`${selectedDateForModal.year}/${selectedDateForModal.month}/${selectedDateForModal.day}`)}`} 
            isOpen={isAddModalOpen} 
            onClose={() => {setIsAddModalOpen(false); setShiftConflictWarning(null);}}
        >
            <form onSubmit={handleAddShift} className="space-y-4">
                <div>
                    <label htmlFor="add-personnelId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">پرسنل</label>
                    <select 
                        name="personnelId" 
                        id="add-personnelId" 
                        required 
                        className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        onChange={(e) => handlePersonnelChangeInModal(e, `${selectedDateForModal.year}/${String(selectedDateForModal.month).padStart(2, '0')}/${String(selectedDateForModal.day).padStart(2, '0')}`)}
                        aria-label="انتخاب پرسنل برای شیفت"
                    >
                        <option value="">انتخاب کنید...</option> {/* Add a default empty option */}
                        {personnel.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.name} {p.family} ({p.status})
                            </option>
                        ))}
                    </select>
                    {shiftConflictWarning && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <ExclamationTriangleIcon className="w-4 h-4" aria-hidden="true"/>
                            {shiftConflictWarning}
                        </p>
                    )}
                </div>
                <div>
                    <label htmlFor="add-postId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">پست</label>
                    <select name="postId" id="add-postId" required className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" aria-label="انتخاب پست برای شیفت">
                        {posts.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" aria-label="نوع شیفت">نوع شیفت</label>
                    <div className="flex gap-4">
                        <label className="flex items-center cursor-pointer">
                            <input 
                                type="radio" 
                                name="type" 
                                value="روز" 
                                defaultChecked 
                                className="peer sr-only" // Hide native radio button
                                aria-label="شیفت روز"
                            />
                            <div className="flex items-center justify-center w-20 h-9 p-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 peer-checked:bg-yellow-500 peer-checked:text-white transition-colors">
                                <span>روز</span>
                            </div>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input 
                                type="radio" 
                                name="type" 
                                value="شب" 
                                className="peer sr-only" // Hide native radio button
                                aria-label="شیفت شب"
                            />
                            <div className="flex items-center justify-center w-20 h-9 p-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 peer-checked:bg-sky-500 peer-checked:text-white transition-colors">
                                <span>شب</span>
                            </div>
                        </label>
                    </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                    <input
                        type="checkbox"
                        id="add-recurring"
                        name="recurring"
                        checked={generateRecurring}
                        onChange={(e) => setGenerateRecurring(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600"
                    />
                    <label htmlFor="add-recurring" className="text-sm text-gray-700 dark:text-gray-300 select-none">
                        ایجاد خودکار شیفت‌های آتی (الگوی ۳-۳-۳)
                    </label>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600" aria-label="انصراف از افزودن شیفت">انصراف</button>
                    <button type="submit" disabled={!!shiftConflictWarning} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-500/50" aria-label="ذخیره شیفت جدید">ذخیره</button>
                </div>
            </form>
        </Modal>
    )}

    {/* Edit Shift Modal */}
    {editingShift && (
        <Modal 
            title="ویرایش شیفت" 
            isOpen={isEditModalOpen} 
            onClose={() => {setIsEditModalOpen(false); setShiftConflictWarning(null);}}
        >
            <form onSubmit={handleUpdateShift} className="space-y-4">
                <div>
                    <label htmlFor="edit-personnelId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">پرسنل</label>
                    <select 
                        name="personnelId" 
                        id="edit-personnelId" 
                        // fix: Changed personnelId to personnel_id to match type definition.
                        defaultValue={editingShift.personnel_id} 
                        required 
                        className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        onChange={(e) => handlePersonnelChangeInModal(e, editingShift.date, editingShift.id)}
                        aria-label="انتخاب پرسنل برای شیفت"
                    >
                        {personnel.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.name} {p.family} ({p.status})
                            </option>
                        ))}
                    </select>
                     {shiftConflictWarning && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <ExclamationTriangleIcon className="w-4 h-4" aria-hidden="true"/>
                            {shiftConflictWarning}
                        </p>
                    )}
                </div>
                <div>
                    <label htmlFor="edit-postId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">پست</label>
                    {/* fix: Changed postId to post_id to match type definition. */}
                    <select name="postId" id="edit-postId" defaultValue={editingShift.post_id} required className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" aria-label="انتخاب پست برای شیفت">
                        {posts.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" aria-label="نوع شیفت">نوع شیفت</label>
                    <div className="flex gap-4">
                        <label className="flex items-center cursor-pointer">
                            <input 
                                type="radio" 
                                name="type" 
                                value="روز" 
                                defaultChecked={editingShift.type === 'روز'} 
                                className="peer sr-only" // Hide native radio button
                                aria-label="شیفت روز"
                            />
                            <div className="flex items-center justify-center w-20 h-9 p-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 peer-checked:bg-yellow-500 peer-checked:text-white transition-colors">
                                <span>روز</span>
                            </div>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input 
                                type="radio" 
                                name="type" 
                                value="شب" 
                                defaultChecked={editingShift.type === 'شب'} 
                                className="peer sr-only" // Hide native radio button
                                aria-label="شیفت شب"
                            />
                            <div className="flex items-center justify-center w-20 h-9 p-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 peer-checked:bg-sky-500 peer-checked:text-white transition-colors">
                                <span>شب</span>
                            </div>
                        </label>
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600" aria-label="انصراف از ویرایش شیفت">انصراف</button>
                    <button type="submit" disabled={!!shiftConflictWarning} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-500/50" aria-label="به‌روزرسانی شیفت">به‌روزرسانی</button>
                </div>
            </form>
        </Modal>
    )}

    {/* Delete Confirmation Modal */}
    <Modal title="تایید حذف شیفت" isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <div className="flex flex-col items-center text-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mb-4" aria-hidden="true"/>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
                آیا از حذف این شیفت مطمئن هستید؟
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
                شیفت
                {/* fix: Changed personnelId to personnel_id to match type definition. */}
                <span className="font-bold mx-1">{deletingShift && getPersonnelName(deletingShift.personnel_id)}</span>
                در تاریخ
                <span className="font-bold mx-1">{deletingShift && formatJalaliDate(deletingShift.date)}</span>
                برای پست
                {/* fix: Changed postId to post_id to match type definition. */}
                <span className="font-bold mx-1">{deletingShift && posts.find(p => p.id === deletingShift.post_id)?.name}</span>
                نوع
                <span className="font-bold mx-1">{deletingShift?.type}</span>
                حذف خواهد شد. این عمل
                <span className="font-semibold text-red-600 dark:text-red-400 mx-1">قابل بازگشت نیست.</span>
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-8 w-full">
                <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="px-6 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 w-full sm:w-auto order-2 sm:order-1" aria-label="انصراف از حذف شیفت">انصراف</button>
                <button type="button" onClick={handleConfirmDelete} className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 w-full sm:w-auto order-1 sm:order-2" aria-label="تایید حذف شیفت">بله، حذف کن</button>
            </div>
        </div>
    </Modal>

    {/* AI Shift Generation Modal */}
    <ShiftGenerationModal
        isOpen={isShiftGenerationModalOpen}
        onClose={() => setIsShiftGenerationModalOpen(false)}
        onGenerate={handleGeneratedShifts}
        allPersonnel={personnel}
        allPosts={posts}
        currentShifts={shifts}
        leaveRequests={leaveRequests}
    />
    </>
  );
};

export default ShiftCalendar;