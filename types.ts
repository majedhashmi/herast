
// Base type for a record that has an ID and creation timestamp from Supabase
export interface DbRecord {
  id: number;
  created_at: string;
}

// Type for creating a new record, where `id` and `created_at` are optional
export type NewRecord<T extends DbRecord> = Omit<T, 'id' | 'created_at'>;

export interface Personnel extends DbRecord {
  name: string;
  family: string;
  code: string;
  phone: string;
  role: 'نگهبان' | 'سرشیفت' | 'مدیر';
  status: 'فعال' | 'مرخصی' | 'غیرفعال';
}

export interface Post extends DbRecord {
  name: string;
  location: string;
  priority: 'عادی' | 'مهم' | 'حیاتی';
  notes?: string;
}

export interface Shift extends DbRecord {
  date: string; // e.g., "1403/05/01"
  type: 'روز' | 'شب';
  personnel_id: number;
  post_id: number;
}

export interface LeaveRequest extends DbRecord {
  personnel_id: number;
  start_date: string; // e.g., "1403/05/10"
  end_date: string; // e.g., "1403/05/12"
  status: 'تایید شده' | 'در انتظار' | 'رد شده';
}

export interface Report extends DbRecord {
  personnel_id: number;
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
