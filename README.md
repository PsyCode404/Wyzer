# Wyzer - Personal Finance Application

Wyzer is a comprehensive personal finance and budget tracking web application built with React and Node.js.

## Features

- User authentication and profile management
- Transaction tracking and categorization
- Recurring transactions management
- Budget planning and analysis
- Financial insights and reports

## Tech Stack

### Frontend
- React 19.1.0
- React Router for navigation
- Tailwind CSS for styling
- Formik and Yup for form validation
- Recharts for data visualization

### Backend
- Node.js with Express
- MySQL database
- JWT for authentication

## Project Structure

- `/app` - Frontend React application
- `/backend` - Node.js/Express backend
- `/db_init.sql` - Database initialization script

## Development Setup

### Prerequisites
- Node.js (v14+)
- MySQL

### Backend Setup
1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Create a `.env` file with the following variables:
   ```
   DB_HOST=localhost
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=wyzer
   DB_PORT=3306
   JWT_SECRET=your_jwt_secret
   ```
4. Start the server: `npm run dev` (with nodemon) or `npm start`

### Frontend Setup
1. Navigate to the app directory: `cd app`
2. Install dependencies: `npm install`
3. Start the development server: `npm start` or run `start-app.bat`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create a new transaction
- `GET /api/transactions/:id` - Get a transaction by ID
- `PUT /api/transactions/:id` - Update a transaction
- `DELETE /api/transactions/:id` - Delete a transaction

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create a new category
- `PUT /api/categories/:id` - Update a category
- `DELETE /api/categories/:id` - Delete a category

### Recurring Transactions
- `GET /api/recurring` - Get all recurring transactions
- `POST /api/recurring` - Create a new recurring transaction
- `PUT /api/recurring/:id` - Update a recurring transaction
- `DELETE /api/recurring/:id` - Delete a recurring transaction

## License

This project is licensed under the MIT License.
