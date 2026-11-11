# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x / `main` | :white_check_mark: |

## Reporting a Vulnerability

We take the security of Care Guide BD very seriously. If you believe you have discovered a security vulnerability in this project, please report it privately:

1. **GitHub Security Advisories:** Go to the [Security Advisories tab](https://github.com/NobinKhan/careguide-frontend/security/advisories/new) and submit a report.
2. **Direct Contact:** If advisory submission is unavailable, please email `nobin.contact@gmail.com` with the details and reproduction steps.

Please do **NOT** file public issues for suspected security vulnerabilities.

## Security Practices

- Never commit `.env` files, production database connection strings, JWT secrets, or demo passwords to the repository.
- Ensure authentication tokens are transmitted securely over HTTPS and stored safely in the browser.
