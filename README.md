# SecureDeliver 🔒🚀

**SecureDeliver** is a cross-platform mobile application designed to solve the trust gap between freelancers and clients during digital file deliveries. Freelancers can upload their work, and clients can view watermarked previews inside the secure viewer layer. Original files remain encrypted and locked until payment is verified and cleared via Stripe.

---

## 🛠️ Tech Stack

- **Frontend**: React Native (Expo SDK 51)
- **Backend**: Node.js + Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Payment Gateway**: Stripe Mobile SDK (Test Mode)
- **File Storage & Delivery**: Cloudinary (Secure signed URLs)
- **Image Processing**: Sharp.js (Watermarking)
- **Environment**: Java Development Kit (JDK) 17 + Android NDK

---

## ⚙️ Prerequisites

Before setting up the project, make sure you have the following installed on your machine:
- **Node.js** (v18 or higher recommended)
- **Java Development Kit (JDK) 17**
- **Android Studio** (configured with Android SDK and Command Line Tools)
- **MongoDB** (Local instance or MongoDB Atlas URI)

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/aka-ibaad/safesend.git
cd safesend
```

---

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/securedeliver
   JWT_SECRET=your_jwt_secret_here
   STRIPE_SECRET_KEY=your_stripe_secret_key_here
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name_here
   CLOUDINARY_API_KEY=your_cloudinary_api_key_here
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```
4. Start the backend server:
   - For development (with hot-reload):
     ```bash
     npm run dev
     ```
   - For production:
     ```bash
     npm start
     ```

---

### 3. Mobile Setup (React Native Expo)

1. Navigate to the mobile directory:
   ```bash
   cd ../mobile
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. **Configure API URL**:
   Open `services/api.service.js` and update `BASE_URL` with your server address. 
   *Note: If you are testing on a physical mobile device, replace `localhost` or the default IP with your machine's local network IPv4 address (e.g., `http://192.168.1.100:5000/api`).*

4. Run the Expo development server:
   ```bash
   npm run start
   ```

---

## 📱 Building the Android APK Locally

To compile the React Native app into an installer APK directly on your PC:

1. **Prebuild the native android folder**:
   Ensure you are in the `mobile` directory, then run:
   ```bash
   npx expo prebuild --platform android --no-install
   ```
2. **Set up NDK and JDK Path (Troubleshooting)**:
   Ensure you have JDK 17 selected. If you hit NDK or toolchain version mismatches, open `mobile/android/gradle.properties` and verify your java home path:
   ```properties
   org.gradle.java.home=C\:/Program Files/Java/jdk-17.0.18
   ```
   *Note: If you encounter issues with Gradle downloading unsupported older NDK versions, you can append a `subprojects` override inside `mobile/android/build.gradle` to force your pre-installed NDK version (e.g., version `27.3.13750724`).*

3. **Compile the APK**:
   Navigate to the native android directory and run the Gradle assembler:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
4. **Locate the APK**:
   After the build succeeds, your output APK will be saved at:
   `mobile/android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🔒 Security Practices & Rules

- **Cloudinary private delivery**: The original source files are encrypted using AES-256 and stored as private objects. They can only be accessed using temporary, signed URLs that expire within 10 minutes.
- **Screenshot Protection**: The app prevents screenshots on screens showing preview files. Any attempts are captured and logged, sending push notifications to the respective freelancer.
- **Stripe Webhooks**: File unlock logic is strictly secured and verified through Stripe webhook events to guarantee payment confirmation.
