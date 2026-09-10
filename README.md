# 🚨 Campus SOS Circle

> **One Campus. One Circle. Help When It Matters.**

Campus SOS Circle is a modern **MERN + AI campus safety and assistance platform** designed to connect students, responders, campus security, and administrators through real-time emergency response, intelligent campus navigation, and AI-powered assistance.

The goal is to provide a single platform where students can quickly request help, discover nearby campus facilities, report incidents, and communicate with an AI campus assistant.

---

## 🌟 Vision

Campus SOS Circle aims to create a safer and more connected campus by combining:

* 🚨 Instant SOS
* 📍 Real-time location
* 🗺️ Smart campus mapping
* 👤 Nearby responder detection
* ⚡ Real-time notifications
* 🤖 AI-powered campus assistant
* 🧠 AI incident classification
* 📊 Safety analytics
* ☁️ Cloud image storage
* 🔐 Secure role-based authentication

---

# ✨ Features

## 👨‍🎓 Student

Students can:

* Register using their college email
* Create their own password
* Login securely
* Trigger an SOS
* Share current location during an active SOS
* Find nearby campus facilities
* View campus map
* See approximate distance to locations
* Report non-emergency incidents
* Upload incident images
* Track SOS status
* Receive real-time notifications
* Chat with Circle AI
* View emergency contacts
* Manage their profile

Example:

```text
📍 Your Location

B Block Library
80 m away

Medical Center
210 m away

Security Office
320 m away
```

---

# 🚨 SOS System

The SOS system is the core feature of Campus SOS Circle.

### Flow

```text
Student
   ↓
Press SOS
   ↓
Select emergency type
   ↓
Capture current location
   ↓
Create SOS
   ↓
Backend
   ↓
Socket.IO
   ↓
Nearby responders notified
   ↓
Security/Admin notified
   ↓
Responder accepts
   ↓
Student sees live status
   ↓
Incident resolved
```

### SOS Categories

* Medical
* Security
* Accident
* Fire
* Harassment
* Lost Person
* Other

### SOS Status

```text
PENDING
    ↓
ACKNOWLEDGED
    ↓
ASSIGNED
    ↓
RESPONDER_ON_THE_WAY
    ↓
ARRIVED
    ↓
RESOLVED
```

---

# 📍 Smart Campus Location

Campus SOS Circle uses the student's device location together with campus information stored by the administrator.

### Student GPS

Example:

```text
Latitude: 17.4486
Longitude: 78.3908
```

### Admin Campus Data

Example:

```text
B Block Library
Latitude: 17.4491
Longitude: 78.3912
Type: Library
```

The backend calculates the distance between the two coordinates.

Result:

```text
📚 B Block Library
Approximately 80 m away
```

---

# 🗺️ Campus Map

The application uses:

* Leaflet
* OpenStreetMap

The map can display:

* Student location
* Campus buildings
* Libraries
* Medical centers
* Security offices
* Hostels
* Canteens
* Parking
* Emergency points
* Available responders
* Active SOS locations

Campus locations are managed by administrators rather than hardcoded into the frontend.

---

# 🏫 Admin Campus Management

Administrators can create and manage campus locations.

Each location can contain:

```text
Name
Type
Description
Latitude
Longitude
Building
Floor
Room
Image
Contact
Operating Hours
Status
```

Admins can select a location directly on the map to obtain coordinates.

---

# 👤 Responder System

Responders can:

* Set availability
* Receive nearby SOS alerts
* View incident details
* Accept SOS requests
* Update response status
* View student location when authorized
* Mark arrival
* Resolve incidents
* View response history

Responder assignment considers:

* Availability
* Distance
* Incident type
* Current workload
* Responder capabilities

---

# 🛡️ Security Dashboard

Security users can monitor:

* Active SOS
* Active incidents
* Campus map
* Incident severity
* Assigned responders
* Response status
* Incident history

Filters include:

```text
All
Medical
Security
Fire
Accident
High Priority
Active
Resolved
```

---

# 👨‍💼 Admin Dashboard

The admin dashboard acts as the campus safety command center.

It includes:

