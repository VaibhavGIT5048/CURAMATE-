export interface Doctor {
  id: string;
  user_id?: string;
  name: string;
  specialization: string;
  experience_years: number;
  bio: string | null;
  avatar_url: string | null;
  availability: Record<string, boolean>;
  rating: number;
  consultation_fee: number;
  is_featured: boolean;
  created_at: string;
}

export interface Blog {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  author_id: string | null;
  author_name: string;
  category: string;
  cover_image: string | null;
  is_featured: boolean;
  published_at: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes: string | null;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
  doctor?: Doctor;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'patient' | 'doctor' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface BloodReport {
  id: string;
  user_id: string;
  file_name: string;
  content: string | null;
  file_url: string | null;
  analysis: string | null;
  uploaded_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}
