# SecureDeliver — AI Build Instructions

> This file is an instruction set for an AI coding agent to build the **SecureDeliver** mobile application from scratch.

---

## Project Overview

**SecureDeliver** is a cross-platform mobile application that solves the trust gap between freelancers and clients during digital file delivery.

- Freelancers upload work; clients receive **watermarked previews only**
- Original source files stay **encrypted and locked** until payment is confirmed via Stripe
- Built with **React Native** for iOS and Android

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React Native (Expo) |
| Backend | Node.js + Express.js |
| Database | MongoDB (Mongoose ODM) |
| AI Module | TensorFlow Lite / OpenAI API |
| Payment | Stripe Mobile SDK (Test Mode) |
| File Storage | Cloudinary (Free Tier) |
| Watermarking | Sharp.js |
| Biometrics | react-native-biometrics |
| Screenshot Detection | react-native-screenshot-prevent |
| Authentication | JWT + bcrypt |

---

## Project Structure

```
SecureDeliver/
├── /backend
│   ├── server.js
│   ├── /routes
│   │   ├── auth.routes.js
│   │   ├── file.routes.js
│   │   └── payment.routes.js
│   ├── /controllers
│   │   ├── auth.controller.js
│   │   ├── file.controller.js
│   │   └── payment.controller.js
│   ├── /models
│   │   ├── User.model.js
│   │   └── File.model.js
│   ├── /middleware
│   │   ├── auth.middleware.js
│   │   └── upload.middleware.js
│   ├── /services
│   │   ├── watermark.service.js
│   │   ├── encryption.service.js
│   │   └── ai.service.js
│   └── .env
│
├── /mobile (React Native Expo)
│   ├── App.js
│   ├── /screens
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── FreelancerDashboard.js
│   │   ├── ClientDashboard.js
│   │   ├── UploadFileScreen.js
│   │   ├── PreviewScreen.js
│   │   ├── PaymentScreen.js
│   │   └── AnnotationScreen.js
│   ├── /components
│   │   ├── SecureViewer.js
│   │   ├── AnnotationCanvas.js
│   │   ├── BiometricLock.js
│   │   └── ProofOfEffortCard.js
│   ├── /services
│   │   ├── api.service.js
│   │   └── stripe.service.js
│   └── /navigation
│       └── AppNavigator.js
```

---

## Functional Requirements — Build These Features

### 1. User Authentication
- Implement **Register** and **Login** for two roles: `freelancer` and `client`
- Use **JWT tokens** for session management
- Store passwords hashed with **bcrypt**
- After login, enable **Biometric Authentication** (Face ID / Fingerprint) using `react-native-biometrics` for subsequent app opens

### 2. File Upload (Freelancer)
- Freelancer can upload any file (image, PDF, design file)
- On upload, the backend must:
  1. Store the **original encrypted file** in Cloudinary (private, not publicly accessible)
  2. Generate a **watermarked preview** using Sharp.js with dynamic text (e.g., "PREVIEW ONLY — SecureDeliver")
  3. Store the watermarked preview separately (publicly viewable but inside app only)
  4. Save file metadata to MongoDB (`File` model)

### 3. Secure Preview Viewer
- Clients can only view watermarked previews **inside the app**
- Use a native `react-native` Image/PDF viewer; do NOT open files in an external browser or app
- Enable **Screenshot Prevention** using `react-native-screenshot-prevent` on the preview screen
- If a screenshot is detected, immediately send a **push notification** to the freelancer

### 4. Payment Escrow (Stripe)
- Integrate **Stripe Mobile SDK** in test mode
- When the client taps "Pay & Unlock":
  1. Create a PaymentIntent on the backend
  2. Process payment on the mobile app using Stripe's payment sheet
  3. On `payment_intent.succeeded` webhook from Stripe, set `file.isUnlocked = true` in MongoDB
  4. Automatically deliver the original source file download link to the client

### 5. File Unlock After Payment
- Once `isUnlocked = true`, client can download the original source file
- The download link must be a **signed/temporary URL** (expires in 10 minutes) from Cloudinary
- Do NOT expose the permanent Cloudinary URL

### 6. AI Proof of Effort Module
- When a freelancer uploads a file, run an AI analysis using **OpenAI API** (or TensorFlow Lite as fallback)
- Generate a short "Proof of Effort" report containing:
  - Originality score (0–100%)
  - Estimated effort level (Low / Medium / High)
  - Brief summary of the work
- Display this report as a card on the client's preview screen

### 7. Collaborative Annotation Layer
- On the preview screen, clients can switch to **Annotation Mode**
- Provide drawing tools: pen, highlighter, text comment
- Each annotation is **time-stamped** and saved to MongoDB linked to the file
- Freelancer can view all annotations from their dashboard

