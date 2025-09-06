import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { google } from 'googleapis';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Initialize Google Drive API
    const auth = new google.auth.OAuth2();
    auth.setCredentials({
      access_token: session.accessToken,
      refresh_token: session.refreshToken
    });

    const drive = google.drive({ version: 'v3', auth });

    // Find the backup folder
    const folderName = 'NurseNotes-AI-Backup';
    const folderSearch = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
    });

    if (!folderSearch.data.files || folderSearch.data.files.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No backup folder found'
      });
    }

    const folderId = folderSearch.data.files[0].id!;

    // Get the latest backup file
    const fileList = await drive.files.list({
      q: `'${folderId}' in parents and name contains 'nursenotes-backup' and trashed=false`,
      orderBy: 'createdTime desc',
      pageSize: 1,
      fields: 'files(id, name, createdTime)',
    });

    if (!fileList.data.files || fileList.data.files.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No backup files found'
      });
    }

    const latestBackup = fileList.data.files[0];

    // Download the file content
    const response = await drive.files.get({
      fileId: latestBackup.id!,
      alt: 'media',
    });

    return NextResponse.json({
      success: true,
      data: response.data,
      fileName: latestBackup.name,
      createdTime: latestBackup.createdTime
    });

  } catch (error) {
    console.error('Drive restore error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to restore from Google Drive',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}