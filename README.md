# E2EE-NOTES

A full-stack note-taking application with user authentication and encrypted note storage, built with React and Material-UI (MUI) on the frontend, and Node.js with PostgreSQL on the backend.
Notes are encrypted to ensure they are never stored in plaintext.

## Tech Stack

-   Frontend: React, Material UI, TypeScript
-   Backend: Node.js, Express.js, TypeScript
-   Database: PostgreSQL
-   Other: Axios for API calls, JWT for authentication
-   Encryption: [see below](#note-encryption-workflow)

## API endpoints

```
POST /auth/register
POST /auth/login
GET /auth/renew
GET /notes/
PUT /notes/
POST /notes/
DELETE /notes/:id
```

## Installation

### 1. Clone the repository:

```
git clone https://github.com/fyniteDEV/e2ee-notes.git
cd e2ee-notes
```

### 2. Backend Setup:

-   Navigate to the `server` directory and install dependencies:
    ```
    cd server
    npm install
    ```
-   Create and customize `.env` file in the `server` directory with the following:

    ```
    PORT=3500
    PG_URI=postgres://username:password@localhost:5432/e2ee-notes
    FRONTEND_URL=http://localhost:5173
    ACCCESS_TOKEN_SECRET=your_randomly_generated_secret
    REFRESH_TOKEN_SECRET=your_randomly_generated_secret_2
    ```

-   Set up the PostgreSQL database using `./src/db/init.sql` in a database called `e2ee-notes`

-   Run the server:
    ```
    npm run dev
    ```

### 3. Frontend Setup:

-   Navigate to the `client` directory and install dependencies:

    ```
    cd ../client
    npm install
    ```

-   Create a `.env` file in the `frontend` directory with the following:

    ```
    VITE_SRV_BASE_URL=http://localhost:3500
    ```

-   Start the frontend development server:
    ```
    npm run dev
    ```

## Note Encryption Workflow

<!-- TODO -->

### User Registration

-   Generate `K_master` (Master Key)
-   Generate `KEK_password` (Password Key Encryption Key - generated from the provided password)
-   Wrap `K_master` with `KEK_password` --> `master_wrapped_pass`
-   Send `master_wrapped_pass` along with the user credentials

### User Login

1. If logged in using user credentials:

    - Unwrap `master_wrapped_pass` using `KEK_password` generated from the provided password
    - Store a randomly generated `KEK_device` (Device Key Encryption Key) in IndexedDB
    - Wrap `K_master` with `KEK_device` --> `master_wrapped_dev` and store that in IndexedDB as CryptoKey

2. If logged in using refresh token:
    - Get `master_wrapped_dev` and `KEK_device` from IndexedDB
    - Unwrap `master_wrapped_dev` with `KEK_device`

### User Logout

-   Invalidate refresh token on the server
-   Clear `master_wrapped_dev` and `KEK_device` from IndexedDB

### Notes

1. Adding a new note

    - Randomly generate `K_note` (Note Key) on the client side
    - Encrypt the title and the content using `K_note`
    - Wrap `K_note` with `K_master` --> `note_wrapped_master`
    - Send the encrypted note along with the `note_wrapped_master` to the server

2. Previewing notes for browsing

    - Only decrypt the title

3. Editing notes
    - Decrypt the title and the content using the unwrapped `note_wrapped_master`
    - On sync encrypt title and content again and send that in the payload of a PUT request
