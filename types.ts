export interface Personnel {
  id: number;
  name: string;
  family: string;
  code: string;
  phone: string;
  role: 'نگهبان' | 'سرشیفت' | 'مدیر';
  status: 'فعال' | 'مرخصی' | 'غیرفعال';
}

export interface Post {
  id: number;
  name: string;
  location: string; // New field for location
  priority: 'عادی' | 'مهم' | 'حیاتی'; // New field for priority
  notes?: string; // New optional field for notes
}

export interface Shift {
  id: number;
  date: string; // e.g., "1403/05/01"
  type: 'روز' | 'شب';
  personnelId: number;
  postId: number;
}

export interface LeaveRequest {
  id: number;
  personnelId: number;
  startDate: string; // e.g., "1403/05/10"
  endDate: string; // e.g., "1403/05/12"
  status: 'تایید شده' | 'در انتظار' | 'رد شده';
}

export interface Report {
  id: number;
  personnelId: number;
  date: string; // e.g., "1403/05/15"
  content: string;
  author: string; // Name of the person who wrote the report
}

export type ToastType = 'success' | 'error';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

// New types for AI shift generation
export interface ShiftGenerationConfig {
  startDate: string; // Jalali date
  endDate: string; // Jalali date
  additionalInstructions?: string;
}

export interface GeneratedShift {
  date: string; // Jalali date
  type: 'روز' | 'شب';
  personnelName: string; // Full name (e.g., "علی رضایی")
  postName: string; // Post name (e.g., "ورودی اصلی")
}

export interface AiGeneratedResponse {
  shifts: GeneratedShift[];
  summary: string;
}