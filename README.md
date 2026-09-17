FarmDirect

FarmDirect is a digital marketplace that connects farmers directly with buyers. Farmers can list agricultural products, manage stock and orders, while buyers can search, compare, purchase, track orders, and review delivered products.

Live Project: https://farm-direct-steel.vercel.app/
GitHub: https://github.com/wajahatshaikh860/FarmDirect

Problem Statement

Farmers often depend on intermediaries to reach buyers. FarmDirect provides a direct digital platform where farmers can showcase their produce and buyers can discover products using price, quality, location, ratings, and availability.

Main Features

Farmer

Create and manage product listings

Upload multiple product images

Add price, stock, minimum quantity, quality grade, farming type, and location

Receive and manage customer orders

Update order status from confirmation to delivery

View earnings, orders, products, and dashboard analytics

Receive notifications

Farmer verification support

Buyer

Browse products in the marketplace

Search, sort, and apply filters

Compare price, quality, ratings, stock, and location

Add products to cart and wishlist

Place multi-farmer orders

Track order status

Review products after successful delivery

View spending and order analytics

Admin

Manage platform users

Verify farmer accounts

View platform-level statistics

Monitor products, orders, farmers, buyers, and delivered order value

Marketplace

The Marketplace includes:

Product search

Category filter

Minimum and maximum price filter

Farming type filter

Quality grade filter

State and district filter

Stock availability filter

Sorting

Pagination

Responsive product cards

The interface is designed for desktop, tablet, and mobile devices.

Location & Maps

Farmers can enter:

Full address

Village / City

District

State

Pincode

The application uses MapTiler geocoding to find coordinates and MapLibre to display the farm location.

For privacy, buyers see an approximate farm location rather than the farmer's complete private address.

If the map service is unavailable, textual location information is still shown and the rest of the application continues to work normally.

Order Flow

Farmer lists product
        ↓
Buyer discovers product
        ↓
Wishlist / Cart
        ↓
Checkout
        ↓
Order created
        ↓
Farmer accepts order
        ↓
Confirmed
        ↓
Packed
        ↓
Shipped
        ↓
Delivered
        ↓
Buyer can review product

Cancelled orders restore product inventory safely.

Project Architecture

                    FarmDirect
                        │
        ┌───────────────┴───────────────┐
        │                               │
     Frontend                        Backend
        │                               │
 Next.js + React                Next.js API Routes
 Tailwind CSS                   Service Layer
        │                               │
        └───────────────┬───────────────┘
                        │
                  Authentication
                NextAuth + RBAC
                        │
        ┌───────────────┼────────────────┐
        │               │                │
      Farmer           Buyer            Admin
        │               │                │
        └───────────────┼────────────────┘
                        │
                    MongoDB
                   + Mongoose
                        │
        ┌───────────────┼────────────────┐
        │               │                │
   Cloudinary        MapTiler        Notifications
    Images          + MapLibre

Application Layers

UI / Components
      ↓
API Routes
      ↓
Validation
      ↓
Service Layer
      ↓
Mongoose Models
      ↓
MongoDB Atlas

This structure keeps the user interface, validation, business logic, and database operations separated and easier to maintain.

Technology Stack

Area

Technology

Framework

Next.js 16

Frontend

React, JSX

Styling

Tailwind CSS

Database

MongoDB Atlas

ODM

Mongoose

Authentication

NextAuth

Password Security

bcryptjs

Authorization

Role-Based Access Control

Validation

Zod

Image Storage

Cloudinary

Maps

MapLibre

Geocoding

MapTiler

Icons

Lucide React

Notifications

Sonner + in-app notifications

Deployment

Vercel

Main Database Models

User

Product

Cart

Order

Review

Notification

Payment Attempt

Relations are handled using MongoDB ObjectIds and server-side authorization checks.

Security

FarmDirect includes:

Password hashing using bcrypt

Session-based authentication

FARMER, BUYER, and ADMIN roles

Server-side authorization

Product ownership checks

Order ownership checks

Review ownership checks

Input validation using Zod

Safe image upload validation

Protected environment variables

Inventory validation during checkout

Payment signature verification support

Sensitive values are stored in .env.local and are not committed to GitHub.

Payments

Currently supported:

Cash on Delivery (COD)

The project also contains payment gateway integration support for future activation after required credentials and compliance are completed.

Environment Variables

Create a .env.local file in the project root.

MONGODB_URI=
AUTH_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

NEXT_PUBLIC_MAPTILER_API_KEY=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

Do not upload .env.local to GitHub.

Run Locally

Install dependencies:

npm install

Start development server:

npm run dev

Open:

http://localhost:3000

Testing

Run automated tests:

npm test

Current test result:

91 tests
91 passed
0 failed

Run lint:

npm run lint

Create production build:

npm run build

Project Goal

FarmDirect aims to provide a simple, transparent, and scalable marketplace where farmers can directly reach buyers and buyers can make better purchasing decisions using product information, price, location, stock, quality, and verified reviews.

The platform is designed so that it can be extended in the future with features such as eKYC verification, online payments, logistics integration, and wider pan-India adoption.

Team

Team Name: Commit & Conquer

Shaikh Wajahat

Madhuri Cherkupalli

Sneha Alle

Institution: G H Raisoni International Skill Tech University, Pune
Problem Statement ID: AG-03