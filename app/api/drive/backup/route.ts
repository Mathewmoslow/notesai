import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { google } from 'googleapis';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { data } = await req.json();
    
    // Initialize Google Drive API
    const auth = new google.auth.OAuth2();
    auth.setCredentials({
      access_token: session.accessToken,
      refresh_token: session.refreshToken
    });

    const drive = google.drive({ version: 'v3', auth });

    // Create backup folder if it doesn't exist
    const folderName = 'NurseNotes-AI-Backup';
    let folderId = '';

    // Check if folder exists
    const folderSearch = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
    });

    if (folderSearch.data.files && folderSearch.data.files.length > 0) {
      folderId = folderSearch.data.files[0].id!;
    } else {
      // Create folder
      const folderCreate = await drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id',
      });
      folderId = folderCreate.data.id!;
    }

    // Create backup file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `nursenotes-backup-${timestamp}.json`;

    // Check if a backup exists for today and update it, otherwise create new
    const existingFiles = await drive.files.list({
      q: `name contains 'nursenotes-backup' and '${folderId}' in parents and trashed=false`,
      orderBy: 'createdTime desc',
      fields: 'files(id, name, createdTime)',
    });

    let fileId: string | undefined;
    
    // If there's a recent backup (within last hour), update it
    if (existingFiles.data.files && existingFiles.data.files.length > 0) {
      const latestFile = existingFiles.data.files[0];
      const createdTime = new Date(latestFile.createdTime!);
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      if (createdTime > hourAgo) {
        fileId = latestFile.id!;
      }
    }

    if (fileId) {
      // Update existing file
      await drive.files.update({
        fileId,
        media: {
          mimeType: 'application/json',
          body: JSON.stringify(data, null, 2),
        },
      });
    } else {
      // Create new file
      await drive.files.create({
        requestBody: {
          name: fileName,
          parents: [folderId],
          mimeType: 'application/json',
        },
        media: {
          mimeType: 'application/json',
          body: JSON.stringify(data, null, 2),
        },
        fields: 'id, name',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Backup saved to Google Drive',
      fileName,
      folderId
    });

  } catch (error) {
    console.error('Drive backup error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to backup to Google Drive',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}