# Contributing to Nawa Vote

First off, thank you for considering contributing to Nawa Vote! It's people like you that make this platform a great, secure, and reliable tool for elections. 

We welcome contributions from everyone, whether it's reporting a bug, submitting a fix, proposing new features, or improving documentation.

## Getting Started

1. **Fork the Repository:** Start by forking the [Nawa Vote repository](https://github.com/your-org/nawa-vote) to your own GitHub account.
2. **Clone the Repo:** Clone your fork to your local machine.
3. **Install Dependencies:** Run `npm install` to install all necessary packages.
4. **Set Up Environment:** Copy the `.env.example` file to `.env.local` and configure your local variables.

## Branching Strategy

We follow a structured branching model to maintain stability:

* `main`: The production-ready branch. All code in this branch is deployable.
* `develop`: The primary development branch. Feature branches are merged here.
* `feature/issue-name`: Branches for new features or significant changes.
* `bugfix/issue-name`: Branches dedicated to resolving specific bugs.

Always branch off from `develop` when starting new work.

```bash
git checkout -b feature/your-feature-name develop
```

## Development Guidelines

To ensure code quality and consistency, please adhere to the following standards:

### Code Style
* We use **Prettier** and **ESLint** to enforce coding standards. Please ensure your code passes both before submitting.
* Run `npm run lint` to check for formatting and linting errors.

### TypeScript
* Strict TypeScript typing is required. Avoid using `any` wherever possible. Define explicit interfaces for your components and state.

### Commit Messages
We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
* `feat:` A new feature.
* `fix:` A bug fix.
* `docs:` Documentation only changes.
* `style:` Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc).
* `refactor:` A code change that neither fixes a bug nor adds a feature.
* `test:` Adding missing tests or correcting existing tests.
* `chore:` Changes to the build process or auxiliary tools and libraries.

*Example:* `feat: implement real-time chart updates in admin dashboard`

## Submitting a Pull Request (PR)

1. **Keep it focused:** A PR should address a single issue or feature. If you have multiple unrelated changes, submit separate PRs.
2. **Update Documentation:** If your change alters functionality, ensure the `README.md` or other relevant documentation is updated.
3. **Write a clear description:** Explain *what* you changed and *why*. Reference any related issue numbers (e.g., "Fixes #123").
4. **Pass Checks:** Ensure all CI/CD pipelines (linting, build, tests) pass successfully.

### PR Review Process
Once submitted, a maintainer will review your code. They may request changes or ask clarifying questions. Please be responsive and professional during this process.

---

By contributing to Nawa Vote, you agree that your contributions will be licensed under its designated open-source license. Thank you for your hard work!