### 8. Screenshot Detection & Alerts
- On any screen displaying a preview file, activate screenshot prevention
- Log every screenshot attempt to the database with timestamp and user ID
- Notify freelancer via in-app alert and push notification

---

## Non-Functional Requirements — Follow These Rules

1. **Security**
   - All source files must be **AES-256 encrypted** before storage
   - Use **HTTPS only** for all API calls
   - Encryption keys must never be stored in plaintext; use environment variables

2. **Performance**
   - Preview rendering must target **60 fps**
   - All API responses must return within **2 seconds** under normal load
   - Use image compression before watermarking to reduce processing time

3. **Error Handling**
   - Every API endpoint must return proper HTTP status codes
   - Mobile app must show user-friendly error messages, never raw error objects
   - Payment failures must NOT unlock files under any circumstance

4. **Environment Variables**
   - Use a `.env` file for all secrets. Required variables:
     ```
     MONGO_URI=
     JWT_SECRET=
     STRIPE_SECRET_KEY=
     STRIPE_WEBHOOK_SECRET=
     CLOUDINARY_CLOUD_NAME=
     CLOUDINARY_API_KEY=
     CLOUDINARY_API_SECRET=
     OPENAI_API_KEY=
     ```

5. **Code Quality**
   - Use **async/await** (no raw callbacks)
   - Separate concerns: routes → controllers → services
   - Add comments on all non-obvious logic, especially encryption and payment flow

---

## Database Models

### User Model
```js
{
  name: String,
  email: String (unique),
  passwordHash: String,
  role: String, // 'freelancer' or 'client'
  createdAt: Date
}
```

### File Model
```js
{
  uploadedBy: ObjectId (ref: User),
  originalFileUrl: String,      // encrypted, private
  previewFileUrl: String,       // watermarked, viewable in-app
  isUnlocked: Boolean,          // false until payment confirmed
  paymentIntentId: String,
  proofOfEffort: {
    originalityScore: Number,
    effortLevel: String,
    summary: String
  },
  annotations: [
    {
      clientId: ObjectId,
      content: String,
      timestamp: Date,
      position: { x: Number, y: Number }
    }
  ],
  screenshotAttempts: [
    {
      userId: ObjectId,
      timestamp: Date
    }
  ],
  createdAt: Date
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login and get JWT |
| POST | `/api/files/upload` | Upload file (freelancer) |
| GET | `/api/files/:id/preview` | Get watermarked preview URL |
| GET | `/api/files/:id/download` | Get signed source file URL (unlocked only) |
| POST | `/api/payment/create-intent` | Create Stripe PaymentIntent |
| POST | `/api/payment/webhook` | Stripe webhook to unlock file |
| POST | `/api/files/:id/annotate` | Save annotation |
| GET | `/api/files/:id/annotations` | Get all annotations |
| POST | `/api/files/:id/screenshot-alert` | Log screenshot attempt |

---

## Step-by-Step Build Order for AI Agent

Follow this order to avoid dependency issues:

1. Set up **Node.js + Express backend** with MongoDB connection
2. Build **User model** and auth routes (register, login, JWT middleware)
3. Build **File model** and upload route with Cloudinary integration
4. Integrate **Sharp.js watermarking** in the upload service
5. Integrate **AES-256 encryption** for source file storage
6. Set up **Stripe PaymentIntent** creation and webhook handler
7. Build **file unlock logic** triggered by Stripe webhook
8. Integrate **OpenAI API** for Proof of Effort analysis
9. Build **annotation save/fetch** routes
10. Set up **React Native Expo** project with navigation
11. Build **Login / Register screens** with JWT storage
12. Build **Biometric Authentication** on app launch
13. Build **Freelancer Dashboard** (upload, view files, see annotations)
14. Build **Client Dashboard** (view previews, pay, download)
15. Build **SecureViewer** with screenshot prevention
16. Build **AnnotationCanvas** component
17. Build **ProofOfEffortCard** component
18. Connect all screens to backend API
19. Test full payment → unlock → download flow in Stripe test mode
20. Final security audit: check all private URLs, encryption, and JWT expiry

---

## Important Rules for AI Agent

- **NEVER** expose the original file URL before `isUnlocked === true`
- **NEVER** store secrets in the codebase — always use `.env`
- **NEVER** skip the Stripe webhook verification step (`stripe.webhooks.constructEvent`)
- **ALWAYS** use signed/temporary Cloudinary URLs for file delivery
- **ALWAYS** activate screenshot prevention before rendering any preview
- When in doubt about a security decision, **choose the more restrictive option**

---

