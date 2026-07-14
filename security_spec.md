# Security Specification

## 1. Data Invariants
1. **Uniqueness**: Client activity log entries are identified by a unique `logId`.
2. **Immutability**: Client activity log entries cannot be modified (`update` is allowed if isAdmin, but standard update is disabled; standard client can only write/create). Actually, `update` and `delete` should be strictly constrained.
3. **Identity Verification**: No client can create or modify an activity log specifying a different client's ID. The `clientId` in the payload must match the client's verified credentials.
4. **Temporal Integrity**: Every activity log must set its `timestamp` equal to the server's request time.

## 2. The "Dirty Dozen" Payloads
Here are the 12 specific payloads intended to test and verify the resilience of the firestore security rules:

1. **Self-Elevated Privilege**: Attempt to register a client account with the `role` set to `'admin'`.
2. **Orphaned Activity Log**: Attempt to write an activity log with a `clientId` that does not exist.
3. **Spoofed Client Identity**: Authenticated as `client-123`, trying to write a log with `clientId` set to `client-456`.
4. **Junk ID Resource Exhaustion**: Attempting to set log ID to a 2KB junk string.
5. **No Time Invariance**: Creating a log entry where `timestamp` is a hardcoded future date instead of `request.time`.
6. **Shadow Fields Attack**: Injecting a `ghost_field_role` into a `client_accounts` write.
7. **Bypassing Mandatory Keys**: Creating a client account omitting `status`.
8. **Malicious Notes Payload**: Attempting to write notes string exceeding 1000 characters.
9. **Log Modification**: Bypassing lock by attempting to rewrite an existing logged action's `actionType`.
10. **Unauthenticated Read Scraping**: Attempting to fetch logs without signing in.
11. **Client Deleting System Log**: Attempting to call `delete` on `client_activity_logs/{logId}` as a standard user.
12. **Status Shortcutting**: Attempting to update a client's status directly via standard user privileges instead of administrator role.

## 3. Test Runner Definitions
These rules will be written to `firestore.rules` and tested via strict validation assertions.
