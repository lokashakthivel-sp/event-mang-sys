# CSEA Event Management System — Backend

Backend REST API for managing CSEA events and student registrations, built with Node.js, TypeScript, Express, and Firebase Firestore.

---

## Tech Stack

| Layer        | Tool                              |
|--------------|-----------------------------------|
| Runtime      | Node.js v20+                      |
| Language     | TypeScript                        |
| Framework    | Express.js                        |
| Database     | Firebase Firestore (Cloud)        |
| Auth         | JWT (jsonwebtoken)                |
| Validation   | Zod                               |
| Password     | bcryptjs                          |
| Dev Server   | tsx + nodemon                     |

---

## Database

Firebase Firestore (NoSQL) is used as the database, hosted on Google Cloud.

### Collections

**`students`**
| Field        | Type      | Notes                        |
|--------------|-----------|------------------------------|
| name         | string    |                              |
| email        | string    | unique, enforced in app layer|
| password     | string    | bcrypt hashed                |
| rollNumber   | string    | unique, enforced in app layer|
| role         | string    | `"student"` or `"admin"`     |
| createdAt    | timestamp |                              |

**`events`**
| Field           | Type      | Notes                    |
|-----------------|-----------|--------------------------|
| title           | string    |                          |
| description     | string    |                          |
| date            | string    | ISO 8601, must be future |
| venue           | string    |                          |
| maxParticipants | number    |                          |
| createdBy       | string    | ref → students/{id}      |
| createdAt       | timestamp |                          |

**`registrations`**
| Field        | Type      | Notes               |
|--------------|-----------|---------------------|
| eventId      | string    | ref → events/{id}   |
| studentId    | string    | ref → students/{id} |
| registeredAt | timestamp |                     |

> Uniqueness of `(eventId, studentId)` pairs and `maxParticipants` limits are enforced at the application layer.

---

## Project Structure

```
src/
├── config/
│   └── firebase.ts               # Firebase Admin SDK init + collection refs
├── controllers/
│   ├── auth.controller.ts        # register, login
│   ├── event.controller.ts       # CRUD for events
│   └── registration.controller.ts
├── middleware/
│   ├── auth.middleware.ts        # JWT verify + requireRole()
│   └── validate.middleware.ts    # Zod request body validation
├── routes/
│   ├── auth.routes.ts
│   ├── event.routes.ts
│   └── registration.routes.ts
├── validators/
│   ├── auth.validator.ts         # Zod schemas + inferred TS types
│   └── event.validator.ts
├── types/
│   └── index.ts                  # Shared interfaces
└── app.ts                        # Express app entry point
seeds/
├── seed-admin.ts                 # Seeds admin accounts into Firestore
├── seed-events.ts                # Seeds sample events into Firestore
└── seed.ts                       # Verifies Firestore connection
```

---

## Setup & Execution

### Prerequisites

- Node.js v20 or higher
- A Firebase project with Firestore enabled

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd csea-event-backend
npm install
```

### 2. Firebase setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a project → Enable **Firestore Database** (start in test mode)
3. Go to **Project Settings → Service Accounts → Generate new private key**
4. Copy the values from the downloaded JSON into your `.env` file

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

```env
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
```

> ⚠️ Never commit `.env` to version control. It is in `.gitignore` by default.

### 4. Seed the database

Run these in order:

```bash
# Verify Firebase connection
npx tsx seed.ts

# Create the default admin account (edit seed-admin.ts to change credentials)
npx tsx seed-admin.ts

# Seed sample CSEA events
npx tsx seed-events.ts
```

Default admin credentials:
```
email:    admin@csea.com
password: admin@123
```

### 5. Start the server

```bash
# Development (hot reload)
npm run dev

# Production
npm run build
npm start
```

Server runs at `http://localhost:3000`. Health check: `GET /health`

---

## Roles & Access

| Action                  | Student | Admin |
|-------------------------|---------|-------|
| Register / Login        | ✅      | ✅    |
| View events             | ✅      | ✅    |
| Create / Update / Delete event | ❌ | ✅ |
| Register for an event   | ✅      | ❌    |
| View participants       | ❌      | ✅    |

> Admin accounts can only be created by running `seed-admin.ts` directly. The registration API always creates `student` role accounts.

---

## Postman Collection

Import the collection to test all endpoints:

> 📮 **[CSEA Event Management — Postman Collection](https://lokashakthivelsp-4718987.postman.co/workspace/Lokashakthivel-SP's-Workspace~ae609199-804a-4746-8d89-c285c81860d9/collection/49536015-14c9840a-6500-432b-ab80-60590d01cd13?action=share&source=copy-link&creator=49536015)**

**Setup before running:**
1. Set the `baseUrl` collection variable to `http://localhost:3000`
2. Run **Login Admin** → token is saved automatically
3. Run **Login Student** → token is saved automatically
4. All protected routes use the saved tokens — no manual copy-paste needed

---

## Error Response Format

All errors follow a consistent shape:

```json
{
  "success": false,
  "message": "Human-readable error message.",
  "errors": { "field": ["error detail"] }
}
```

`errors` is only present on validation failures (HTTP 400).