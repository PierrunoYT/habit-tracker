# Habit Tracker

A full-stack habit tracking application built with TypeScript, Next.js, and Node.js. Track your daily habits, set goals, and monitor your progress over time.

## 🚀 Features

- Create and manage daily habits
- Track habit completion
- View progress statistics
- Responsive design for mobile and desktop
- Secure authentication
- RESTful API backend
- SQLite database for simple setup and portability

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Windows
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Git](https://git-scm.com/download/windows)

### macOS
- [Node.js](https://nodejs.org/) (v18 or higher)
```bash
brew install node
```
- [Git](https://git-scm.com/download/mac)
```bash
brew install git
```

### Linux (Ubuntu/Debian)
- [Node.js](https://nodejs.org/) (v18 or higher)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```
- [Git](https://git-scm.com/download/linux)
```bash
sudo apt-get install git
```

## 🛠️ Installation

1. Clone the repository
```bash
git clone https://github.com/PierrunoYT/habit-tracker.git
cd habit-tracker
```

2. Install dependencies for both frontend and backend

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables

Backend (.env):
```env
PORT=3001
DATABASE_URL=sqlite:./data/habits.db
```

Frontend (.env.local):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🚀 Running the Application

### Development Mode

1. Start the backend server:
```bash
# From the backend directory
npm run dev
```

2. Start the frontend development server:
```bash
# From the frontend directory
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Production Mode

1. Build and start the backend:
```bash
# From the backend directory
npm run build
npm start
```

2. Build and start the frontend:
```bash
# From the frontend directory
npm run build
npm start
```

## 🔧 Database Setup

The SQLite database will be automatically created when you first run the application. No additional setup is required! The database file will be created at `backend/data/habits.db`.

## 🧪 Running Tests

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🐛 Troubleshooting

### Windows
- If you encounter EACCES errors, run PowerShell as Administrator
- For database access issues, ensure you have write permissions in the backend/data directory

### macOS
- For permission issues:
```bash
sudo chown -R $(whoami) /path/to/project
```

### Linux
- For permission denied errors:
```bash
sudo chmod -R 755 /path/to/project
```

## 📞 Support

If you encounter any issues or have questions, please [open an issue](https://github.com/PierrunoYT/habit-tracker/issues). 