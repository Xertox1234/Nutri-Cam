---
name: Make minimal changes only
description: When asked to remove UI elements, only remove the UI rendering — don't delete underlying functionality, types, or data unless explicitly asked
type: feedback
---

When the user asks to remove a section/menu/component from a screen, only remove the **rendering** of that element. Do not delete the underlying actions, types, navigation handlers, storage, or tests unless explicitly asked.

**Why:** User was frustrated when a request to "remove the Camera & Scanning section from the home page" resulted in deletion of the action configs, type definitions, navigation handlers, and test updates — far beyond what was intended.

**How to apply:** Default to the smallest possible change. Ask for clarification if the scope is ambiguous between "hide from UI" vs "delete entirely."
