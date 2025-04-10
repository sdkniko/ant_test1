# Anthropometry Control Panel

A web application for managing anthropometric measurements and tracking progress for both professionals and athletes.

## Features

- Two types of users: Professionals and Athletes
- Secure authentication and authorization
- Professional dashboard with:
  - Active patients overview
  - Recent evaluations
  - Group statistics
  - Alert system for important changes
- Athlete dashboard with:
  - Personal measurement history
  - Progress visualization
  - Professional comments
  - Appointment scheduling

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd anthropometry-panel
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/anthropometry-panel
JWT_SECRET=your-secret-key-here
```

4. Start MongoDB service

5. Run the application:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user

### Users
- GET /api/users/profile - Get user profile
- PUT /api/users/profile - Update user profile
- GET /api/users/patients - Get all patients (Professional only)
- POST /api/users/patients/:patientId - Add a patient (Professional only)

### Measurements
- POST /api/measurements - Create a new measurement
- GET /api/measurements - Get user measurements
- GET /api/measurements/stats - Get measurement statistics (Professional only)
- GET /api/measurements/alerts - Get alerts (Professional only)

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization

## License

MIT 