* Total students
* Active SOS
* Open incidents
* Resolved incidents
* Average response time
* Available responders
* Live campus map
* Incident analytics
* SOS trends
* High-risk locations
* Responder performance
* AI-generated insights

---

# 🤖 Circle AI

Circle AI is the AI assistant inside Campus SOS Circle.

It is powered by the Gemini API.

The AI assistant can help students with:

* Campus information
* Finding facilities
* Emergency procedures
* Reporting incidents
* Understanding SOS
* General campus assistance

### Example

Student:

```text
Where is the medical center?
```

Circle AI:

```text
The Medical Center is approximately
210 m from your current location.

🏥 Medical Center

[View on Map]
[Get Directions]
[Call]
[SOS]
```

---

# 🧠 AI Incident Classification

AI can help classify incident reports.

Example input:

```text
There is smoke coming from the electrical
room near B Block.
```

Possible structured output:

```text
Category:
Fire

Severity:
High

Summary:
Possible smoke/fire incident near B Block.

Recommended Handling:
Immediate security response.
```

AI assists with classification and summarization.

Safety-critical decisions remain controlled by authorized humans and backend business rules.

---

# 📊 AI Safety Insights

The admin dashboard can use actual incident data to generate insights.

Example:

```text
AI Safety Insight

Security incidents increased around
Hostel Gate during evening hours.

Most common incident:
Medical

Peak incident period:
6 PM – 9 PM
```

AI must not invent statistics.

Insights must be based on actual application data.

---

# 📧 Student Email System

Student registration uses a configurable college email format.

Default domain:

```text
@anurag.edu.in
```

Examples:

```text
23eg105a50@anurag.edu.in
24eg110a50@anurag.edu.in
26eg107g27@anurag.edu.in
```

The email configuration is managed by the administrator.

Admin can configure:

```text
College Domain
Email Pattern
Registration Rules
Self Registration
```

Example pattern:

```text
{rollNumber}@anurag.edu.in
```

The domain and validation rules must not be permanently hardcoded into business logic.

---

# 🔐 Authentication

Authentication uses:

* JWT
* bcrypt/Argon2
* Role-based access control

Supported roles:

```text
STUDENT
RESPONDER
SECURITY
ADMIN
```

Passwords are hashed before being stored.

Plaintext passwords are never stored.

---

# ☁️ Image Upload

Cloudinary is used for image storage.

Images can be uploaded for:

* Profile photos
* Incident reports
* Campus locations
* Other authorized content

MongoDB stores image URLs and metadata rather than large image binaries.

---

# ⚡ Real-Time Communication

Socket.IO is used for real-time functionality.

Examples:

```text
Student creates SOS
        ↓
Backend receives SOS
        ↓
Socket.IO event
        ↓
Responder dashboard updates
        ↓
Security dashboard updates
        ↓
Admin dashboard updates
```

Real-time notifications include:

### Student

```text
SOS received
Responder assigned
Responder is on the way
Responder arrived
Incident resolved
```

### Responder

```text
New SOS nearby
SOS assigned
SOS updated
```

### Admin/Security

```text
New SOS
High-priority incident
Responder assigned
Incident resolved
```

---

# 🧱 Technology Stack

## Frontend

* React
* Vite
* Tailwind CSS
* Framer Motion
* React Router
* Axios
* Socket.IO Client
* Lucide React
* Leaflet
* OpenStreetMap
* Recharts

## Backend

* Node.js
* Express.js
* Socket.IO
* Mongoose
* JWT
* bcrypt/Argon2
* Helmet
* CORS
* Express Rate Limit

## Database

* MongoDB Atlas

## AI

* Gemini API

## File Storage

* Cloudinary

## Maps

* Leaflet
* OpenStreetMap

---

# 📁 Project Structure

```text
campus-sos-circle/
│
├── client/
│   │
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   │
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   │   └── ai/
│   ├── sockets/
│   ├── utils/
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── .gitignore
└── README.md
```

---

# ⚙️ Environment Variables

## Backend

Create:

```text
server/.env
```

Example:

