# Shoppin App

Shoppin is a modern e-commerce application built using React, Vite, and Tailwind CSS. It integrates Capacitor for native Android functionality and is designed to run seamlessly on Android devices. The app provides an intuitive user interface with swipe gestures for interacting with product cards.

---

## Features

- **React + Vite**: A fast and modern development environment.
- **Capacitor Integration**: Enables native Android functionality.
- **Tailwind CSS**: For responsive and modern UI design.
- **Swipe Gestures**: Intuitive swipe animations for product interactions.
- **Android Studio**: Used for building and testing the Android app.
- **Java Development Kit (JDK)**: Required for Android Studio integration.

---

## Project Setup

### Prerequisites

1. **Node.js**: Install the latest version of Node.js.
2. **Android Studio**: Install Android Studio for building and testing the app.
3. **Java Development Kit (JDK)**: Ensure JDK is installed and configured for Android Studio.

---

## How It Works

### Application User Interface

The app features a clean and responsive UI:

1. **Header**: Displays the app name "Shoppin".
2. **Product Cards**: Each card shows product details like name, brand, price, and discount.
3. **Swipe Buttons**: Users can swipe left, right, or up to interact with products.

### Swipe Gesture Animations

Swipe gestures are implemented using Tailwind CSS and JavaScript logic:

- **Left Swipe**: Passes the product.
- **Right Swipe**: Likes the product.
- **Up Swipe**: Adds the product to the cart.

The animations are achieved using CSS transitions and JavaScript event handlers.

---

## Running the App

To clone the repository and set up the project locally, follow these steps:

Open your terminal and run the following command to clone the repository:

```bash
git clone https://github.com/your-username/shoppin.git
```

Navigate to the project directory:

```bash
cd shoppin
```

### Install Dependencies

Run the following command to install all required dependencies:

```bash
npm install
```

### Start Development Server

To start the development server, run:

```bash
npm run dev
```

This command will start the Vite development server, and you can view the app in your browser at `http://localhost:5173`.

### Build for Production

To build the app for production, use the following command:

```bash
npm run build
```

This will create an optimized build of your app in the `dist` folder.

---

## How to Integrate Capacitor

Capacitor is used to enable native Android functionality in the Shoppin app. Follow these steps to integrate Capacitor:

### Step 1: Install Capacitor

Run the following commands to install Capacitor:

```bash
npm install @capacitor/core @capacitor/cli
```

### Step 2: Initialize Capacitor

Initialize Capacitor in your project:

```bash
npx cap init
```

You will be prompted to provide the following details:

- App Name: Shoppin
- App ID: com.example.shoppin

### Step 3: Add Android Platform

Add the Android platform to your project:

```bash
npx cap add android
```

### Step 4: Build the Project

Build the project to generate the dist folder:

```bash
npm run build
```

### Step 5: Sync Capacitor

Sync the Capacitor configuration and assets with the Android project:

```bash
npx cap sync
```

### Step 6: Open in Android Studio

Open the Android project in Android Studio:

```bash
npx cap open android
```

Conclusion
Shoppin is a feature-rich e-commerce app that demonstrates the power of React, Capacitor, and Tailwind CSS. The swipe gestures and native Android integration provide a seamless user experience.