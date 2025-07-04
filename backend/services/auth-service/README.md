# Authentication Service

## Overview
The Authentication Service is a core backend component responsible for user management in coordination with Auth0. Its primary function is to serve as a lookup service for the **Auth0 Post-Login Action**. When a user logs in via Auth0, this service is called to find the corresponding user in our database or create a new one. It then returns the necessary user details (ID, role, subscription status) to be embedded as custom claims into the JWT.

This service does **not** handle session management, password validation, or token issuance directly. All of these are now managed by Auth0.

## Architecture

### Service Structure
```
auth-service/
├── controllers/
│   └── userLookupController.js  # Handles the user lookup/creation request from Auth0 Action
├── data/
│   └── authDataAccess.js      # All database operations for users, roles, and subscriptions
├── services/
│   ├── auth-service.js        # Service layer orchestrating the logic
│   └── user.service.js        # Core user-related business logic
├── auth0.js                   # Wrapper for the Auth0 Management API client
├── index.js                   # Service entry point
├── server.js                  # Express server configuration
└── README.md                  # This documentation file
```

## Authentication Flow

Our authentication flow is now driven by Auth0 and is much simpler:

1.  **Login via Auth0**: The user authenticates using Auth0's Universal Login page.
2.  **Auth0 Action Trigger**: After a successful login, our custom "Add Custom Claims" Post-Login Action is triggered in Auth0.
3.  **Call to Auth Service**: The Auth0 Action makes a secure, server-to-server call to our API Gateway's `/api/auth/user-lookup` endpoint. This call is authenticated using an M2M token.
4.  **User Lookup/Creation**: The request is routed to this `auth-service`. The `userLookupController` uses `authDataAccess` to find the user by their `auth0_id` or, if they don't exist, create a new user record with a default role and subscription.
5.  **Return User Data**: The service returns a JSON object containing the user's internal ID, email, admin status, and subscription plan ID.
6.  **Embed Custom Claims**: The Auth0 Action receives this data and embeds it directly into the user's JWT access token under a custom namespace.
7.  **Token Issuance**: The final JWT, now containing the custom claims, is returned to the frontend.
8.  **Authenticated API Calls**: The frontend uses this JWT in the `Authorization` header for all subsequent API calls. The API Gateway validates the token and uses the embedded claims to authorize requests.

## Middleware

The core authentication middleware now resides in the **API Gateway**, which protects all downstream services.

-   **`jwtAuth.js`**: This middleware protects user-facing API routes. It validates the Auth0-issued JWT, checks its signature and expiration, and extracts the custom claims, attaching them to the `req.user` object for use in downstream services.

-   **`serviceAuth.js`**: This middleware protects internal, service-to-service endpoints, such as the `/api/auth/user-lookup` route called by the Auth0 Action. It validates a secret service token to ensure that only authorized services can communicate with each other. This is how M2M communication is secured.

## API Endpoints

This service exposes one primary endpoint, consumed by the API Gateway, which is in turn called by the Auth0 Action.

- `POST /user-lookup`: Secure endpoint for internal use by the Auth0 Action. It receives the user's Auth0 profile and returns the corresponding internal user record. Access is restricted by the `serviceAuth.js` middleware.

## Developer Workflow: Manual API Testing
It's crucial for developers to be able to test API endpoints directly during development using tools like Postman or Insomnia. With this new authentication system, you no longer need the complex `M2M + x-user-token` flow. Instead, you can get a valid user JWT directly from the Auth0 dashboard.

This token will be authenticated as a specific test user and will include all the necessary custom claims, allowing you to test your endpoints under realistic conditions.

**Steps to get a test token:**

1.  **Navigate to your API in Auth0:**
    *   Go to your **Auth0 Dashboard**.
    *   In the left sidebar, go to **Applications** -> **APIs**.
    *   Click on your API instance (e.g., `Narravid API`).

2.  **Open the Test Tab:**
    *   Select the **"Test"** tab from the top navigation bar of your API settings.

3.  **Generate a Test Token:**
    *   You will see a section for generating a test token for your API.
    *   Click the **Copy Token** button (or similar control) to get a sample token. Auth0 may ask you to log in to generate a token based on your own user profile.

4.  **Use the Token in Postman:**
    *   Open Postman and create a new request to your desired endpoint (e.g., `GET http://localhost:3000/api/auth/profile`).
    *   Go to the **Authorization** tab for the request.
    *   Set the **Type** to **"Bearer Token"**.
    *   In the **Token** field on the right, paste the token you copied from the Auth0 dashboard.

5. **Endpoint to test:**   
    *   `GET http://localhost:3000/api/auth/profile`:  
        *   This is the primary endpoint for a logged-in user. Its job is to read the custom claims from the valid JWT you provide and return a JSON object containing that user's profile information (ID, email, name, subscription plan, etc.).
    *   `POST http://localhost:3000/api/auth/user-lookup`: 
        *   To test a returning user: Send the email of a user you know is already in your application database.
        *   To test a brand new user: Send a completely new email like "new-user-to-test@example.com". The endpoint should create them, and you can verify by checking your database afterward.
        
           Body: 
           {
                "auth0_id": "auth0|some-test-id",
                "email": "new-user-to-test@example.com",
                "name": "New User"
           } 

6.  **Send the Request:**
    *   Send the request. It will now be authenticated using the valid JWT, and the `jwtAuth` middleware in the API Gateway will correctly extract the user context from the custom claims.

## Getting Started

To start the service locally:

```