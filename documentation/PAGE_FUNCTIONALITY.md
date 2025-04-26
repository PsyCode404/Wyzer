# Wyzer Application - Page Functionality Documentation

This document provides detailed information about each page in the Wyzer personal finance application, including functionality, data flow, and component relationships to help the conception team create accurate diagrams.

## Table of Contents
1. [Authentication Pages](#authentication-pages)
   - [Login Page](#login-page)
   - [Register Page](#register-page)
2. [Core Pages](#core-pages)
   - [Dashboard Page](#dashboard-page)
   - [Transactions Page](#transactions-page)
   - [Categories Page](#categories-page)
   - [Recurring Transactions Page](#recurring-transactions-page)
   - [Reports Page](#reports-page)
3. [User Management Pages](#user-management-pages)
   - [Profile Page](#profile-page)
   - [Settings Page](#settings-page)
   - [Onboarding Page](#onboarding-page)

---

## Authentication Pages

### Login Page

**File Path:** `app/src/pages/LoginPage.jsx`

**Purpose:** Authenticates existing users and provides access to the application.

**Key Components:**
- Login form with email and password fields
- Form validation using Formik and Yup
- Error handling and user feedback
- "Remember me" functionality
- Link to registration page

**Data Flow:**
1. User enters email and password
2. Form validation occurs on client-side
3. Credentials are sent to `/api/auth/login` endpoint
4. Upon successful authentication:
   - JWT token is received and stored in localStorage
   - User is redirected to Dashboard
5. On failure, error message is displayed

**API Endpoints Used:**
- `POST /api/auth/login` - Authenticates user credentials

**State Management:**
- Uses AuthContext to manage authentication state
- Stores token and user information in localStorage

**Diagram Notes:**
- Show form validation flow
- Illustrate authentication process with backend
- Highlight token storage and redirection logic

---

### Register Page

**File Path:** `app/src/pages/RegisterPage.jsx`

**Purpose:** Allows new users to create an account.

**Key Components:**
- Registration form with fields for:
  - Email
  - Password
  - Password confirmation
- Form validation using Formik and Yup
- Error handling and user feedback
- Link to login page

**Data Flow:**
1. User enters registration information
2. Form validation occurs on client-side
3. Data is sent to `/api/auth/register` endpoint
4. Upon successful registration:
   - User is redirected to Onboarding page
5. On failure, error message is displayed

**API Endpoints Used:**
- `POST /api/auth/register` - Creates a new user account

**State Management:**
- Temporary form state using Formik
- No persistent state management

**Diagram Notes:**
- Show multi-step registration process
- Highlight validation rules
- Illustrate the flow to onboarding

---

## Core Pages

### Dashboard Page

**File Path:** `app/src/pages/DashboardPage.jsx`

**Purpose:** Provides an overview of the user's financial status and key metrics.

**Key Components:**
- Summary cards showing:
  - Total income
  - Total expenses
  - Net balance
  - Savings rate
- Recent transactions list
- Expense breakdown by category (pie chart)
- Monthly spending trend (line chart)
- Budget progress bars
- Upcoming recurring transactions

**Data Flow:**
1. Page loads and fetches multiple data sources:
   - Recent transactions
   - Category summaries
   - Monthly totals
   - Recurring transactions
2. Data is processed and formatted for display
3. Charts and visualizations are rendered
4. User can click on items to navigate to detailed views

**API Endpoints Used:**
- `GET /api/transactions` - Fetches recent transactions
- `GET /api/transactions/stats` - Fetches transaction statistics
- `GET /api/categories` - Fetches category information
- `GET /api/recurring` - Fetches upcoming recurring transactions

**State Management:**
- Uses React hooks (useState, useEffect) for local state
- Fetches data from multiple API endpoints
- Processes and transforms data for visualization

**Diagram Notes:**
- Show data aggregation from multiple sources
- Highlight the calculation of summary metrics
- Illustrate the relationship between different dashboard components

---

### Transactions Page

**File Path:** `app/src/pages/TransactionPage.jsx`

**Purpose:** Allows users to view, add, edit, and delete financial transactions.

**Key Components:**
- Transaction list with filtering and sorting options
- Transaction search functionality
- Add/Edit transaction modal form
- Transaction filters:
  - Date range
  - Transaction type (income/expense)
  - Category
  - Amount range
- Bulk actions (delete, categorize)
- Export functionality

**Data Flow:**
1. Page loads and fetches transactions with optional filters
2. User can filter, sort, and search transactions
3. Adding/editing transactions:
   - Modal form opens
   - User enters transaction details
   - Data is validated
   - Transaction is created/updated via API
   - List refreshes
4. Deleting transactions:
   - Confirmation dialog appears
   - On confirmation, delete request is sent
   - List refreshes

**API Endpoints Used:**
- `GET /api/transactions` - Fetches transactions with optional filters
- `POST /api/transactions` - Creates a new transaction
- `PUT /api/transactions/:id` - Updates an existing transaction
- `DELETE /api/transactions/:id` - Deletes a transaction
- `GET /api/categories` - Fetches categories for the dropdown

**State Management:**
- Uses React hooks for local state management
- Maintains filter state
- Handles pagination state
- Manages modal visibility and form state

**Diagram Notes:**
- Show the filter and search flow
- Illustrate CRUD operations
- Highlight the relationship between list view and detail view

---

### Categories Page

**File Path:** `app/src/pages/CategoriesPage.jsx`

**Purpose:** Allows users to manage expense and income categories.

**Key Components:**
- Category list separated by type (income/expense)
- Add/Edit category modal form
- Category visualization (color coding, icons)
- Category usage statistics
- Merge category functionality

**Data Flow:**
1. Page loads and fetches all categories
2. Categories are grouped by type (income/expense)
3. Adding/editing categories:
   - Modal form opens
   - User enters category details (name, type, color, icon)
   - Data is validated
   - Category is created/updated via API
   - List refreshes
4. Deleting categories:
   - Confirmation dialog appears (with warning about affected transactions)
   - On confirmation, delete request is sent
   - List refreshes

**API Endpoints Used:**
- `GET /api/categories` - Fetches all categories
- `POST /api/categories` - Creates a new category
- `PUT /api/categories/:id` - Updates an existing category
- `DELETE /api/categories/:id` - Deletes a category

**State Management:**
- Uses React hooks for local state management
- Maintains separate lists for income and expense categories
- Manages modal visibility and form state

**Diagram Notes:**
- Show the category type separation
- Illustrate the relationship between categories and transactions
- Highlight the category customization options

---

### Recurring Transactions Page

**File Path:** `app/src/pages/RecurringTransactionsPage.jsx`

**Purpose:** Allows users to manage recurring income and expenses.

**Key Components:**
- Recurring transaction list
- Add/Edit recurring transaction modal form
- Frequency options (daily, weekly, monthly, yearly)
- Start/end date selection
- Active/inactive toggle
- Upcoming occurrences preview

**Data Flow:**
1. Page loads and fetches all recurring transactions
2. Recurring transactions are displayed with next occurrence date
3. Adding/editing recurring transactions:
   - Modal form opens
   - User enters transaction details (amount, category, frequency, etc.)
   - Data is validated
   - Recurring transaction is created/updated via API
   - List refreshes
4. Toggling active status:
   - Status is toggled via API
   - List refreshes
5. Deleting recurring transactions:
   - Confirmation dialog appears
   - On confirmation, delete request is sent
   - List refreshes

**API Endpoints Used:**
- `GET /api/recurring` - Fetches all recurring transactions
- `POST /api/recurring` - Creates a new recurring transaction
- `PUT /api/recurring/:id` - Updates an existing recurring transaction
- `PATCH /api/recurring/:id/toggle` - Toggles the active status
- `DELETE /api/recurring/:id` - Deletes a recurring transaction
- `GET /api/categories` - Fetches categories for the dropdown

**State Management:**
- Uses React hooks for local state management
- Maintains list of recurring transactions
- Calculates next occurrence dates
- Manages modal visibility and form state

**Diagram Notes:**
- Show the frequency calculation logic
- Illustrate the relationship between recurring transactions and actual transactions
- Highlight the scheduling and notification system

---

### Reports Page

**File Path:** `app/src/pages/ReportsPage.jsx`

**Purpose:** Provides financial insights and visualizations based on transaction data.

**Key Components:**
- Date range selector
- Report type selector:
  - Income vs. Expenses
  - Category breakdown
  - Monthly trends
  - Annual comparison
  - Savings rate
- Interactive charts (bar, pie, line)
- Data table with summary statistics
- Export functionality (CSV, PDF)

**Data Flow:**
1. Page loads with default report type and date range
2. User can select different report types and date ranges
3. Data is fetched based on selected parameters
4. Charts and tables are rendered with the data
5. User can export reports in different formats

**API Endpoints Used:**
- `GET /api/transactions/stats` - Fetches transaction statistics with filters
- `GET /api/categories` - Fetches categories for filtering and grouping

**State Management:**
- Uses React hooks for local state management
- Maintains selected report type and date range
- Processes and transforms data for visualization

**Diagram Notes:**
- Show the report type selection flow
- Illustrate the data aggregation process
- Highlight the visualization options and export functionality

---

## User Management Pages

### Profile Page

**File Path:** `app/src/pages/ProfilePage.jsx`

**Purpose:** Allows users to view and update their personal information.

**Key Components:**
- Personal information form:
  - Name
  - Email
  - Profile picture
- Account statistics:
  - Account age
  - Number of transactions
  - Last login
- Password change form
- Account deletion option

**Data Flow:**
1. Page loads and fetches user profile data
2. User can edit personal information:
   - Form validation occurs
   - Changes are saved via API
3. Changing password:
   - Current password is verified
   - New password is validated
   - Password is updated via API
4. Deleting account:
   - Confirmation dialog with password verification
   - On confirmation, account is deleted
   - User is logged out and redirected to login page

**API Endpoints Used:**
- `GET /api/profile` - Fetches user profile information
- `PUT /api/profile` - Updates user profile information
- `PUT /api/auth/password` - Changes user password
- `DELETE /api/profile` - Deletes user account

**State Management:**
- Uses React hooks for local state management
- Uses AuthContext for authentication state

**Diagram Notes:**
- Show the profile update flow
- Illustrate the password change process with security measures
- Highlight the account deletion process

---

### Settings Page

**File Path:** `app/src/pages/SettingsPage.jsx`

**Purpose:** Allows users to customize application settings and preferences.

**Key Components:**
- Currency selection
- Date format preference
- Theme selection (light/dark/system)
- Notification settings:
  - Email notifications
  - Push notifications
  - Notification frequency
- Data export options
- Account connection settings (for bank integrations)

**Data Flow:**
1. Page loads and fetches user settings
2. User can modify settings:
   - Changes are saved immediately or on form submission
   - Settings are updated via API
3. Exporting data:
   - User selects data type and format
   - Export request is processed
   - File is downloaded

**API Endpoints Used:**
- `GET /api/settings` - Fetches user settings
- `PUT /api/settings` - Updates user settings
- `GET /api/export` - Exports user data

**State Management:**
- Uses React hooks for local state management
- Maintains form state for settings

**Diagram Notes:**
- Show the settings categorization
- Illustrate the immediate vs. deferred saving process
- Highlight the theme switching mechanism

---

### Onboarding Page

**File Path:** `app/src/pages/OnboardingPage.jsx`

**Purpose:** Guides new users through the initial setup process after registration.

**Key Components:**
- Multi-step onboarding process:
  1. Welcome and introduction
  2. Personal information collection
  3. Financial goals setting
  4. Initial categories setup
  5. Optional: Initial balance entry
  6. Optional: Recurring transactions setup
- Progress indicator
- Skip option for optional steps

**Data Flow:**
1. User is redirected here after registration
2. Each step collects specific information:
   - Data is validated
   - Progress is saved incrementally
3. On completion:
   - Profile is marked as onboarded
   - User is redirected to Dashboard

**API Endpoints Used:**
- `POST /api/onboarding/profile` - Saves personal information
- `POST /api/onboarding/goals` - Saves financial goals
- `POST /api/onboarding/categories` - Sets up initial categories
- `POST /api/onboarding/complete` - Marks onboarding as complete

**State Management:**
- Uses React hooks for local state management
- Maintains current step and form data across steps
- Uses AuthContext to update user onboarding status

**Diagram Notes:**
- Show the multi-step flow with decision points
- Illustrate the data collection process
- Highlight the relationship between onboarding and initial app state

---

## Technical Implementation Notes

### Authentication Flow
- JWT-based authentication
- Token stored in localStorage
- Token refresh mechanism
- Protected routes using React Router

### API Communication
- Centralized API utilities in `src/utils/` directory
- Error handling and retry logic
- Request/response interceptors

### State Management
- Context API for global state (Auth, Theme)
- React hooks for component-level state
- Local storage for persistence

### UI Components
- Tailwind CSS for styling
- Responsive design for all screen sizes
- Accessibility considerations (ARIA attributes, keyboard navigation)

### Data Visualization
- Recharts library for charts and graphs
- Custom color schemes for categories
- Interactive elements for data exploration

---

## Database Schema Reference

For a complete understanding of the data relationships, refer to the database schema in `db_init.sql`, which includes tables for:

- `users` - User authentication information
- `profiles` - User profile details
- `categories` - Transaction categories
- `transactions` - Individual financial transactions
- `recurring_transactions` - Scheduled recurring transactions
- `settings` - User preferences and settings

---

## API Endpoints Reference

For a complete list of API endpoints and their documentation, refer to the backend routes files:

- `backend/routes/auth.js` - Authentication endpoints
- `backend/routes/transactions.js` - Transaction management
- `backend/routes/categories.js` - Category management
- `backend/routes/recurringTransactions.js` - Recurring transaction management
- `backend/routes/profile.js` - User profile management
