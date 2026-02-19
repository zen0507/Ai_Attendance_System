const request = require('supertest');
const express = require('express');
const userRoutes = require('../routes/userRoutes');
const { authUser } = require('../controllers/userController');

// Mock App
const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('Auth API', () => {
    it('should return 401 for invalid credentials', async () => {
        const res = await request(app)
            .post('/api/users/login')
            .send({
                email: 'wrong@example.com',
                password: 'wrongpassword'
            });

        expect(res.statusCode).toEqual(401);
    });

    // Note: To test successful login, we need a mocked DB or a real test DB.
    // For this artifact, we demonstrate the structure.
});
