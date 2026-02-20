# Specification

## Summary
**Goal:** Fix the Create User button functionality in the Admin Panel and resolve transparency issues affecting all panels and modals throughout the application.

**Planned changes:**
- Fix the Create User button in AdminPanel so it properly submits the form and triggers the useCreateUser mutation to create new user accounts
- Add comprehensive console logging to the Create User form submission flow to diagnose button click failures
- Fix transparency issues on all modal dialogs and panels to ensure solid, opaque backgrounds with clearly visible content
- Ensure dialog overlays have appropriate backdrop styling with proper opacity

**User-visible outcome:** Admin users can successfully create new user accounts using the Create User button, and all panels and modals display with proper solid backgrounds making content clearly readable.
