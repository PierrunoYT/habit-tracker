import { Habit, HabitFormData, ApiResponse } from '../types/habits';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

class HabitService {
    private cache: Map<string, CacheEntry<unknown>> = new Map();

    private async fetchWithErrorHandling<T>(url: string, options: RequestInit = {}): Promise<T> {
        try {
            const response = await fetch(`${API_BASE_URL}${url}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            if (!response.ok) {
                const errorData = await response.json() as { error: string };
                throw new Error(errorData.error || 'An error occurred');
            }

            return response.json() as Promise<T>;
        } catch (error) {
            console.error('API Error:', error);
            throw error instanceof Error ? error : new Error('An unexpected error occurred');
        }
    }

    private getCacheKey(key: string, params?: Record<string, string | number | boolean>): string {
        return params ? `${key}:${JSON.stringify(params)}` : key;
    }

    private getFromCache<T>(key: string): T | null {
        const cacheEntry = this.cache.get(key);
        if (!cacheEntry) return null;

        const isExpired = Date.now() - cacheEntry.timestamp > CACHE_TIME;
        if (isExpired) {
            this.cache.delete(key);
            return null;
        }

        return cacheEntry.data as T;
    }

    private setCache<T>(key: string, data: T): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
        });
    }

    public clearCache(): void {
        this.cache.clear();
    }

    public async fetchHabits(forceRefresh = false): Promise<Habit[]> {
        const cacheKey = this.getCacheKey('habits');
        
        if (!forceRefresh) {
            const cachedData = this.getFromCache<Habit[]>(cacheKey);
            if (cachedData) return cachedData;
        }

        const habits = await this.fetchWithErrorHandling<Habit[]>('/habits');
        this.setCache(cacheKey, habits);
        return habits;
    }

    public async getHabitById(id: number): Promise<Habit> {
        const cacheKey = this.getCacheKey('habit', { id });
        const cachedData = this.getFromCache<Habit>(cacheKey);
        if (cachedData) return cachedData;

        const habit = await this.fetchWithErrorHandling<Habit>(`/habits/${id}`);
        this.setCache(cacheKey, habit);
        return habit;
    }

    public async createHabit(data: HabitFormData): Promise<ApiResponse<{ id: number }>> {
        const response = await this.fetchWithErrorHandling<ApiResponse<{ id: number }>>('/habits', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        this.clearCache(); // Invalidate cache after creating
        return response;
    }

    public async updateHabit(id: number, data: HabitFormData): Promise<ApiResponse<void>> {
        const response = await this.fetchWithErrorHandling<ApiResponse<void>>(`/habits/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });

        this.clearCache(); // Invalidate cache after updating
        return response;
    }

    public async deleteHabit(id: number): Promise<ApiResponse<void>> {
        const response = await this.fetchWithErrorHandling<ApiResponse<void>>(`/habits/${id}`, {
            method: 'DELETE',
        });

        this.clearCache(); // Invalidate cache after deleting
        return response;
    }

    public async completeHabit(id: number, date?: Date): Promise<ApiResponse<void>> {
        const response = await this.fetchWithErrorHandling<ApiResponse<void>>(`/habits/${id}/complete`, {
            method: 'POST',
            body: JSON.stringify({
                completed_at: date?.toISOString() || new Date().toISOString(),
            }),
        });

        this.clearCache(); // Invalidate cache after completion
        return response;
    }
}

// Export a singleton instance
export default new HabitService();