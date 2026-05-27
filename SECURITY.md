# Security Policy

At **Nawa Vote**, we take the security of our application, our users, and their data very seriously. This document outlines our security practices and how you can report vulnerabilities to us.

## Supported Versions

We actively monitor and provide security updates for the following versions of our platform:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| 0.x.x   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within Nawa Vote, please do not disclose it publicly until we have had a chance to address it. We appreciate your cooperation in keeping our platform and its users safe.

To report a vulnerability, please contact our security team directly:

📧 **Email:** security@nawavote.com

### What to include in your report:

To help us triage and investigate the vulnerability efficiently, please provide the following information:

1. **Description:** A detailed description of the vulnerability.
2. **Steps to Reproduce:** Step-by-step instructions on how to reproduce the issue.
3. **Impact:** The potential impact of the vulnerability (e.g., data breach, privilege escalation).
4. **Environment:** The version of Nawa Vote, browser, operating system, and any other relevant environment details.
5. **Proof of Concept (PoC):** If available, provide a PoC script or video demonstrating the vulnerability.

### Our Response Process:

1. **Acknowledgment:** We will acknowledge receipt of your report within **48 hours**.
2. **Triage:** Our team will investigate the issue and determine its validity and severity.
3. **Resolution:** If the vulnerability is confirmed, we will work diligently to develop and deploy a patch. We will keep you updated on our progress.
4. **Disclosure:** Once the vulnerability is patched, we will publicly disclose the issue (crediting you, if desired) and provide guidance to our users.

## Secure Development Practices

We adhere to the following secure development practices to minimize the risk of vulnerabilities:

* **Code Reviews:** All code changes undergo rigorous peer review before being merged into the main branch.
* **Dependency Scanning:** We regularly scan our dependencies for known vulnerabilities and update them proactively.
* **Static Analysis:** We utilize static application security testing (SAST) tools to identify potential flaws in our codebase.
* **Principle of Least Privilege:** We enforce strict access controls and follow the principle of least privilege across our infrastructure and application architecture.
* **Data Encryption:** All sensitive data, including voting records and user credentials, is encrypted in transit and at rest.

Thank you for helping us maintain the integrity and security of Nawa Vote.
