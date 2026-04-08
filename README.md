
# Chip-Ledger

## Overview

Chip-Ledger is a secure web application for tracking chip/gaming activity. Users can register, log in with hashed passwords, and manage their account with persistent session management. Built with Node.js, Express, and PostgreSQL, the application is containerized with Docker for seamless deployment.

## Features

- **User Authentication**: Secure login and registration with password hashing
- **Session Management**: Users stay logged in across sessions
- **Responsive UI**: Multi-page interface with Handlebars templating
- **Database**: PostgreSQL for storing user and activity data
- **Docker Deployment**: Containerized for portable, consistent environments
- **RESTful API**: Server communicates with frontend through API endpoints

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, Handlebars (HBS) |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Authentication | bcrypt (password hashing) |
| Container | Docker & Docker Compose |
| Testing | Mocha, Chai |
| Deployment | Render |

## Team Members

- Diyora Daminova
- Nicole Reiner
- Aiden English
- Brady Hormuth
- Hasan Kobeissy
- Trace Rindal

## Prerequisites

Before running this project locally, ensure you have installed:

- **Docker** ([Download](https://www.docker.com/products/docker-desktop))
- **Docker Compose** (included with Docker Desktop)
- **Git** ([Download](https://git-scm.com/))
- **Node.js** v16+ ([Download](https://nodejs.org/)) - for local development only

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Medoriku/Chip-Ledger.git
cd Chip-Ledger
```

### 2. Navigate to Project Source

```bash
cd ProjectSourceCode
```

### 3. Create Environment Variables

Create a `.env` file in the `ProjectSourceCode` directory:

```env
DB_HOST=db
DB_PORT=5432
DB_NAME=chip_ledger
DB_USER=postgres
POSTGRES_PASSWORD=yourpassword
DB_DIALECT=postgres
NODE_ENV=development
SESSION_SECRET=your_session_secret_key
```

### 4. Start with Docker Compose

```bash
docker-compose up
```

The application will be available at: **http://localhost:3000**

### 5. Access the Application

- **Home Page**: http://localhost:3000/
- **Register**: http://localhost:3000/register
- **Login**: http://localhost:3000/login

## How to Use

### For Users

1. **Register**: Create a new account on the registration page
2. **Login**: Use your credentials to log in securely
3. **Dashboard**: View and manage your chip activity
4. **Logout**: Securely end your session

### For Developers

#### Run Tests

```bash
npm test
```

Tests are located in `test/server.spec.js` and use Mocha and Chai.

#### View Database

Access PostgreSQL inside Docker:

```bash
docker exec -it chip-ledger-db-1 psql -U postgres -d chip_ledger
```

Then run SQL queries to inspect data.

#### Hot Reload (Development)

The Docker container mounts local code, so changes are reflected immediately without rebuilding.

#### Stop the Application

```bash
docker-compose down
```

To remove volumes and reset database:

```bash
docker-compose down -v
```

## Project Structure

```
Chip-Ledger/
├── TeamMeetingLogs/           # Weekly meeting notes
├── MilestoneSubmissions/      # Releases and documentation
└── ProjectSourceCode/
    ├── docker-compose.yaml    # Docker configuration
    ├── .gitignore             # Git ignore rules
    ├── package.json           # Node dependencies
    ├── src/
    │   ├── index.js           # Server entry point
    │   ├── views/
    │   │   ├── pages/         # Login, register, home pages
    │   │   ├── partials/      # Header, footer components
    │   │   └── layouts/       # Main layout template
    │   ├── resources/
    │   │   ├── css/           # Stylesheets
    │   │   ├── js/            # Client-side scripts
    │   │   └── img/           # Images
    │   └── init_data/
    │       ├── create.sql     # Database schema
    │       └── insert.sql     # Initial data
    └── test/
        └── server.spec.js     # Test cases
```

### GitHub
- [Repository](https://github.com/Medoriku/Chip-Ledger)
- [Project Board](https://github.com/Medoriku/Chip-Ledger/projects)
- [Issues & Milestones](https://github.com/Medoriku/Chip-Ledger/issues)

### Deployment
- TBD 

### Documentation
- [Express.js Docs](https://expressjs.com/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Handlebars Docs](https://handlebarsjs.com/)
- [Bcrypt Guide](https://github.com/kelektiv/node.bcrypt.js)
- [Docker Docs](https://docs.docker.com/)

## Git Workflow

We follow a feature branch workflow:

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Commit regularly** with descriptive messages:
   ```bash
   git commit -m "Add login validation - closes #5"
   ```

3. **Push to remote**:
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Open a Pull Request** for code review
5. **Merge after approval** into `main`

## Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test

```bash
npm test -- --grep "login"
```

### Expected Test Output

All tests should pass before merging to `main`. Coverage reports are generated in the `coverage/` folder.

## Troubleshooting

### Docker container won't start
```bash
docker-compose down -v
docker-compose up --build
```

### Database connection error
Check `.env` file matches `docker-compose.yaml` values.

### Port 3000 already in use
Change the port in `docker-compose.yaml`:
```yaml
ports:
  - '3001:3000'  # Change 3001 to another free port
```

## License
This project is part of CSCI 3308 (CU Boulder). 

**Last Updated**: March 25, 2026  
**Status**: In Development
