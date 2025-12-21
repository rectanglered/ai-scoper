# Deployment Guide: Windows Server

Follow these steps to deploy the AI Scoper application to a fresh Windows Server.

## 1. Prerequisites
On the Windows Server, install:
*   [Node.js (LTS Version)](https://nodejs.org/) - Ensure it's added to PATH.
*   [Git for Windows](https://git-scm.com/download/win) - Standard installation.

### ⚠️ Node.js Version Warning
This project requires **Node.js v20.19.0+** or **v22.12.0+**.
If your server runs an older or incompatible version (e.g., v21) and you cannot change the global version, we recommend using **nvm-windows**.

**Using NVM to avoid conflicts:**
1.  Install [nvm-windows](https://github.com/coreybutler/nvm-windows/releases).
2.  Install the required version: `nvm install 22.12.0`.
3.  **Important:** `node-windows` services will use the `node.exe` that runs the installation script.
    To ensure the service uses v22.12.0 permanently, regardless of the system default, run the installer using the **absolute path** to the versioned executable.
    
    *Example:*
    ```powershell
    # 1. Build Client
    nvm use 22.12.0
    cd client
    npm install
    npm run build
    
    # 2. Install Service (Pin to v22)
    cd ..\server
    & "C:\Users\<User>\AppData\Roaming\nvm\v22.12.0\node.exe" install_service.js
    ```
    *Replace `<User>` with your username or check `nvm root` to find the path.*

## 2. Clone Repository
Open PowerShell or Command Prompt:
```powershell
cd C:\
git clone https://github.com/rectanglered/ai-scoper.git
cd ai-scoper
```

## 3. Build Frontend
Compile the React application into static files.
```powershell
cd client
npm install
npm run build
```
*This creates a `dist` folder inside `client/`.*

## 4. Setup Backend
Install dependencies and configure secrets.
```powershell
cd ..\server
npm install
npm install node-windows --save-dev
```

### Configuration
You must manually create two files that were excluded from Git for security.

**1. `server/.env`**
Create a new file named `.env` in the `server` folder:
```ini
GEMINI_API_KEY=your_actual_api_key_here
PORT=3144
```
*Note: You can change `PORT` to any value (e.g., 3144). The service installer will read this file during installation.*

**2. `server/config.json`**
Create a new file named `config.json` in the `server` folder:
```json
{
    "sendgridApiKey": "your_sendgrid_key_here",
    "notificationEmail": "admin@rectanglered.com"
}
```

## 5. Install as Windows Service (Auto-Start)
We assume you want the app to start automatically when the server reboots. We included a helper script `install_service.js` for this.

1.  Open PowerShell as **Administrator** (Right-click -> Run as Administrator).
2.  Navigate to the server folder:
    ```powershell
    cd C:\ai-scoper\server
    ```
3.  Run the installer:
    ```powershell
    node install_service.js
    ```

**Success!** The app is now installed as a Windows Service named **"AIScoperPortal"**.
It will start automatically on boot.

## Management
You can manage the service using the default Windows Services app (`services.msc`), or via script:

*   **View Logs**: `server/daemon/aiscoperportal.out.log`
*   **Uninstall**: Delete the service using `sc delete AIScoperPortal` or create an uninstall script similar to the installer.
