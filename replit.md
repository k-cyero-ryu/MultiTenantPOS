# Multi-Tenant Subsidiary Management System

## Overview

This is a comprehensive multi-tenant web application built for managing a network of subsidiary companies under a Main Head Company (MHC). The system provides role-based access control, inventory management, sales tracking, and comprehensive reporting capabilities across multiple subsidiaries while maintaining data isolation and security.

## System Architecture

### Technology Stack
- **Frontend**: React with TypeScript, Vite, and TailwindCSS
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL (configurable to MySQL via Drizzle ORM)
- **Authentication**: Passport.js with local strategy
- **UI Components**: Radix UI with shadcn/ui design system
- **Internationalization**: i18next with support for English, Spanish, French, and Portuguese
- **Charts & Analytics**: Recharts
- **PDF Generation**: @react-pdf/renderer

### Architecture Pattern
- **Monorepo Structure**: Shared schema and types between client and server
- **Multi-tenant**: Isolated data per subsidiary with MHC oversight
- **Role-based Access Control**: Three primary roles (MHC Admin, Subsidiary Admin, Staff)
- **RESTful API**: Express routes with middleware for authentication and authorization

## Key Components

### Authentication & Authorization
- **Session-based Authentication**: Using express-session with configurable session stores
- **Password Security**: Scrypt-based password hashing with salt
- **Role-based Middleware**: Different access levels for MHC and subsidiary operations
- **Multi-tenant Access Control**: Users are scoped to specific subsidiaries

### Database Layer
- **ORM**: Drizzle ORM with support for both PostgreSQL and MySQL
- **Multi-database Support**: Configurable database engine via `db.config.js`
- **Schema Management**: Centralized schema definitions in `shared/schema.ts`
- **Connection Pooling**: Optimized database connections for both database types

### Frontend Components
- **Responsive Design**: Mobile-first approach with Radix UI components
- **Tour System**: Interactive onboarding with step-by-step tooltips
- **Language Support**: Complete i18n implementation with language selector
- **Real-time Analytics**: Dashboard with charts and KPI tracking
- **Form Management**: React Hook Form with Zod validation

### File Upload System
- **Image Processing**: Multer-based file uploads for subsidiary logos
- **Type Validation**: Restricted to JPEG and PNG formats
- **Storage Management**: Local file system storage with organized directory structure

## Data Flow

### Multi-tenant Data Isolation
1. **MHC Level**: Access to all subsidiaries and global analytics
2. **Subsidiary Level**: Isolated access to own data only
3. **User Scoping**: Database queries filtered by user's subsidiary association

### Request Flow
1. **Authentication Middleware**: Validates user session
2. **Authorization Middleware**: Checks role-based permissions
3. **Tenant Filtering**: Applies subsidiary-specific data filters
4. **Business Logic**: Processes requests with appropriate data scope
5. **Response**: Returns filtered data based on user permissions

### Activity Logging
- **Comprehensive Audit Trail**: All CRUD operations logged with user attribution
- **Immutable Logs**: Activity records for compliance and security
- **Real-time Tracking**: Live activity feeds for administrative oversight

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL support
- **@tanstack/react-query**: Data fetching and caching
- **@radix-ui/***: Accessible UI component primitives
- **drizzle-orm**: Type-safe ORM with multi-database support
- **passport**: Authentication middleware
- **multer**: File upload handling
- **recharts**: Data visualization components

### Development Tools
- **TypeScript**: End-to-end type safety
- **Vite**: Fast development and build tooling
- **TailwindCSS**: Utility-first styling
- **ESBuild**: Production bundling for server code

## Deployment Strategy

### Environment Configuration
- **Database Flexibility**: Support for both PostgreSQL (via DATABASE_URL) and MySQL
- **Session Management**: Configurable session stores (memory for development, PostgreSQL for production)
- **File Storage**: Local filesystem with configurable upload directories
- **Environment Variables**: Comprehensive environment-based configuration

### Production Considerations
- **Database Connection Pooling**: Optimized for concurrent users
- **Session Store**: PostgreSQL-backed sessions for scalability
- **Static File Serving**: Express static middleware for uploaded assets
- **Build Process**: Separate client and server builds with optimized output

### Scalability Features
- **Horizontal Scaling**: Stateless session management with external session store
- **Database Optimization**: Connection pooling and query optimization
- **Multi-tenant Architecture**: Efficient data isolation without database-per-tenant overhead

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- June 28, 2025. Initial setup