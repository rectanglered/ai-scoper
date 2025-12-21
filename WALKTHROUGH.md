# AI Scoping Portal (Daniel) Walkthrough

## Overview
We have built a React + Express application for "Rectangle Red" to scope software projects.
The AI assistant, **Daniel**, will interview you and generate a report.

## Prerequisites
- Node.js installed (Verified v24.12.0)
- Google Gemini API Key

## Setup Instructions

1.  **Configure API Key**
    - Open `c:/working/aiscoper/server/.env`
    - Replace `YOUR_API_KEY_HERE` with your actual Google Gemini API Key.

2.  **Start the Backend Server and Main Site**
    Open a new terminal:
    ```bash
    cd c:/working/aiscoper/server
    npm start
    ```
    *Server should run on http://localhost:3000*

3.  **Start the Hot Reloading Development Client**
    Open another terminal:
    ```bash
    cd c:/working/aiscoper/client
    npm run dev
    ```
    *Client should run on http://localhost:5173*

## Usage
1.  Open your browser to the client URL.
2.  Enter your project idea in the chat.
3.  Answer Daniel's questions.
4.  Once the AI has enough info (approx 5 questions), it will generate an **Implementation Plan Report**.
5.  You can print the report or save it.

## Troubleshooting
- **"Connection failed"**: Ensure the backend server is running on port 3000.
- **Build Errors**: If you modify the CSS, ensure you use the Tailwind v4 compatible configuration we set up.
