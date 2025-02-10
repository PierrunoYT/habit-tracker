import express, { Request, Response, Router, RequestHandler } from 'express';
import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { body, param, validationResult } from 'express-validator';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

// Create Express app and router
const app = express();
const router = Router();
const PORT = process.env.PORT || 3001;

// Configure rate limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

// Apply middleware
app.use(express.json());
app.use(limiter);
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 200
}));

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Habit Tracker API',
            version: '1.0.0',
            description: 'API documentation for the Habit Tracker application'
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: 'Development server'
            }
        ]
    },
    apis: ['./src/**/*.ts']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Validation middleware
const validateRequest: RequestHandler = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    next();
};

// Define interfaces
interface HabitEntry {
    id: number;
    habit_id: number;
    completed_at: string;
}

interface Habit {
    id: number;
    name: string;
    description: string;
    frequency: string;
    target_days: string;
    priority: number;
    category: string;
    created_at: string;
    entries?: HabitEntry[];
    currentStreak?: number;
}

interface CreateHabitBody {
    name: string;
    description: string;
    frequency: string;
    target_days: string;
    priority: number;
    category: string;
}

interface CompleteHabitBody {
    completed_at?: string;
}

// Database setup
let db: Database;

// Validation schemas
const habitValidation = [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('description').optional().isLength({ max: 500 }),
    body('frequency').isIn(['daily', 'weekly', 'custom']),
    body('target_days').isArray(),
    body('priority').isInt({ min: 1, max: 3 }),
    body('category').trim().isLength({ max: 50 })
];

const idValidation = [
    param('id').isInt().withMessage('Invalid ID parameter')
];

// Define route handlers
/**
 * @swagger
 * /api/habits:
 *   get:
 *     summary: Get all habits
 *     responses:
 *       200:
 *         description: List of habits
 *       500:
 *         description: Server error
 */
const getHabits: RequestHandler = async (req, res) => {
    try {
        const habits = await db.all('SELECT * FROM habits ORDER BY priority DESC, created_at DESC') as Habit[];
        
        // Get completion data for each habit
        for (let habit of habits) {
            const entries = await db.all(
                'SELECT completed_at FROM habit_entries WHERE habit_id = ? AND completed_at >= date("now", "-30 days")',
                habit.id
            ) as HabitEntry[];
            habit.entries = entries;
            habit.currentStreak = await calculateStreak(habit.id);
        }
        
        res.json(habits);
    } catch (error) {
        console.error('Error fetching habits:', error);
        res.status(500).json({ 
            error: 'Failed to fetch habits', 
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * @swagger
 * /api/habits/{id}:
 *   get:
 *     summary: Get a habit by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Habit details
 *       404:
 *         description: Habit not found
 *       500:
 *         description: Server error
 */
const getHabitById: RequestHandler<{ id: string }> = async (req, res) => {
    try {
        const { id } = req.params;
        const habit = await db.get('SELECT * FROM habits WHERE id = ?', id) as Habit | undefined;
        
        if (!habit) {
            res.status(404).json({ error: 'Habit not found' });
            return;
        }

        res.json(habit);
    } catch (error) {
        console.error('Error fetching habit:', error);
        res.status(500).json({ 
            error: 'Failed to fetch habit', 
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * @swagger
 * /api/habits:
 *   post:
 *     summary: Create a new habit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HabitInput'
 *     responses:
 *       200:
 *         description: Created habit ID
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
const createHabit: RequestHandler<{}, {}, CreateHabitBody> = async (req, res) => {
    try {
        const { name, description, frequency, target_days, priority, category } = req.body;
        const result = await db.run(
            'INSERT INTO habits (name, description, frequency, target_days, priority, category) VALUES (?, ?, ?, ?, ?, ?)',
            [name, description, frequency, JSON.stringify(target_days), priority, category]
        );
        res.json({ id: result.lastID });
    } catch (error) {
        console.error('Error creating habit:', error);
        res.status(500).json({ 
            error: 'Failed to create habit', 
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

const updateHabit: RequestHandler<{ id: string }, {}, CreateHabitBody> = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, frequency, target_days, priority, category } = req.body;
        await db.run(
            'UPDATE habits SET name = ?, description = ?, frequency = ?, target_days = ?, priority = ?, category = ? WHERE id = ?',
            [name, description, frequency, JSON.stringify(target_days), priority, category, id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating habit:', error);
        res.status(500).json({ 
            error: 'Failed to update habit', 
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

const deleteHabit: RequestHandler<{ id: string }> = async (req, res) => {
    try {
        const { id } = req.params;
        await db.run('DELETE FROM habit_entries WHERE habit_id = ?', [id]);
        await db.run('DELETE FROM habits WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting habit:', error);
        res.status(500).json({ 
            error: 'Failed to delete habit', 
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

const completeHabit: RequestHandler<{ id: string }, {}, CompleteHabitBody> = async (req, res) => {
    try {
        const habitId = req.params.id;
        const { completed_at } = req.body;
        
        // Validate the habit exists
        const habit = await db.get('SELECT * FROM habits WHERE id = ?', habitId) as Habit | undefined;
        if (!habit) {
            res.status(404).json({ error: 'Habit not found' });
            return;
        }

        // Insert the completion entry
        await db.run(
            'INSERT INTO habit_entries (habit_id, completed_at) VALUES (?, ?)',
            [habitId, completed_at || new Date().toISOString()]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error completing habit:', error);
        res.status(500).json({ 
            error: 'Failed to complete habit', 
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Apply routes to router with validation
router.get('/habits', getHabits);
router.get('/habits/:id', idValidation, validateRequest, getHabitById);
router.post('/habits', habitValidation, validateRequest, createHabit);
router.put('/habits/:id', [...idValidation, ...habitValidation], validateRequest, updateHabit);
router.delete('/habits/:id', idValidation, validateRequest, deleteHabit);
router.post('/habits/:id/complete', idValidation, validateRequest, completeHabit);

// Database initialization function
async function initializeDatabase(): Promise<Database> {
    try {
        const dbPath = path.resolve(__dirname, '../database.sqlite');
        const dbExists = fs.existsSync(dbPath);

        // Ensure directory exists
        const dbDir = path.dirname(dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        // Open database connection
        const database = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        // If database doesn't exist, initialize schema
        if (!dbExists) {
            const schemaPath = path.resolve(__dirname, './db/schema.sql');
            const schema = fs.readFileSync(schemaPath, 'utf8');
            await database.exec(schema);
        }

        return database;
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
}

// Mount router AFTER all routes are defined
app.use('/api', router);

// Start server function
const startServer = async () => {
    try {
        db = await initializeDatabase();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Helper function to calculate streak
async function calculateStreak(habitId: number): Promise<number> {
    try {
        const entries = await db.all(
            'SELECT date(completed_at) as date FROM habit_entries WHERE habit_id = ? ORDER BY completed_at DESC',
            habitId
        ) as Array<{ date: string }>;

        if (entries.length === 0) return 0;

        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        for (let i = 0; i < entries.length; i++) {
            const entryDate = new Date(entries[i].date);
            entryDate.setHours(0, 0, 0, 0);
            
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
        console.error('Error calculating streak:', error);
        return 0;
    }
}

// Add proper shutdown handling
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    if (db) {
        await db.close();
    }
    process.exit(0);
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Gracefully shutdown
    if (db) {
        db.close().then(() => {
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Gracefully shutdown
    if (db) {
        db.close().then(() => {
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
});

// Start the server
startServer();
