# Evacuation Facility Administration System — First-Time Setup

This guide is for **new collaborators** setting up the project for the **first time**. At this stage, you do **not** need to create or work on a feature branch yet — this setup ensures your environment is ready for future development.

---

## 1. Clone the Repository

Clone the repository from the remote origin and navigate into it:

```bash
git clone <repository_url>
cd <project_name>
```

---

## 2. Configure Git Identity

Ensure your local Git configuration matches your **Atlassian account** for proper commit tracking:

```bash
git config --global user.name "Your Real Name"
git config --global user.email "your-school-email@edu.com"
```

This ensures that your commits are correctly linked to your Jira and Bitbucket account.

---

## 3. Set Up the Development Branch

Ensure you are on the `dev` branch (all active work is based on it):

```bash
git checkout dev
git pull origin dev
```

---

## 4. Set Up the Backend

1. Go to the backend directory:

    ```bash
    cd backend
    ```
2. Copy the environment file and update your local settings:

    ```bash
    copy .env.example .env   # Windows PowerShell
    ```

    * Edit `.env` to include your local PostgreSQL connection details and any secret keys. These detials are the most important.

    ```txt
    DATABASE_URL=postgresql://<username>:<password>@localhost:5432/efas_db
    DB_HOST=localhost
    DB_PORT=5432
    DB_NAME=efas_db
    DB_USER=<username>
    DB_PASSWORD=<password>
    ```

3. Install Python dependencies and activate the virtual environment:

    ```bash
    pipenv install
    pipenv shell
    ```
4. Run the backend development server:

    ```bash
    python run.py
    ```

---

## 5. Set Up the Database

1. Ensure your database is running (PostgreSQL) or that you have PostgreSQL installed.

2. Open a new terminal and go to the backend directory.

    ```bash
    cd backend
    ```

3. Create tables and super_admin user using the provided setup script:

   ```bash
   python database/setup_db.py  # from Backend
   ```

4. The script will prompt for your email and password for the app

5. If no errors are visible, you can close this terminal.

---

## 6. Set Up the Frontend

1. Open a new terminal and go to the frontend directory:

   ```bash
   cd ../frontend           # from Backend
   ```
2. Copy the environment file and adjust the API URL if needed:

   ```bash
   copy .env.example .env   # Windows PowerShell
   ```
3. Install dependencies and start the dev server:

   ```bash
   npm install
   npm run dev
   ```

---

## 7. Verify the Setup

* The backend should run locally (e.g., `http://127.0.0.1:5000`).
* The frontend should run locally (e.g., `http://localhost:5173`).

Once everything is confirmed working, your environment is ready. You can begin development by following your team's **CONTRIBUTION workflow** in Jira when assigned a ticket.
