# Apni Diary — cloud beta

Separate Vercel/Supabase diary app. This is a beta and has **not** had an independent security audit. Do not keep the only copy of important memories here.

- Browser Web Crypto encrypts entry text and photo contents with AES-GCM. A random master key is wrapped by a PBKDF2 passphrase and a separate recovery key. The recovery key is shown once and must be stored safely. Losing both passphrase and key makes entries unrecoverable.
- Supabase Auth handles account login; confirmation email remains enabled. Production delivery to arbitrary users needs a correctly configured external SMTP provider; Supabase's built-in SMTP is restricted. Login password recovery UI is not implemented.
- Postgres RLS limits rows to the signed-in user; encrypted photos are currently stored as base64 ciphertext in the database, not Supabase Storage. Free database capacity is shared, limited, and the free project may pause with inactivity. The app reads the newest 300 entries; export is readable plaintext and only covers loaded entries. There is no automatic backup or import.
- Account email/name, kind, sizes, timestamps, IP/network metadata are not encrypted. A compromised web server, malicious JS, XSS, unlocked browser or weak secret can expose data. This implementation is not a complete secure product.
- `public` is the deployable static site. `cloud-app.js` is the source. To rebuild: `npm ci && npx esbuild cloud-app.js --bundle --minify --format=iife --outfile=public/app.js`. The Supabase publishable key is public by design; server secrets must not be added to the frontend or repo.

## Deploy and verify

Connect this repository to the separate `apni-diary-samarth` Vercel project and deploy the `main` branch. The site is a static app served from `public`; do not publish the Python/SQLite prototype as the cloud backend. After deployment set the Supabase Auth site URL and redirect allowlist to the actual HTTPS production domain. Validate email confirmation, account creation, vault recovery, two-user isolation, encrypted photo and note persistence, reload and logout before inviting people to use the beta. Default Supabase email delivery is restricted; custom SMTP is required for general public signups. Never upload real memories until these checks are complete, and always keep separate backups.

## Account access and key rotation

Sign-in requires a verified email and the login password, followed by the separate vault passphrase. The sign-in screen can request another verification email or a login-password reset email. Delivery of both remains dependent on SMTP configuration, and the default provider may restrict recipients. The password-reset link changes only the login credential, not the encryption passphrase.

The recovery-key screen can generate a new recovery key after the vault passphrase is entered. Save the displayed key before activating it. Rotation updates the current stored wrapper and removes its stale signup metadata copy, but it does not re-encrypt diary entries or revoke access to previously obtained copies of the old wrapped master key and ciphertext. Treat a disclosed recovery key as a security incident; complete master-key rotation and independently reviewed recovery and backup are not implemented.
