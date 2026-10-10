# KWF Foundation — Data Safety, Backup and Disaster Recovery

Current website: https://kalwalwf.github.io/
Original source: https://github.com/talhakalwal21/kwf-welfare-web
Deployed source: https://github.com/kalwalwf/kalwalwf.github.io
Supabase project: ekthzqacvsjfngtyvplx

## Weekly backup routine

1. Sign into the KWF website as the Foundation Owner.
2. Open My Account → KWF Backup & Restore (also linked from Staff Management).
3. Choose a separate passphrase of at least 12 characters. Enter it twice.
4. Select Download encrypted backup. Save the resulting .kwfbackup file.
5. Keep independent copies on an external drive and a separate trusted cloud drive.
6. Store the backup passphrase separately in a secure password manager or offline sealed paper copy. There is no passphrase recovery.
7. Once a month, test Preview backup with the saved file, and check record/receipt counts.
8. Download BOTH GitHub repository source ZIP archives and the offline backup reader HTML. Keep them separately from GitHub.

Do not publish donor data, family addresses, CNICs, receipts, passwords or private keys in public GitHub repositories.

## Contents

The encrypted KWF backup includes application data: profiles, campaigns, beneficiaries/families, settings, created staff usernames/details/permissions, donations, expenses, aid records, reviews, invitations and audit records.

It also includes private donation receipt files and sanitized Auth identifiers (user ID, email, phone and confirmation dates). It does NOT include login passwords, hashed passwords, service-role keys, tokens, sessions or an executable database schema dump.

Encryption uses AES-256-GCM and PBKDF2-SHA256 (310,000 iterations), with random salt and IV. Encryption/decryption occurs in the Owner's browser.

Browser memory limitations: approximately 45 MB uncompressed data and 10 MB per individual receipt. For larger records use a PostgreSQL-native database dump and separately verified storage export; do not rely only on the browser tool.

## Restore to the ORIGINAL working Supabase project

1. Sign in as the original Owner to the SAME Supabase project.
2. Choose .kwfbackup and enter its passphrase.
3. Click Preview backup to check its date, record totals and receipts.
4. Choose Restore missing records, confirm, and type RESTORE.
5. Only MISSING database rows are inserted. Existing rows are not deleted or overwritten.
6. Missing private receipt files are restored when the referenced donation exists.
7. Refresh the Dashboard, check totals and sample receipts, and investigate any errors.

This is append-only recovery, NOT rollback or point-in-time restoration. Existing changed records will NOT revert to historical values. Original Auth user identities must exist; restoration may fail if they were deleted. Retry after a partial interruption is designed to skip previously imported rows.

## If GitHub is lost

1. Keep the original Supabase project; it is separate from GitHub hosting.
2. Create a replacement GitHub repository/organization and restore BOTH saved source ZIP repositories.
3. Adjust the workflow checkout reference to the restored original source repository.
4. Set the new public Supabase URL and publishable key as GitHub variables (NEVER service-role key).
5. Enable GitHub Pages, change Supabase Auth Site URL/redirect URLs to the new website address.
6. Verify login, families, donation history and private receipt downloads.

## If Supabase is lost

The encrypted browser archive alone is NOT a full new-project disaster recovery backup. Full recovery also requires a safe PostgreSQL pg_dump of the database schema/functions/RLS/sequences/Auth metadata, private storage exports and Auth/SMTP configuration. An authorized database administrator must restore or recreate matching Auth user identities before importing dependent records. Users may need to reset passwords.

## Offline reader

Save kwf-offline-backup-reader.html before a disaster. It runs locally with no external scripts, decrypts a saved .kwfbackup with its passphrase, and exports an ordinary ZIP. That ZIP is UNENCRYPTED and contains highly sensitive donor/family records. Use only on a trusted device and delete it after recovery.

## Safety

Maintain at least two independent copies, test recovery regularly, enable account MFA, and never upload unencrypted backups or private service keys to public GitHub. A backup is only reliable once it has been tested.
