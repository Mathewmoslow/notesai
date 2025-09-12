'use client';

import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Home as HomeIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface NoteData {
  title: string;
  course: string;
  courseTitle?: string;
  date: string;
  html?: string;
  markdown?: string;
  [key: string]: unknown;
}

export default function RecoveryPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<Record<string, NoteData>>({});
  const [corruptedNotes, setCorruptedNotes] = useState<string[]>([]);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    analyzeNotes();
  }, []);

  const analyzeNotes = () => {
    setLoading(true);
    try {
      const storedNotes = JSON.parse(localStorage.getItem('generated-notes') || '{}');
      const corrupted: string[] = [];

      Object.entries(storedNotes).forEach(([slug, note]) => {
        const noteData = note as NoteData;
        
        // Check for corrupted HTML
        if (!noteData.html || 
            typeof noteData.html !== 'string' ||
            (!noteData.html.includes('<') || 
             (!noteData.html.includes('html') && !noteData.html.includes('div') && !noteData.html.includes('h')))) {
          corrupted.push(slug);
        }
      });

      setNotes(storedNotes);
      setCorruptedNotes(corrupted);
      
      if (corrupted.length === 0) {
        setMessage('All notes appear to be healthy!');
      } else {
        setMessage(`Found ${corrupted.length} potentially corrupted note(s)`);
      }
    } catch (error) {
      console.error('Error analyzing notes:', error);
      setMessage('Error analyzing notes. localStorage may be corrupted.');
    }
    setLoading(false);
  };

  const deleteNote = (slug: string) => {
    try {
      const storedNotes = JSON.parse(localStorage.getItem('generated-notes') || '{}');
      delete storedNotes[slug];
      localStorage.setItem('generated-notes', JSON.stringify(storedNotes));
      
      // Also remove from manifest
      const manifest = JSON.parse(localStorage.getItem('courses-manifest') || '{"courses":[]}');
      manifest.courses.forEach((course: { modules: Array<{ slug: string }> }) => {
        course.modules = course.modules.filter((m: { slug: string }) => m.slug !== slug);
      });
      localStorage.setItem('courses-manifest', JSON.stringify(manifest));
      
      setMessage(`Deleted note: ${notes[slug]?.title || slug}`);
      analyzeNotes(); // Refresh the list
    } catch (error) {
      console.error('Error deleting note:', error);
      setMessage('Failed to delete note');
    }
    setConfirmDelete(null);
  };

  const fixAllCorrupted = async () => {
    setFixing(true);
    let fixed = 0;
    
    for (const slug of corruptedNotes) {
      try {
        const storedNotes = JSON.parse(localStorage.getItem('generated-notes') || '{}');
        const note = storedNotes[slug];
        
        if (note && note.markdown) {
          // Try to regenerate HTML from markdown
          const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: note.title,
              course: note.course,
              courseName: note.courseTitle,
              module: note.module || '',
              source: 'Recovering from corrupted note',
              noteStyle: 'comprehensive',
              sections: ['overview', 'keyTakeaways', 'mainConcepts']
            })
          });
          
          if (response.ok) {
            fixed++;
          }
        } else {
          // If no markdown, we need to delete the corrupted note
          deleteNote(slug);
        }
      } catch (error) {
        console.error(`Failed to fix note ${slug}:`, error);
      }
    }
    
    setMessage(`Recovery complete. Fixed ${fixed} note(s), deleted ${corruptedNotes.length - fixed} unfixable note(s).`);
    setFixing(false);
    analyzeNotes(); // Refresh
  };

  const clearAllData = () => {
    if (confirm('This will delete ALL notes and course data. Are you absolutely sure?')) {
      localStorage.removeItem('generated-notes');
      localStorage.removeItem('courses-manifest');
      setMessage('All notes have been cleared. You can start fresh now.');
      router.push('/');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h3" gutterBottom>
          Note Recovery Tool
        </Typography>
        
        <Typography variant="body1" paragraph>
          This tool helps identify and fix corrupted notes that may cause the application to crash.
        </Typography>

        {loading ? (
          <Box sx={{ mt: 3 }}>
            <LinearProgress />
            <Typography sx={{ mt: 2 }}>Analyzing notes...</Typography>
          </Box>
        ) : (
          <>
            {message && (
              <Alert 
                severity={corruptedNotes.length > 0 ? 'warning' : 'success'} 
                sx={{ mb: 3 }}
              >
                {message}
              </Alert>
            )}

            {corruptedNotes.length > 0 && (
              <>
                <Box sx={{ mb: 3 }}>
                  <Button 
                    variant="contained" 
                    color="warning"
                    onClick={fixAllCorrupted}
                    disabled={fixing}
                    sx={{ mr: 2 }}
                  >
                    {fixing ? 'Fixing...' : 'Attempt to Fix All'}
                  </Button>
                  <Button 
                    variant="outlined"
                    onClick={analyzeNotes}
                    startIcon={<RefreshIcon />}
                  >
                    Re-analyze
                  </Button>
                </Box>

                <Typography variant="h5" gutterBottom>
                  Corrupted Notes
                </Typography>
                
                <List>
                  {corruptedNotes.map(slug => (
                    <ListItem key={slug}>
                      <ListItemText
                        primary={notes[slug]?.title || 'Untitled Note'}
                        secondary={
                          <Box>
                            <Chip 
                              label={notes[slug]?.course || 'Unknown Course'} 
                              size="small" 
                              sx={{ mr: 1 }}
                            />
                            <Chip 
                              label={notes[slug]?.date || 'Unknown Date'} 
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          onClick={() => setSelectedNote(slug)}
                          title="View Details"
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton 
                          edge="end" 
                          onClick={() => setConfirmDelete(slug)}
                          color="error"
                          title="Delete Note"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </>
            )}

            <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
              <Button 
                variant="contained"
                onClick={() => router.push('/')}
                startIcon={<HomeIcon />}
              >
                Go to Main Page
              </Button>
              <Button 
                variant="outlined"
                color="error"
                onClick={clearAllData}
              >
                Clear All Data (Nuclear Option)
              </Button>
            </Box>
          </>
        )}
      </Paper>

      {/* Note Details Dialog */}
      <Dialog 
        open={!!selectedNote} 
        onClose={() => setSelectedNote(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Note Details: {selectedNote && notes[selectedNote]?.title}
        </DialogTitle>
        <DialogContent>
          {selectedNote && (
            <Box>
              <Typography variant="body2" component="pre" sx={{ 
                background: '#f5f5f5', 
                p: 2, 
                overflow: 'auto',
                maxHeight: 400,
                fontSize: '12px'
              }}>
                {JSON.stringify(notes[selectedNote], null, 2)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedNote(null)}>Close</Button>
          <Button 
            color="error"
            onClick={() => {
              if (selectedNote) {
                deleteNote(selectedNote);
                setSelectedNote(null);
              }
            }}
          >
            Delete This Note
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={!!confirmDelete} 
        onClose={() => setConfirmDelete(null)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &quot;{confirmDelete && notes[confirmDelete]?.title}&quot;?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button 
            color="error"
            variant="contained"
            onClick={() => confirmDelete && deleteNote(confirmDelete)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}