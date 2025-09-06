# Google OAuth and Drive API Setup Guide

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Name your project (e.g., "NurseNotes-AI")
5. Click "Create"

## Step 2: Enable Required APIs

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google Drive API"
3. Click on it and press "Enable"
4. Go back and search for "Google+ API" (needed for OAuth)
5. Click on it and press "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen first:
   - Choose "External" for user type
   - Fill in the required fields:
     - App name: NurseNotes-AI
     - User support email: your email
     - Developer contact: your email
   - Add scopes:
     - Click "Add or Remove Scopes"
     - Search and select:
       - `../auth/userinfo.email`
       - `../auth/userinfo.profile`
       - `../auth/drive.file`
   - Save and continue
   - Add test users if in development
   - Save and continue

4. Now create the OAuth client ID:
   - Application type: "Web application"
   - Name: "NurseNotes-AI Web Client"
   - Add Authorized JavaScript origins:
     - `http://localhost:3000` (for local development)
     - `https://notesai-six.vercel.app` (your production URL)
   - Add Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for local development)
     - `https://notesai-six.vercel.app/api/auth/callback/google` (your production URL)
   - Click "Create"

5. Copy your Client ID and Client Secret

## Step 4: Set Up Environment Variables

### Local Development (.env.local)
```bash
# Generate NEXTAUTH_SECRET with:
openssl rand -base64 32

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_generated_secret_here
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

### Vercel Production
1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add the following variables:
   - `NEXTAUTH_URL`: `https://notesai-six.vercel.app`
   - `NEXTAUTH_SECRET`: (same as local, generate with `openssl rand -base64 32`)
   - `GOOGLE_CLIENT_ID`: (your Google client ID)
   - `GOOGLE_CLIENT_SECRET`: (your Google client secret)
   - `OPENAI_API_KEY`: (your existing OpenAI key)

## Step 5: Test the Integration

1. Start your local development server: `npm run dev`
2. Click "Google Drive" button in the app header
3. Sign in with your Google account
4. Grant permissions to access Google Drive
5. Test backup and restore functionality

## Troubleshooting

### "Access blocked" error
- Make sure your app is published in Google Cloud Console
- Or add your email as a test user during development

### "Redirect URI mismatch" error
- Double-check that your redirect URIs match exactly
- Include both http://localhost:3000 and your production URL
- Make sure to include `/api/auth/callback/google` at the end

### "Invalid client" error
- Verify your Client ID and Client Secret are correct
- Check that environment variables are properly set

### Drive API errors
- Ensure Google Drive API is enabled in your project
- Check that the drive.file scope is included

## Security Notes

- Never commit `.env.local` to git (it's already in .gitignore)
- Keep your Client Secret secure
- Use different OAuth apps for development and production if needed
- The app only requests `drive.file` scope, which limits access to files it creates

## How It Works

1. User clicks "Google Drive" button
2. User signs in with Google account
3. App receives OAuth tokens
4. Backup: App creates a JSON file with all localStorage data and uploads to Drive
5. Restore: App downloads the latest backup and restores to localStorage
6. All backups are stored in a "NurseNotes-AI-Backup" folder in the user's Drive