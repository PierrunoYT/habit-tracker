import { Database } from 'sqlite';
import { Habit, HabitEntry } from '../types/habit';

export class HabitRepository {
    constructor(private db: Database) {}

    async findAll(): Promise<Habit[]> {
        try {
            return await this.db.all('SELECT * FROM habits ORDER BY priority DESC, created_at DESC') as Habit[];
        } catch (error) {
            console.error('Error in findAll:', error);
            throw new Error('Failed to fetch habits from database');
        }
    }

    async findById(id: number): Promise<Habit | undefined> {
        try {
            return await this.db.get('SELECT * FROM habits WHERE id = ?', id) as Habit | undefined;
        } catch (error) {
            console.error('Error in findById:', error);
            throw new Error(`Failed to fetch habit with id ${id}`);
        }
    }

    async create(habit: Omit<Habit, 'id' | 'created_at'>): Promise<number> {
        try {
            const result = await this.db.run(
                'INSERT INTO habits (name, description, frequency, target_days, priority, category) VALUES (?, ?, ?, ?, ?, ?)',
                [habit.name, habit.description, habit.frequency, JSON.stringify(habit.target_days), habit.priority, habit.category]
            );
            return result.lastID!;
        } catch (error) {
            console.error('Error in create:', error);
            throw new Error('Failed to create habit');
        }
    }

    async update(id: number, habit: Partial<Habit>): Promise<void> {
        try {
            await this.db.run(
                'UPDATE habits SET name = ?, description = ?, frequency = ?, target_days = ?, priority = ?, category = ? WHERE id = ?',
                [habit.name, habit.description, habit.frequency, JSON.stringify(habit.target_days), habit.priority, habit.category, id]
            );
        } catch (error) {
            console.error('Error in update:', error);
            throw new Error(`Failed to update habit with id ${id}`);
        }
    }

    async delete(id: number): Promise<void> {
        try {
            await this.db.run('DELETE FROM habit_entries WHERE habit_id = ?', [id]);
            await this.db.run('DELETE FROM habits WHERE id = ?', [id]);
        } catch (error) {
            console.error('Error in delete:', error);
            throw new Error(`Failed to delete habit with id ${id}`);
        }
    }

    async getEntries(habitId: number, daysAgo: number = 30): Promise<HabitEntry[]> {
        try {
            return await this.db.all(
                'SELECT * FROM habit_entries WHERE habit_id = ? AND completed_at >= date("now", ?)',
                [habitId, `-${daysAgo} days`]
            ) as HabitEntry[];
        } catch (error) {
            console.error('Error in getEntries:', error);
            throw new Error(`Failed to fetch entries for habit ${habitId}`);
        }
    }

    async addEntry(habitId: number, completedAt: string): Promise<void> {
        try {
            await this.db.run(
                'INSERT INTO habit_entries (habit_id, completed_at) VALUES (?, ?)',
                [habitId, completedAt]
            );
        } catch (error) {
            console.error('Error in addEntry:', error);
            throw new Error(`Failed to add entry for habit ${habitId}`);
        }
    }

    async calculateStreak(habitId: number): Promise<number> {
        try {
            const entries = await this.db.all(
                'SELECT date(completed_at) as date FROM habit_entries WHERE habit_id = ? ORDER BY completed_at DESC',
                habitId
            ) as Array<{ date: string }>;

            let streak = 0;
            let currentDate = new Date();

            for (let i = 0; i < entries.length; i++) {
                const entryDate = new Date(entries[i].date);
                const diffDays = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

                if (diffDays <= 1) {
                    streak++;
                    currentDate = entryDate;
                } else {
                    break;
                }
            }

            return streak;
        } catch (error) {
            console.error('Error in calculateStreak:', error);
            return 0;
        }
    }
}