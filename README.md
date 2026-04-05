# 📅 EventBridge

A full-stack, production-style two-sided marketplace for booking event vendors. Customers browse vendors, request bookings, track spending against a party budget, message vendors, and pay confirmed bookings — all in one place.

Designed with strong emphasis on data integrity, transactional consistency, and scalable backend architecture. Built with Spring Boot, PostgreSQL, and React.

---

## 🚀 Key Highlights

- Full-stack marketplace with customer + vendor workflows
- Enforced booking lifecycle using a backend state machine (prevents invalid transitions and race conditions)
- Real-time messaging system with file attachments
- Budget tracking and mock payment integration
- PostgreSQL constraints preventing double-booking

---

## 🧾 Overview

EventBridge solves a real coordination problem in event planning: managing multiple vendors across separate conversations with no centralized view of booking status or spending.

Customers can browse vendors, request bookings, communicate directly, and track budgets, while vendors manage requests and monitor analytics from a dedicated dashboard.

---

## 📸 Demo

### Home
![Home](screenshots/home.png)

### Marketplace
![Marketplace](screenshots/marketplace.png)

### Vendor Profile & Booking
![Vendor Profile](screenshots/vendor-profile.png)

### My Parties — Budget Tracker
![My Parties](screenshots/my-parties.png)

### Messaging
![Messages](screenshots/messages.png)

### Vendor Dashboard
![Vendor Dashboard](screenshots/vendor-dashboard.png)

---

## ✨ Features

### 🏪 Marketplace & Discovery
- Browse vendors by name, category, or city
- Dynamic filtering with responsive UI

### 📅 Booking System
- Calendar-based booking requests
- Prevents duplicate bookings per vendor and date
- Lifecycle: `REQUESTED → APPROVED → CONFIRMED → CANCELLED`

### 💬 Messaging
- Real-time messaging between customers and vendors
- Supports file attachments

### 💳 Payment Flow
- Mock checkout system
- Tracks payment state (`UNPAID → PAID`)
- Automatically confirms bookings after payment

### 📊 Analytics
- Conversion rate tracking
- Booking trends and upcoming events

---

## 🧠 Key Technical Decisions

### Database-level duplicate prevention
A composite unique constraint on `(vendor_id, event_date)` prevents double-booking at the database level, ensuring correctness even under concurrent requests.

### Booking state machine
Bookings move through controlled states:

```
REQUESTED → APPROVED → CONFIRMED
               ↓
           CANCELLED
```

The `BookingStateService` enforces valid transitions and prevents invalid state changes. It also runs a normalization pass on startup via `@EventListener(ApplicationReadyEvent.class)` to repair any inconsistent states left in the database from prior sessions.

### Data integrity validation
When a customer links a booking to a party, the backend validates two conditions: the booking email must match the party's customer email, and the booking date must match the party's event date. Both checks prevent a customer from accidentally connecting a booking to the wrong event.

### Payment flow design
- Validates card format and stores last 4 digits
- Timestamps the payment with `paidAt`
- Transitions booking to `CONFIRMED` with `PaymentStatus.PAID`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Java 17, Spring Boot, Spring Data JPA |
| Database | PostgreSQL |
| Frontend | React, JavaScript, Vite |
| API | REST |

---

## ⚙️ Running Locally

**Clone the repo**
```bash
git clone https://github.com/tammamahad/eventbridge.git
cd eventbridge
```

**Run the backend**
```bash
./mvnw spring-boot:run
```
Backend runs at `http://localhost:9090`

**Run the frontend**
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`

> Requires a running PostgreSQL instance. Update `src/main/resources/application.properties` with your database credentials before running.

---

## 🧠 What I Learned

- Designing a state-driven booking lifecycle to prevent invalid transitions
- Enforcing data integrity using both application logic and database constraints
- Managing relationships between bookings, parties, and vendors
- Building a full-stack system with synchronized frontend and backend state

---

## ⚠️ Known Limitations

- **No authentication** — the app uses email as a customer identifier and vendor ID as a session marker. A real deployment would require JWT-based auth with role separation.
- **Reviews are not gated** — any user can review any vendor regardless of booking history. In production, reviews should only be available after a completed booking.
- **Mock payments only** — the checkout flow validates card format and records payment state but does not process real transactions. Stripe would replace this.
- **Missing `@Transactional` boundaries** — operations that touch multiple tables (booking + party linking) should be wrapped in `@Transactional` to prevent partial writes under failure.

---

## 🔮 Future Improvements

- Authentication (JWT / role-based access)
- Stripe payment integration
- Notifications (email / in-app)
- Cloud deployment

---

## 👨‍💻 Author

**Tammam Ahad**  
Computer Science — Wayne State University  
[github.com/tammamahad](https://github.com/tammamahad)
