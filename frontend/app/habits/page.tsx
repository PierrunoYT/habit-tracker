'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import HabitForm from '../components/HabitForm';
import { format } from 'date-fns';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import ErrorBoundary from '../components/ErrorBoundary';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Habit, HabitFormData } from '../types/habits';
import HabitService from '../services/habitService';

export default function HabitsPageWrapper() {
    return (
        <ErrorBoundary>
            <HabitsPage />
        </ErrorBoundary>
    );
}

function HabitsPage() {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedHabitId, setSelectedHabitId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchHabits = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const habits = await HabitService.fetchHabits();
            setHabits(habits);
        } catch (error) {
            console.error('Failed to fetch habits:', error);
            setError(error instanceof Error ? error.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHabits();
    }, [fetchHabits]);

    const handleSubmit = async (habitData: HabitFormData) => {
        try {
            setIsSubmitting(true);
            if (editingHabit) {
                await HabitService.updateHabit(editingHabit.id, habitData);
            } else {
                await HabitService.createHabit(habitData);
            }
            setShowForm(false);
            setEditingHabit(null);
            await fetchHabits();
        } catch (error) {
            console.error('Failed to save habit:', error);
            setError(error instanceof Error ? error.message : 'Failed to save habit');
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteHabit = async (id: number) => {
        if (!confirm('Are you sure you want to delete this habit?')) return;
        
        try {
            setIsSubmitting(true);
            await HabitService.deleteHabit(id);
            await fetchHabits();
        } catch (error) {
            console.error('Failed to delete habit:', error);
            setError(error instanceof Error ? error.message : 'Failed to delete habit');
        } finally {
            setIsSubmitting(false);
        }
    };

    const completeHabit = async (id: number, date: Date) => {
        try {
            setIsSubmitting(true);
            await HabitService.completeHabit(id, { completed_at: date.toISOString() });
            await fetchHabits();
            setShowCalendar(false);
            setSelectedHabitId(null);
        } catch (error) {
            console.error('Failed to complete habit:', error);
            setError(error instanceof Error ? error.message : 'Failed to complete habit');
        } finally {
            setIsSubmitting(false);
        }
    };

    const categories = useMemo(() => 
        ['all', ...new Set(habits?.map(h => h.category).filter(Boolean))],
        [habits]
    );

    const filteredHabits = useMemo(() => 
        selectedCategory === 'all' 
            ? habits 
            : habits?.filter(h => h.category === selectedCategory),
        [habits, selectedCategory]
    );

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4">
            {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Habit Tracker</h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                    disabled={isSubmitting}
                >
                    Add Habit
                </button>
            </div>

            <div className="mb-4">
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="border rounded p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                    {categories.map(category => (
                        <option key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                    ))}
                </select>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <HabitForm
                            onSubmit={handleSubmit}
                            initialData={editingHabit}
                            onCancel={() => {
                                setShowForm(false);
                                setEditingHabit(null);
                            }}
                        />
                    </div>
                </div>
            )}

            <div className="grid gap-4">
                {filteredHabits.map((habit) => (
                    <div key={habit.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-xl">{habit.name}</h3>
                                    <div className="flex gap-1">
                                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                            {habit.frequency}
                                        </span>
                                        {habit.category && (
                                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                                {habit.category}
                                            </span>
                                        )}
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                            habit.priority === 1 ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' :
                                            habit.priority === 2 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        }`}>
                                            Priority {habit.priority}
                                        </span>
                                    </div>
                                </div>
                                
                                {habit.description && (
                                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                                        {habit.description}
                                    </p>
                                )}
                                
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Streak: {habit.currentStreak} days
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setEditingHabit(habit);
                                        setShowForm(true);
                                    }}
                                    className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 disabled:opacity-50"
                                    disabled={isSubmitting}
                                >
                                    <span className="sr-only">Edit</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => deleteHabit(habit.id)}
                                    className="text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 disabled:opacity-50"
                                    disabled={isSubmitting}
                                >
                                    <span className="sr-only">Delete</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedHabitId(habit.id);
                                        setShowCalendar(true);
                                    }}
                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                                    disabled={isSubmitting}
                                >
                                    Complete
                                </button>
                            </div>
                        </div>
                        
                        <div className="mt-4">
                            <CalendarHeatmap
                                startDate={new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)}
                                endDate={new Date()}
                                values={habit.entries.map(entry => ({
                                    date: format(new Date(entry.completed_at), 'yyyy-MM-dd'),
                                    count: 1
                                }))}
                                classForValue={(value) => {
                                    if (!value) return 'color-empty';
                                    return `color-scale-${value.count}`;
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {showCalendar && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Select Completion Date</h3>
                            <Calendar
                                onChange={(date) => {
                                    if (date instanceof Date && selectedHabitId) {
                                        completeHabit(selectedHabitId, date);
                                    }
                                }}
                                value={selectedDate}
                                maxDate={new Date()}
                                minDate={new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)}
                                className="rounded-lg border-0 shadow-sm"
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={() => {
                                    setShowCalendar(false);
                                    setSelectedHabitId(null);
                                }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}