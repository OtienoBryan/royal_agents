# Drinks Admin Panel

A comprehensive admin panel for managing the Drinks e-commerce platform, built with React, TypeScript, and Tailwind CSS.

## Features

- **Dashboard**: Overview of key metrics and recent activity
- **Products Management**: Create, edit, delete, and manage products
- **Categories Management**: Organize products into categories
- **Orders Management**: View and update order statuses
- **Users Management**: Manage customer accounts and permissions
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Beautiful, intuitive interface with smooth animations

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **State Management**: React Context API

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Backend API running on port 3001

### Installation

1. Navigate to the admin directory:
   ```bash
   cd admin
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3002`

### Default Login Credentials

- **Email**: admin@drinks.com
- **Password**: admin123

## Project Structure

```
admin/
├── src/
│   ├── components/          # Reusable UI components
│   │   └── Layout.tsx      # Main layout with sidebar navigation
│   ├── contexts/           # React Context providers
│   │   └── AuthContext.tsx # Authentication context
│   ├── pages/              # Page components
│   │   ├── Dashboard.tsx   # Dashboard overview
│   │   ├── Products.tsx    # Products management
│   │   ├── Categories.tsx  # Categories management
│   │   ├── Orders.tsx      # Orders management
│   │   ├── Users.tsx       # Users management
│   │   └── Login.tsx       # Login page
│   ├── services/           # API services
│   │   └── api.ts          # Admin API service
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # App entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── package.json            # Dependencies and scripts
├── vite.config.ts         # Vite configuration
├── tailwind.config.ts     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

## Features Overview

### Dashboard
- Key metrics overview (products, categories, orders, users)
- Recent orders list
- Featured products
- Quick action buttons

### Products Management
- View all products in a table format
- Search and filter products
- Add new products with detailed information
- Edit existing products
- Delete products
- Product status management (active/inactive, featured)

### Categories Management
- View all categories in a grid layout
- Add new categories
- Edit existing categories
- Delete categories
- Category status management

### Orders Management
- View all orders in a table format
- Search and filter orders
- Update order status and payment status
- View detailed order information
- Delete orders

### Users Management
- View all users in a table format
- Search and filter users
- View detailed user information
- Toggle user active/inactive status
- Delete users

## API Integration

The admin panel integrates with the backend API through the `adminApiService`. All API calls are made to `/api` endpoints which are proxied to the backend server running on port 3001.

### Available Endpoints

- **Categories**: `/api/categories`
- **Products**: `/api/products`
- **Orders**: `/api/orders`
- **Users**: `/api/users`
- **Authentication**: `/api/auth/admin/login`

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

The project uses ESLint for code linting and follows React and TypeScript best practices. All components are written in TypeScript with proper type definitions.

## Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. The built files will be in the `dist` directory

3. Deploy the `dist` directory to your web server

## Contributing

1. Follow the existing code style
2. Add proper TypeScript types
3. Test your changes thoroughly
4. Update documentation if needed

## License

This project is part of the Drinks e-commerce platform.
