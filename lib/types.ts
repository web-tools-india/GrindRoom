export interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  streak_count: number
  longest_streak: number
  last_session_date: string | null
  total_sessions: number
  total_focus_minutes: number
  created_at: string
}

export interface Room {
  id: string
  name: string
  description: string | null
  emoji: string | null
  category: 'study' | 'coding' | 'upsc' | 'freelance' | 'creative' | 'general'
  is_public: boolean
  created_by: string | null
  active_count: number
  created_at: string
}

export interface Session {
  id: string
  user_id: string
  room_id: string
  task_declared: string
  duration_minutes: number
  started_at: string
  ended_at: string | null
  completed: boolean | null
  actual_minutes: number | null
}

export interface Circle {
  id: string
  name: string
  invite_code: string
  created_by: string
  created_at: string
}

export interface CircleMember {
  circle_id: string
  user_id: string
  joined_at: string
}
