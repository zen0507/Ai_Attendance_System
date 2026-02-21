// Server entry point
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'],
    credentials: true,
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10000, // Practically disabled
    message: 'Too many requests from this IP, please try again after 1 minute',
});
app.use(limiter);

app.use(morgan('dev')); // Logger
app.use(express.json()); // Body parser

// Routes
const userRoutes = require('./routes/userRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const marksRoutes = require('./routes/marksRoutes');

app.get('/', (req, res) => {
    res.send('API is running...');
});

const departmentRoutes = require('./routes/departmentRoutes');
const activityRoutes = require('./routes/activityRoutes');
const adminRoutes = require('./routes/adminRoutes');
const teacherRoutes = require('./routes/teacherRoutes'); // Moved this import up
const publicRoutes = require('./routes/publicRoutes'); // Moved this import up
const hodRoutes = require('./routes/hodRoutes'); // New import
const parentRoutes = require('./routes/parentRoutes'); // New import

app.use('/api/users', userRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/hod', hodRoutes); // New route
app.use('/api/parent', parentRoutes); // New route

// Error Handling Middleware (Must be after routes)
app.use(notFound);
app.use(errorHandler);

const PORT = 5000; // Forced to 5000 to match frontend

app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));

