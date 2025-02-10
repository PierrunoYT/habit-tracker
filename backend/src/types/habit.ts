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
    created_at?: string;
    entries?: HabitEntry[];
    currentStreak?: number;
}

export interface CreateHabitDTO {
    name: string;
    description: string;
    frequency: Habit['frequency'];
    target_days: string[];
    priority: Habit['priority'];
    category: string;
}

export interface UpdateHabitDTO extends Partial<CreateHabitDTO> {}

export interface CompleteHabitDTO {
    completed_at: string;
}

export interface ApiResponse<T> {
    data?: T;
    error?: string;
    details?: string;
}