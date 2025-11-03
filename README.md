# 🎟️ Eventonica

Eventonica is a full-stack event management platform designed to simplify the entire event lifecycle, from planning and promotion to ticketing, real-time updates, and post-event analytics. It supports multiple user roles (organizers, attendees, vendors, and admins) and offers powerful tools for event creation, live announcements, QR-code check-ins, and data-driven reporting.

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-4.x-blue)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://www.postgresql.org/)
[![JWT](https://img.shields.io/badge/Auth-JWT-yellow)](https://jwt.io/)
[![Nodemailer](https://img.shields.io/badge/Email-Nodemailer-orange)](https://nodemailer.com/)
[![OOP](https://img.shields.io/badge/Pattern-OOP-black)](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Object-oriented_JS)

## 🛠 Tech Stack
**Frontend**  

- React (Vite)  
- React Router DOM  
- CSS Modules  
- Fetch API

**Backend**  

- Node.js  
- Express.js  
- PostgreSQL  
- JWT Authentication  
- Nodemailer + Ethereal (for email notifications)  

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/Eventonica.git
cd Eventonica
```

---

### 2. Backend Setup

Navigate to the backend folder:

```bash
cd apps/server
```

#### Install dependencies

```bash
npm install
```

#### Create a `.env` file

```env
DATABASE_URL=postgresql://youruser@localhost:5432/eventonica
JWT_SECRET=your_jwt_secret
ETHEREAL_USER=your_generated_ethereal_user
ETHEREAL_PASS=your_generated_ethereal_password
PORT=4000
```

#### Run migrations and seed the database

```bash
npm run db:migrate
npm run db:seed
```

#### Start the backend server

```bash
npm run dev
```

Your API should now be running at:  
👉 **http://localhost:4000/api**

---

### 3. Frontend Setup

Open a new terminal and go to the frontend folder:

```bash
cd apps/client
```

#### Install dependencies

```bash
npm install
```

#### Create a `.env` file for frontend

```env
VITE_API_URL=http://localhost:4000/api
```

#### Run the development server

```bash
npm run dev
```

Then open the link shown in your terminal (usually http://localhost:5173).
---

## 🧪 API Overview

| Method     | Endpoint                            | Description                         | Auth            |
| ---------- | ----------------------------------- | ----------------------------------- | --------------- |
| **POST**   | `/api/auth/register`                | Register new user                   | Public          |
| **POST**   | `/api/auth/login`                   | Login user, return JWT              | Public          |
| **GET**    | `/api/events`                       | List all published events           | Public          |
| **POST**   | `/api/events`                       | Create event                        | Organizer/Admin |
| **PATCH**  | `/api/events/:id`                   | Update event                        | Organizer/Admin |
| **DELETE** | `/api/events/:id`                   | Delete event                        | Organizer/Admin |
| **POST**   | `/api/events/:eventId/ticket-types` | Create ticket type                  | Organizer       |
| **PATCH**  | `/api/ticket-types/:id`             | Update ticket type                  | Organizer       |
| **POST**   | `/api/events/:id/checkout`          | Register attendee / purchase ticket | Attendee        |
| **POST**   | `/api/checkin`                      | Check in ticket by token            | Organizer       |
| **GET**    | `/api/events/:id/analytics`         | Analytics summary                   | Organizer/Admin |
| **POST**   | `/api/events/:id/announcements`     | Post event update                   | Organizer/Admin |
| **GET**    | `/api/events/:id/announcements`     | List event updates                  | Public          |
| **GET**    | `/api/me/notifications`             | Fetch user notifications            | Authenticated   |
| **POST**   | `/api/events/:id/vendors`           | Assign vendor                       | Organizer/Admin |
| **GET**    | `/api/events/:id/vendors`           | List event vendors                  | Public          |

---

## 🧩 Database Schema (Simplified)

- **users** — id, name, email, password_hash, roles  
- **events** — id, title, description, organizer_id, start_time, end_time  
- **ticket_types** — id, name, price_cents, quantity, event_id  
- **orders** — id, user_id, event_id, total_amount  
- **tickets** — id, order_id, user_id, event_id, ticket_type_id, qr_code  
- **event_assignments** — event_id, user_id, role (`vendor`)  
- **notifications** — id, user_id, event_id, type, payload, read_at  
- **event_updates** — id, event_id, message, created_by  

## 🙌 Acknowledgements

- [Nodemailer + Ethereal](https://ethereal.email/) for test email alerts  