# Paris Lash Midtown — website

Static site (HTML/CSS/vanilla JS) + one Vercel serverless function for the booking form.

## Pages
- `/` Home · `/eyelash-extensions` · `/waxing` · `/eyebrows` · `/about` (owner + suite rentals) · `/contact`
- Old WordPress URLs (`/about-us`, `/eyebrow`, `/schedule-an-appointment`, `/service`) redirect via `vercel.json`.

## Deploy (Vercel)
1. Import this repo in Vercel → Framework preset **Other** → no build command, output dir `.`.
2. Add environment variables for the contact form:
   - `RESEND_API_KEY` — from https://resend.com
   - `CONTACT_TO_EMAIL` — the salon inbox (comma-separate for several)
   - `CONTACT_FROM_EMAIL` *(optional)* — sender on a domain verified in Resend
3. Redeploy. Until the variables are set, the form shows a friendly "text or call us" fallback.

## Local preview
`npx serve .` (supports the clean URLs).
