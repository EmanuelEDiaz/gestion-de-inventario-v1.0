# Changelog

## [Unreleased]

### Added
- feat(audit): backend + frontend for audit logs (A1)
- feat(settings): system settings with cache + admin UI (A1)
- feat(reports): backend reports and CSV export endpoints (A2+A4)
- feat(import): backend CSV import with async processing (A3)
- feat(pos): fix CREDIT/RESERVE sale wiring + debts listAll bug (A5)
- feat(settings): notification preferences UI + system settings tab (A6)
- feat(offline): IndexedDB 19 stores + Service Worker + delta sync (A7)

### Changed
- refactor(settings): converted SettingsView to tabs layout
- refactor(debt): renamed DebtPaymentHistory to DebtActionForms
- fix(debts): listAll no longer defaults to overdue only
