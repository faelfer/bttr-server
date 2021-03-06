# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.8.5] - 2021-04-08
### Added
- Sending email.
- Replication of sending email in forgot and reset my password.
- Populate in time controller.
- Filter by date in the time controller.
- Pagination plugin added to User, Abiliity and Time models.
### Changed
- Rework in the Time, Abiliity and User controller.
- Middleware verifyJWT.
### Removed
- Time counter has been removed.
- Remove time zone brazil.

### Security
- Environment variable JWT SECRET was added to dotenv.
- Token field has been removed from the user model.
- Sensitive information has been removed from dotenv-example.

## [0.1.2] - 2020-06-23
### Security
- Dependency update suggested by dependabot to address a security vulnerability.

## [0.1.1] - 2020-06-22
### Removed
- The unit test configuration interfered with the application's initialization on the server and consequently made it unavailable.

## [0.1.0] - 2020-06-18
### Added
- Sentry: application monitoring platform
- Brazilian time zone
- Start of a unit test environment
- Feature of adding minutes to a progress log

[Unreleased]: https://github.com/faelfer/bttr-server/compare/v0.8.5...HEAD
[0.8.5]: https://github.com/faelfer/bttr-server/compare/v0.1.2...v0.8.5
[0.1.2]: https://github.com/faelfer/bttr-server/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/faelfer/bttr-server/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/faelfer/bttr-server/releases/tag/v0.1.0