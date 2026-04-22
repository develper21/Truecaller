# CallerID App

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue.svg)](https://reactnative.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-10.3+-red.svg)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7+-red.svg)](https://redis.io/)

A comprehensive mobile application for caller identification, spam detection, and communication management, inspired by Truecaller. Built with React Native (Expo) for the frontend and NestJS for the backend, this app provides a robust platform for managing calls, messages, contacts, and user profiles with advanced spam analytics.

## Features

### Core Functionality

- **Caller Identification**: Real-time caller ID with contact lookup and spam detection
- **Call Management**: Detailed call logs, favorites, and call blocking
- **Messaging**: Integrated messaging system with real-time chat
- **Spam Analytics**: Advanced spam detection and reporting with ML-powered analysis
- **Contact Management**: Sync and manage contacts with profile information
- **Business Profiles**: Dedicated profiles for businesses with verification

### User Experience

- **Intuitive UI**: Glass morphism design with smooth animations and haptic feedback
- **Multi-language Support**: Localized interface for global users
- **Dark/Light Mode**: Automatic theme switching based on system preferences
- **Push Notifications**: Real-time notifications for calls, messages, and updates
- **Offline Support**: Core features work offline with data synchronization

### Security & Privacy

- **JWT Authentication**: Secure user authentication with token-based sessions
- **Data Encryption**: End-to-end encryption for sensitive data
- **Privacy Controls**: Granular privacy settings and data management
- **GDPR Compliance**: Built with privacy regulations in mind

### Advanced Features

- **WebSocket Integration**: Real-time communication for live updates
- **File Upload**: Profile pictures and document management via AWS S3
- **SMS Integration**: Twilio-powered SMS services for OTP and notifications
- **Redis Caching**: High-performance caching for improved response times
- **Rate Limiting**: API protection with configurable rate limits

## Tech Stack

### Frontend (Mobile App)

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Routing**: Expo Router
- **State Management**: TanStack Query (React Query)
- **UI Components**: Custom glass morphism components
- **Real-time Communication**: Socket.io Client
- **Storage**: AsyncStorage for local data persistence
- **Notifications**: Expo Notifications
- **Image Handling**: Expo Image Picker and AWS S3

### Backend (API Server)

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with Passport.js
- **Caching**: Redis
- **File Storage**: AWS S3
- **SMS Service**: Twilio
- **Real-time**: Socket.io
- **Validation**: Class Validator and Zod
- **Documentation**: Swagger/OpenAPI

### DevOps & Tools

- **Containerization**: Docker & Docker Compose
- **Database Migration**: Drizzle Kit
- **Testing**: Jest for unit and e2e tests
- **Linting**: ESLint with TypeScript rules
- **Build Tools**: Metro (React Native), Nest CLI
- **Version Control**: Git

## Prerequisites

Before running this application, ensure you have the following installed:

- **Node.js**: Version 18 or higher
- **npm** or **yarn**: Package manager
- **Expo CLI**: For React Native development
- **Docker**: For running PostgreSQL and Redis
- **PostgreSQL**: Version 15+ (if running locally)
- **Redis**: Version 7+ (if running locally)

### Environment Setup

1. Clone the repository
2. Install dependencies for both frontend and backend
3. Set up environment variables (see \`.env.example\` files)
4. Configure AWS S3, Twilio, and other third-party services

## Installation

### Backend Setup

1. Navigate to the server directory:
   \`\`\`bash
   cd server
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Set up environment variables:
   Create a \`.env\` file in the \`server\` directory with the following variables:
   \`\`\`env
   DATABASE_URL=postgresql://user:password@localhost:5432/callerid_db
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your_jwt_secret
   AWS_ACCESS_KEY_ID=your_aws_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret
   AWS_REGION=your_aws_region
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   TWILIO_PHONE_NUMBER=your_twilio_number
   \`\`\`

4. Start Docker services (PostgreSQL and Redis):
   \`\`\`bash
   docker-compose up -d
   \`\`\`

5. Run database migrations:
   \`\`\`bash
   npm run db:migrate
   \`\`\`

6. Start the development server:
   \`\`\`bash
   npm run start:dev
   \`\`\`

The backend API will be available at \`<http://localhost:3000\`>.

### Frontend Setup

1. Navigate to the root directory:
   \`\`\`bash
   cd ..
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Configure environment variables:
   Create an \`expo-env.d.ts\` file or set environment variables for API endpoints.

4. Start the Expo development server:
   \`\`\`bash
   npm run dev
   \`\`\`

5. Run on device/simulator:
   - For iOS: Press \`i\` in the terminal
   - For Android: Press \`a\` in the terminal
   - For Web: Press \`w\` in the terminal

## Usage

### Mobile App

1. Launch the app on your device
2. Complete the onboarding process
3. Grant necessary permissions (contacts, phone, notifications)
4. Sign up or log in to access features
5. Explore tabs: Home, Messages, Premium, Profile, Search

### API Documentation

The backend provides comprehensive API documentation via Swagger. When the server is running, visit:
\`\`\`
<http://localhost:3000/api>
\`\`\`

### Key Endpoints

- \`POST /auth/login\` - User authentication
- \`GET /call-logs\` - Retrieve call history
- \`POST /spam-reports\` - Report spam numbers
- \`GET /profiles/{id}\` - Get user profile
- \`WebSocket /gateway\` - Real-time communication

## Development

### Running Tests

\`\`\`bash

## Backend tests

cd server
npm run test

E2E tests
npm run test:e2e
\`\`\`

### Database Management

\`\`\`bash
Generate migration
npm run db:generate

## Push schema changes

npm run db:push

## Open Drizzle Studio

npm run db:studio
\`\`\`

## Code Quality

\`\`\`bash

## Lint code

npm run lint

## Type checking

npm run typecheck
\`\`\`

## Deployment

### Backend Deployment

1. Build the application:
   \`\`\`bash
   npm run build
   \`\`\`

2. Use Docker for containerized deployment:
   \`\`\`bash
   docker build -t callerid-backend .
   docker run -p 3000:3000 callerid-backend
   \`\`\`

### Mobile App Deployment

1. Build for production:
   \`\`\`bash
   npm run build
   \`\`\`

2. Deploy to Expo:
   \`\`\`bash
   expo publish
   \`\`\`

3. Build native apps:
   \`\`\`bash
   expo build:ios
   expo build:android
   \`\`\`

## Contributing

We welcome contributions to the CallerID App! Please follow these steps:

1. Fork the repository
2. Create a feature branch: \`git checkout -b feature/your-feature\`
3. Commit your changes: \`git commit -m 'Add some feature'\`
4. Push to the branch: \`git push origin feature/your-feature\`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation as needed
- Ensure code passes linting and type checking

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:

- Create an issue on GitHub
- Contact the development team
- Check the API documentation for integration help

## Acknowledgments

- Inspired by Truecaller for caller ID functionality
- Built with modern web technologies and best practices
- Thanks to the open-source community for the amazing tools and libraries
