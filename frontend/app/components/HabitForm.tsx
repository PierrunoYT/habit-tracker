'use client';

import { useState } from 'react';
import { HabitFormData, Habit } from '../types/habits';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface HabitFormProps {
    onSubmit: (habit: HabitFormData) => Promise<void>;
    initialData?: Habit;
    onCancel?: () => void;
}

const habitSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    description: z.string().max(500).optional(),
    frequency: z.enum(['daily', 'weekly', 'custom']),
    target_days: z.array(z.string()).min(1, 'Select at least one day'),
    priority: z.number().min(1).max(3),
    category: z.string().max(50)
});

export default function HabitForm({ onSubmit, initialData, onCancel }: HabitFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<HabitFormData>({
        resolver: zodResolver(habitSchema),
        defaultValues: {
            name: initialData?.name || '',
            description: initialData?.description || '',
            frequency: initialData?.frequency || 'daily',
            target_days: initialData?.target_days || [],
            priority: initialData?.priority || 1,
            category: initialData?.category || ''
        }
    });

    const frequency = watch('frequency');

    const onSubmitForm = async (data: HabitFormData) => {
        try {
            setIsSubmitting(true);
            await onSubmit(data);
        } catch (error) {
            console.error('Form submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6 bg-white dark:bg-gray-800 rounded-lg">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Name
                </label>
                <input
                    {...register('name')}
                    type="text"
                    className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
                />
                {errors.name && (
                    <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Description
                </label>
                <textarea
                    {...register('description')}
                    className={`w-full px-3 py-2 border ${errors.description ? 'border-red-500' : 'border-gray-300'} dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white min-h-[100px] resize-none`}
                />
                {errors.description && (
                    <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Frequency
                </label>
                <select
                    {...register('frequency')}
                    className={`w-full px-3 py-2 border ${errors.frequency ? 'border-red-500' : 'border-gray-300'} dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
                >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom</option>
                </select>
                {errors.frequency && (
                    <p className="mt-1 text-sm text-red-500">{errors.frequency.message}</p>
                )}
            </div>

            {frequency === 'custom' && (
                <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Select Days</p>
                    <div className="grid grid-cols-2 gap-2">
                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                            <label key={day} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                                <input
                                    type="checkbox"
                                    onChange={(e) => {
                                        const currentDays = watch('target_days');
                                        const newDays = e.target.checked
                                            ? [...currentDays, day]
                                            : currentDays.filter(d => d !== day);
                                        setValue('target_days', newDays);
                                    }}
                                    checked={watch('target_days').includes(day)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="capitalize">{day}</span>
                            </label>
                        ))}
                    </div>
                    {errors.target_days && (
                        <p className="mt-1 text-sm text-red-500">{errors.target_days.message}</p>
                    )}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Priority
                </label>
                <select
                    {...register('priority', { valueAsNumber: true })}
                    className={`w-full px-3 py-2 border ${errors.priority ? 'border-red-500' : 'border-gray-300'} dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
                >
                    <option value={1}>Low</option>
                    <option value={2}>Medium</option>
                    <option value={3}>High</option>
                </select>
                {errors.priority && (
                    <p className="mt-1 text-sm text-red-500">{errors.priority.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Category
                </label>
                <input
                    {...register('category')}
                    type="text"
                    className={`w-full px-3 py-2 border ${errors.category ? 'border-red-500' : 'border-gray-300'} dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
                    placeholder="e.g., Health, Work, Learning"
                />
                {errors.category && (
                    <p className="mt-1 text-sm text-red-500">{errors.category.message}</p>
                )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Saving...' : (initialData ? 'Update' : 'Create')} Habit
                </button>
            </div>
        </form>
    );
}