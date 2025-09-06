'use client';

import React, { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  Google as GoogleIcon,
  CloudUpload as BackupIcon,
  CloudDownload as RestoreIcon,
  Logout as LogoutIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

export default function GoogleDriveBackup() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' });

  const handleBackup = async () => {
    setLoading(true);
    setMessage({ type: null, text: '' });

    try {
      // Gather all data from localStorage
      const backupData = {
        generatedNotes: localStorage.getItem('generated-notes') || '{}',
        coursesManifest: localStorage.getItem('courses-manifest') || '{"courses":[]}',
        courseProgress: {} as { [key: string]: string },
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };

      // Get all course progress data
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('course-progress-')) {
          backupData.courseProgress[key] = localStorage.getItem(key) || '';
        }
      }

      const response = await fetch('/api/drive/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: backupData }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: `Backup saved successfully to Google Drive!` });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to backup' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to connect to Google Drive' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!confirm('This will replace all your local data with the backup from Google Drive. Continue?')) {
      return;
    }

    setLoading(true);
    setMessage({ type: null, text: '' });

    try {
      const response = await fetch('/api/drive/restore');
      const result = await response.json();

      if (response.ok && result.success) {
        const backupData = result.data;
        
        // Restore all data to localStorage
        if (backupData.generatedNotes) {
          localStorage.setItem('generated-notes', backupData.generatedNotes);
        }
        if (backupData.coursesManifest) {
          localStorage.setItem('courses-manifest', backupData.coursesManifest);
        }
        
        // Restore course progress
        if (backupData.courseProgress) {
          Object.entries(backupData.courseProgress).forEach(([key, value]) => {
            localStorage.setItem(key, value as string);
          });
        }

        setMessage({ 
          type: 'success', 
          text: `Data restored successfully from ${new Date(result.createdTime).toLocaleString()}` 
        });
        
        // Reload the page to reflect changes
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to restore backup' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to connect to Google Drive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        color="inherit"
        onClick={() => setOpen(true)}
        startIcon={<GoogleIcon />}
      >
        Google Drive
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Google Drive Backup</Typography>
            {session && (
              <Chip
                icon={<CheckIcon />}
                label={session.user?.email}
                color="success"
                size="small"
              />
            )}
          </Box>
        </DialogTitle>

        <DialogContent>
          {status === 'loading' ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : !session ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <GoogleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" paragraph>
                Sign in with Google to backup and sync your notes to Google Drive
              </Typography>
              <Button
                variant="contained"
                startIcon={<GoogleIcon />}
                onClick={() => signIn('google')}
                size="large"
              >
                Sign in with Google
              </Button>
            </Box>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" paragraph>
                Your notes will be backed up to a folder called &quot;NurseNotes-AI-Backup&quot; in your Google Drive.
              </Typography>

              <List>
                <ListItem>
                  <ListItemIcon>
                    <BackupIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Backup to Drive"
                    secondary="Save all your notes and progress to Google Drive"
                  />
                  <Button
                    variant="contained"
                    onClick={handleBackup}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <BackupIcon />}
                  >
                    Backup
                  </Button>
                </ListItem>

                <Divider />

                <ListItem>
                  <ListItemIcon>
                    <RestoreIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Restore from Drive"
                    secondary="Restore your notes and progress from Google Drive"
                  />
                  <Button
                    variant="outlined"
                    onClick={handleRestore}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <RestoreIcon />}
                  >
                    Restore
                  </Button>
                </ListItem>

                <Divider />

                <ListItem>
                  <ListItemIcon>
                    <LogoutIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Sign Out"
                    secondary={`Signed in as ${session.user?.email}`}
                  />
                  <Button
                    variant="text"
                    onClick={() => signOut()}
                    color="error"
                  >
                    Sign Out
                  </Button>
                </ListItem>
              </List>

              {message.type && (
                <Alert 
                  severity={message.type} 
                  sx={{ mt: 2 }}
                  icon={message.type === 'success' ? <CheckIcon /> : <ErrorIcon />}
                >
                  {message.text}
                </Alert>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}