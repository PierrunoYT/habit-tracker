export interface HabitEntry {
    id: number;
    habit_id: number;
    completed_at: string;
}

export interface Habit {
    id: number;
    name: string;
    description: string;
    frequency: 'daily' | 'weekly' | 'custom';
    target_days: string[];
    priority: 1 | 2 | 3;
    category: string;
    entries: HabitEntry[];
    currentStreak: number;
}

export interface HabitFormData {
    name: string;
    description: string;
    frequency: Habit['frequency'];
    target_days: string[];
    priority: Habit['priority'];
    category: string;
}

export interface ApiResponse<T> {
    data?: T;
    error?: string;
    details?: string;
}

export interface HabitCompletionData {
    completed_at: string;
}

export type HabitFilters = {
    category: string;
}