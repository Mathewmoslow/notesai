'use client';

import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Home as HomeIcon,
  Storage as StorageIcon,
  School as SchoolIcon,
  Description as NotesIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [showConfirmText, setShowConfirmText] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [storageInfo, setStorageInfo] = useState({
    notes: 0,
    courses: 0,
    manifest: 0,
    total: 0
  });

  React.useEffect(() => {
    calculateStorage();
  }, []);

  const calculateStorage = () => {
    try {
      const notes = localStorage.getItem('generated-notes') || '{}';
      const courses = localStorage.getItem('user-courses') || '[]';
      const manifest = localStorage.getItem('courses-manifest') || '{"courses":[]}';
      
      const notesSize = new Blob([notes]).size;
      const coursesSize = new Blob([courses]).size;
      const manifestSize = new Blob([manifest]).size;
      
      setStorageInfo({
        notes: notesSize,
        courses: coursesSize,
        manifest: manifestSize,
        total: notesSize + coursesSize + manifestSize
      });
    } catch (error) {
      console.error('Error calculating storage:', error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFactoryReset = () => {
    if (confirmText.toLowerCase() !== 'deleteall') {
      setError('Please type "deleteall" to confirm');
      return;
    }

    try {
      // Clear all localStorage data
      localStorage.removeItem('generated-notes');
      localStorage.removeItem('user-courses');
      localStorage.removeItem('courses-manifest');
      localStorage.removeItem('course-progress');
      
      // Clear any course-specific progress
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('course-progress-')) {
          localStorage.removeItem(key);
        }
      });

      setMessage('All data has been wiped. Returning to home...');
      setConfirmDialog(false);
      setConfirmText('');
      
      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push('/');
        // Force reload to ensure clean state
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error during factory reset:', error);
      setError('Failed to reset data. Please try again.');
    }
  };

  const countItems = () => {
    try {
      const notes = JSON.parse(localStorage.getItem('generated-notes') || '{}');
      const courses = JSON.parse(localStorage.getItem('user-courses') || '[]');
      const manifest = JSON.parse(localStorage.getItem('courses-manifest') || '{"courses":[]}');
      
      const notesCount = Object.keys(notes).length;
      const coursesCount = courses.length;
      const modulesCount = manifest.courses.reduce((acc: number, course: any) => 
        acc + (course.modules?.length || 0), 0);
      
      return { notesCount, coursesCount, modulesCount };
    } catch {
      return { notesCount: 0, coursesCount: 0, modulesCount: 0 };
    }
  };

  const stats = countItems();

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h3" gutterBottom>
          Settings & Data Management
        </Typography>
        
        <Divider sx={{ my: 3 }} />

        {/* Storage Information */}
        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
          <StorageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Storage Information
        </Typography>
        
        <List>
          <ListItem>
            <ListItemIcon>
              <NotesIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Generated Notes"
              secondary={`${stats.notesCount} notes using ${formatBytes(storageInfo.notes)}`}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <SchoolIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Courses"
              secondary={`${stats.coursesCount} courses using ${formatBytes(storageInfo.courses)}`}
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <StorageIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Course Modules"
              secondary={`${stats.modulesCount} modules using ${formatBytes(storageInfo.manifest)}`}
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText 
              primary={<strong>Total Storage Used</strong>}
              secondary={formatBytes(storageInfo.total)}
            />
          </ListItem>
        </List>

        <Divider sx={{ my: 3 }} />

        {/* Factory Reset Section */}
        <Typography variant="h5" gutterBottom sx={{ mt: 3, color: 'error.main' }}>
          <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Danger Zone
        </Typography>
        
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            <strong>Factory Reset will permanently delete:</strong>
          </Typography>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>All generated notes</li>
            <li>All custom courses</li>
            <li>All progress tracking</li>
            <li>All course modules and content</li>
          </ul>
          <Typography variant="body2">
            This action cannot be undone. Make sure to export or backup any important data before proceeding.
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setConfirmDialog(true)}
            size="large"
          >
            Factory Reset - Delete All Data
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={() => router.push('/')}
          >
            Back to Home
          </Button>
        </Box>

        {/* Messages */}
        {message && (
          <Alert severity="success" sx={{ mb: 2 }} icon={<CheckIcon />}>
            {message}
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog 
        open={confirmDialog} 
        onClose={() => {
          setConfirmDialog(false);
          setConfirmText('');
          setError('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>
          <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Confirm Factory Reset
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body1" gutterBottom>
              <strong>THIS WILL DELETE ALL YOUR DATA PERMANENTLY!</strong>
            </Typography>
            <Typography variant="body2">
              You are about to delete {stats.notesCount} notes, {stats.coursesCount} courses, 
              and {stats.modulesCount} modules ({formatBytes(storageInfo.total)} of data).
            </Typography>
          </Alert>
          
          <Typography variant="body1" gutterBottom>
            To confirm this action, please type <strong>deleteall</strong> in the field below:
          </Typography>
          
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type deleteall to confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            error={confirmText !== '' && confirmText.toLowerCase() !== 'deleteall'}
            helperText={confirmText !== '' && confirmText.toLowerCase() !== 'deleteall' 
              ? 'Text must match "deleteall" exactly' 
              : 'This action cannot be undone'}
            sx={{ mt: 2 }}
            type={showConfirmText ? 'text' : 'password'}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmText(!showConfirmText)}
                    edge="end"
                  >
                    {showConfirmText ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            autoComplete="off"
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setConfirmDialog(false);
              setConfirmText('');
              setError('');
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleFactoryReset}
            variant="contained"
            color="error"
            disabled={confirmText.toLowerCase() !== 'deleteall'}
            startIcon={<DeleteIcon />}
          >
            Delete Everything
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}