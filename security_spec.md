# Security Specification: FindoraApp Firestore Guards

## Data Invariants

1. **User Identity Isolation**: A user can only access or modify their own profile, their owned devices, device location histories, and notification dispatch entries.
2. **Device Ownership Integrity**: No client can re-assign a device's `ownerId` to another user ID during create or update.
3. **Data Shape Consistency**: All writes (create/update) must strictly validate field types and length limits.
4. **Immutability of Historical Telemetry**: Location history, once written, is completely append-only and cannot be modified.

---

## The "Dirty Dozen" Malicious Payloads

The following payloads represent targeted attacks attempting to breach FindoraApp data boundaries:

1. **Identity Spoofing on Profile Create**: Trying to create a profile under another user's UID.
2. **Admin Privilege Escalation via User Profile**: Injecting an unrequested administrative role attribute.
3. **Ghost Field Pollution on User Profile**: Attempting to write arbitrary meta-fields like `isVerifiedDeveloper: true`.
4. **Device Hijacking via Owner Swap**: Updating an existing device to change the `ownerId` to an attacker's UID.
5. **Path ID Poisoning on Device Registration**: Registering a device with an ultra-long, 1MB junk ID string to waste resource allocations.
6. **Value Poisoning in Battery Telemetry**: Sending `batteryPercentage: "infinite"` or `batteryPercentage: 9999` to crash rendering clients.
7. **Orphaned Location History Entry**: Creating a location history record under a device ID that belongs to a different user.
8. **Malicious Coordinates Spoofing**: Attempting to set coordinate latitudes to invalid values like `1000.0`.
9. **Notification Spamming**: Attempting to write a global unread notification into another user's subcollection.
10. **Shadow Key Modification in Location History**: Attempting to modify a history entry's written timestamp or location coordinate retroactively.
11. **Client-Side Bulk Query Scraping**: Attempting a blanket query list read on the `devices` collection without filter scopes.
12. **PII Information Data Leak**: Trying to read another user's email or phone number.

---

## Test Runner Definition (`firestore.rules.test.ts`)

A mock typescript validation suite for validating Firestore rule enforcement against security breaches:

```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

describe('FindoraApp Firestore Rules Test Suite', () => {
  let testEnv;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'gen-lang-client-0707265853',
      firestore: {
        host: 'localhost',
        port: 8080,
      }
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('blocks identity spoofing on profile creation', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    const badProfileRef = doc(aliceDb, 'users/bob');
    await assertFails(setDoc(badProfileRef, { uid: 'bob', email: 'bob@findora.io' }));
  });

  it('blocks device hijacking via owner swap', async () => {
    const attackerDb = testEnv.authenticatedContext('attacker').firestore();
    const victimDeviceRef = doc(attackerDb, 'devices/victim_device');
    await assertFails(updateDoc(victimDeviceRef, { ownerId: 'attacker' }));
  });

  it('prevents modification of written location history items', async () => {
    const userDb = testEnv.authenticatedContext('alice').firestore();
    const historyRef = doc(userDb, 'devices/my_phone/history/hist_1');
    await assertFails(updateDoc(historyRef, { latitude: 0.0 }));
  });
});
```
