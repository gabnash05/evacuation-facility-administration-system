# Project Development Workflow — Step-by-Step (Using Jira)

## 1. Start (Developer)

### In Jira:

1. Open the ticket you’ll be working on.
2. Move the ticket from **Selected for Development** to **In Progress**
3. Click **"Create Branch"** directly from the Jira issue — this links the branch to the ticket.
4. When prompted, select **`dev`** as the source branch (not `main`).
5. Example branch name: `feature/EFAS-123-description`

---

### If you already have a local environment (previous work done):

Update your local repository to ensure you’re in sync:

```bash
git checkout dev
git pull origin dev
```

Create and switch to your new feature branch:

```bash
git checkout -b feature/EFAS-123-description
```

---

### If you’re starting fresh (no local setup yet):

Clone the repository:

```bash
git clone <repository_url>
```

Navigate into the project folder:

```bash
cd <project_name>
```

Check out and update the `dev` branch:

```bash
git checkout dev
git pull origin dev
```

Create and switch to your new feature branch:

```bash
git checkout -b feature/EFAS-123-description
```

---

## 2. Complete Development (Developer)

1. When your feature is ready, run all local checks and tests.
2. If it’s not yet ready, continue coding and testing until it is.
3. Once done, push your branch to the remote repository:

```bash
git push origin feature/EFAS-123-description
```

4. In Jira (or your Git platform like GitHub/GitLab/Bitbucket), create a **Pull Request (PR)** linked to the Jira issue.
5. Make sure the PR title and description match the Jira issue.
6. Select **Dev** as the destination branch of the Pull Request.
7. Move the Jira ticket for this into **For Review**

> **Note:** The QA reviewer and the PR approver must be different people to ensure proper review separation.

---

## 3. Prepare for QA (Dev → QA)

1. QA will move the ticket for this branch to **In Review** 

2. QA will locate the PR linked in Jira and check out the branch for testing.

```bash
git fetch origin
git checkout feature/EFAS-123-description
```

3. QA will test it in the QA environment.
4. If QA finds issues, they’ll create or update a linked **QA subtask** in Jira (e.g., `EFAS-124 QA - Login button not responsive`).

---

## 4. QA Testing

QA performs the necessary checks:

* Functional tests
* UI/UX validation

### Decision: Pass QA?

* **No:** QA updates or reopens the Jira QA issue. The developer fixes issues on the same branch, pushes updates, and QA retests.
* **Yes:** QA approves the Pull Request.

---

## 5. Parent Issue / Integration Check (Developer)

Determine whether your Jira issue is part of a **Parent Issue (Epic)** or a larger feature.

### If there is a Parent Issue (Epic):

1. Merge your feature branch into the Parent branch (linked to the Epic):

```bash
git checkout feature/EFAS-100
git merge feature/EFAS-123-description
git push origin feature/EFAS-100
```

2. Resolve any conflicts and rerun tests before merging to dev branch

### If there is no Parent Issue:

* Merge your branch through the standard PR process (e.g., merge to **dev** branch).
* Ensure a different developer reviews, approves, and merges the PR.

---

## 6. Spotcheck / Final Verification

QA or the deployment team performs **spotcheck tests** on the deployed environment:

* Visual and API checks
* Basic functionality validation

### Decision: Pass Spotcheck?

* **No:** Create or reopen a Jira issue, assign it back to Dev/QA, and repeat the QA → Merge → Deploy process.
* **Yes:** Move the Jira issue from **In Review** to **Done**. The feature is officially deployed and complete.