```env
PORT=5000
CLIENT_URL=http://localhost:5173

MONGODB_URI=YOUR_MONGODB_ATLAS_URI

JWT_SECRET=YOUR_RANDOM_SECRET
JWT_EXPIRES_IN=7d

GEMINI_API_KEY=YOUR_GEMINI_API_KEY

CLOUDINARY_CLOUD_NAME=YOUR_CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY=YOUR_CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET=YOUR_CLOUDINARY_API_SECRET
```

## Frontend

Create:

```text
client/.env
```

Example:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Never expose backend secrets to the frontend.

---

# 🚀 Installation

## 1. Clone or create the project

```bash
git clone YOUR_REPOSITORY_URL
cd campus-sos-circle
```

---

# 📦 Install Frontend

```bash
cd client
npm install
```

---

# 📦 Install Backend

Open another terminal:

```bash
cd server
npm install
```

---

# ▶️ Run Backend

```bash
cd server
npm run dev
```

Backend:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

---

# ▶️ Run Frontend

```bash
cd client
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# 🗄️ MongoDB Setup

Create a MongoDB Atlas cluster.

Create a database user.

Get the MongoDB connection string.

Place it in:

```env
MONGODB_URI=YOUR_MONGODB_CONNECTION_STRING
```

Do not commit this value to GitHub.

---

# 🤖 Gemini Setup

Create a Gemini API key.

Add it to:

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

The Gemini key must only be used by the backend.

Never place the Gemini API key in React frontend code.

---

# ☁️ Cloudinary Setup

Create a Cloudinary account.

Get:

```text
Cloud Name
API Key
API Secret
```

Add them to:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

# 🗺️ Maps Setup

Campus SOS Circle uses:

```text
Leaflet + OpenStreetMap
```

for the basic map interface.

The campus-specific locations are stored in MongoDB.

For example:

```text
B Block Library
Medical Center
Security Office
Hostel Gate
Canteen
Parking Area
```

These are managed by Admin.

---

# 🔒 Security Principles

Campus SOS Circle follows basic security best practices.

### Never commit:

```text
.env
API keys
Database passwords
JWT secrets
Cloudinary secrets
```

### Never store:

```text
Plaintext passwords
```

### Never expose unnecessarily:

```text
Student private information
Precise historical locations
Authentication secrets
AI API keys
Database credentials
```

---

# 🔐 .gitignore

The project should contain:

```gitignore
node_modules/
.env
.env.local
.env.production
dist/
build/
coverage/
.DS_Store
```

---

# 🧪 Testing

Important functionality should be tested:

```text
Authentication
Registration
Email validation
Role authorization
SOS creation
SOS status updates
Socket.IO events
Nearby location queries
Responder assignment
AI requests
Image uploads
API error handling
```

---

# 📈 Future Improvements

Potential future features include:

* PWA installation
* Push notifications
* SMS emergency alerts
* Email notifications
* Advanced campus routing
* Indoor navigation
* QR-based location identification
* Voice SOS
* Emergency contact automation
* Advanced AI RAG using campus documents
* AI-powered safety trend analysis
* Heatmaps
* Multi-campus support
* Multilingual AI assistant
* Offline emergency interface

---

# 🎯 Project Goal

Campus SOS Circle is designed to demonstrate practical knowledge of:

```text
MERN Stack
+
Authentication
+
REST APIs
+
MongoDB
+
Geospatial Queries
+
Real-Time Communication
+
AI Integration
+
Cloud Storage
+
Maps
+
Role-Based Access Control
+
Data Analytics
+
Modern UI/UX
```

The project should demonstrate not only frontend development, but also **real-world backend architecture, database design, real-time systems, AI integration, security and deployment practices.**

---

# 👨‍💻 Development Philosophy

Campus SOS Circle should prioritize:

```text
Security
Reliability
Usability
Performance
Accessibility
Scalability
Maintainability
```

The application should not be treated as a simple college CRUD project.

It should be developed as a realistic campus safety platform.

---

# 🚨 Important Safety Disclaimer

Campus SOS Circle is a software project intended to assist campus communication and response.

It should not be considered a replacement for official emergency services, medical professionals, campus security procedures, or local emergency authorities.

Critical emergency decisions must remain under the control of authorized people and official emergency systems.

---

# 📜 License

This project can be used for educational and development purposes.

Add an appropriate open-source license if the project is publicly released.
