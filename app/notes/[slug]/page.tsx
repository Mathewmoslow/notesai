'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Container, 
  Paper, 
  Typography, 
  Button, 
  Box,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  ArrowBack as BackIcon,
  Refresh as RefreshIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import RichTextEditor from '@/components/RichTextEditor';
import NoteRenderer from '@/components/NoteRenderer';

interface NoteData {
  slug: string;
  title: string;
  course: string;
  courseTitle: string;
  module: string;
  date: string;
  html: string;
  markdown: string;
  originalInput?: {
    title: string;
    course: string;
    module: string;
    source: string;
    systemPromptVersion: string;
    generatedAt: string;
    redeployedFrom?: string;
    redeployMode?: string;
  };
}

export default function NotePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [noteData, setNoteData] = useState<NoteData | null>(null);
  const [noteHtml, setNoteHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [redeploying, setRedeploying] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [customPromptDialog, setCustomPromptDialog] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load note from localStorage
    const storedNotes = JSON.parse(localStorage.getItem('generated-notes') || '{}');
    const note = storedNotes[slug];
    
    if (note) {
      setNoteData(note);
      setNoteHtml(note.html);
    } else {
      setNoteHtml(`
        <div style="padding: 40px; text-align: center;">
          <h1>Note Not Found</h1>
          <p>The requested note could not be found. Please generate it first.</p>
        </div>
      `);
    }
    setLoading(false);
  }, [slug]);

  const handleRedeployMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleRedeployMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRedeploy = async (mode: 'previous' | 'current' | 'custom') => {
    handleRedeployMenuClose();
    
    if (mode === 'custom') {
      setCustomPromptDialog(true);
      return;
    }

    await performRedeploy(mode);
  };

  const performRedeploy = async (mode: 'previous' | 'current' | 'custom', customPromptText?: string) => {
    if (!noteData?.originalInput) {
      setError('Cannot redeploy: Original input data is missing. This note needs to be regenerated first.');
      return;
    }

    setRedeploying(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/redeploy', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug,
          redeployMode: mode,
          customPrompt: customPromptText || '',
          originalInput: noteData.originalInput
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Notes redeployed successfully with ${mode} settings!`);
        
        // Store the redeployed note data
        const newNoteData = {
          slug: data.slug,
          title: data.title,
          course: data.course,
          courseTitle: data.courseTitle,
          module: data.module,
          date: data.date,
          html: data.html,
          markdown: data.markdown,
          originalInput: data.originalInput
        };
        
        // Store in localStorage
        const storedNotes = JSON.parse(localStorage.getItem('generated-notes') || '{}');
        storedNotes[data.slug] = newNoteData;
        localStorage.setItem('generated-notes', JSON.stringify(storedNotes));
        
        // Update courses manifest
        const manifest = JSON.parse(localStorage.getItem('courses-manifest') || '{"courses":[]}');
        let courseEntry = manifest.courses.find((c: { id: string }) => c.id === data.course);
        if (!courseEntry) {
          courseEntry = {
            id: data.course,
            title: data.courseTitle,
            modules: []
          };
          manifest.courses.push(courseEntry);
        }
        
        // Add redeployed note to course
        const moduleEntry = {
          slug: data.slug,
          title: data.title,
          date: data.date,
          path: `/notes/${data.slug}`,
          module: data.module
        };
        
        courseEntry.modules = [moduleEntry, ...courseEntry.modules.filter((m: { slug: string }) => m.slug !== data.slug)];
        localStorage.setItem('courses-manifest', JSON.stringify(manifest));
        
        // Navigate to the new redeployed note
        setTimeout(() => {
          router.push(`/notes/${data.slug}`);
        }, 1500);
        
      } else {
        setError(data.error || 'Failed to redeploy notes');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError('Network error: ' + errorMessage);
    } finally {
      setRedeploying(false);
    }
  };

  const handleCustomPromptSubmit = async () => {
    if (!customPrompt.trim()) {
      setError('Please enter a custom prompt');
      return;
    }
    
    setCustomPromptDialog(false);
    await performRedeploy('custom', customPrompt);
    setCustomPrompt('');
  };

  const handleEditToggle = () => {
    setEditMode(!editMode);
  };

  const handleSaveEdit = async (newContent: string) => {
    setSaving(true);
    try {
      // Update the note in localStorage
      const storedNotes = JSON.parse(localStorage.getItem('generated-notes') || '{}');
      if (storedNotes[slug]) {
        storedNotes[slug].html = newContent;
        localStorage.setItem('generated-notes', JSON.stringify(storedNotes));
        setNoteHtml(newContent);
        setSuccess('Note saved successfully!');
        setEditMode(false);
      }
    } catch {
      setError('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      // Remove from localStorage
      const storedNotes = JSON.parse(localStorage.getItem('generated-notes') || '{}');
      delete storedNotes[slug];
      localStorage.setItem('generated-notes', JSON.stringify(storedNotes));
      
      // Remove from manifest
      const manifest = JSON.parse(localStorage.getItem('courses-manifest') || '{"courses":[]}');
      manifest.courses.forEach((course: { modules: { slug: string }[] }) => {
        course.modules = course.modules.filter((m: { slug: string }) => m.slug !== slug);
      });
      localStorage.setItem('courses-manifest', JSON.stringify(manifest));
      
      setSuccess('Note deleted successfully!');
      setDeleteConfirmDialog(false);
      
      // Redirect to home after a short delay
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch {
      setError('Failed to delete note');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${noteData?.title || 'Note'}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            ${noteHtml}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (loading) {
    return (
      <Container>
        <Typography>Loading note...</Typography>
      </Container>
    );
  }

  const hasOriginalInput = noteData?.originalInput && noteData.originalInput.source;
  const isRedeployed = noteData?.originalInput?.redeployedFrom;

  return (
    <>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => router.back()}
        >
          Back
        </Button>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!editMode && (
            <>
              <Tooltip title="Edit Note">
                <IconButton onClick={handleEditToggle} color="primary">
                  <EditIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Print Note">
                <IconButton onClick={handlePrint}>
                  <PrintIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Delete Note">
                <IconButton onClick={() => setDeleteConfirmDialog(true)} color="error">
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
          
          {editMode && (
            <>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => handleSaveEdit(noteHtml)}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={() => {
                  setEditMode(false);
                  // Reload original content
                  const storedNotes = JSON.parse(localStorage.getItem('generated-notes') || '{}');
                  const note = storedNotes[slug];
                  if (note) {
                    setNoteHtml(note.html);
                  }
                }}
              >
                Cancel
              </Button>
            </>
          )}
          
          {hasOriginalInput && !editMode && (
            <Box>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                endIcon={<ArrowDownIcon />}
                onClick={handleRedeployMenuOpen}
                disabled={redeploying}
              >
                {redeploying ? 'Redeploying...' : 'Redeploy'}
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleRedeployMenuClose}
              >
                <MenuItem onClick={() => handleRedeploy('previous')}>
                  <Box>
                    <Typography variant="body1">Redeploy with Previous</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Use original system prompt (v{noteData?.originalInput?.systemPromptVersion || '1'})
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem onClick={() => handleRedeploy('current')}>
                  <Box>
                    <Typography variant="body1">Redeploy with Current</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Use latest system prompt (v2)
                    </Typography>
                  </Box>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => handleRedeploy('custom')}>
                  <Box>
                    <Typography variant="body1">Redeploy with Custom Prompt</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Provide your own system prompt
                    </Typography>
                  </Box>
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Box>
      </Box>
      
      {!hasOriginalInput && noteData && (
        <Box sx={{ p: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
          <Typography variant="body2">
            This note was generated before redeploy functionality was added. 
            To enable redeploy, please regenerate this note from the main page.
          </Typography>
        </Box>
      )}
      
      {isRedeployed && (
        <Box sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
          <Typography variant="body2">
            This note was redeployed using {noteData?.originalInput?.redeployMode} mode
            {noteData?.originalInput?.redeployedFrom && (
              <> from <strong>{noteData.originalInput.redeployedFrom}</strong></>
            )}
          </Typography>
        </Box>
      )}
      
      <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
        <Paper elevation={0} sx={{ p: 0 }}>
          {editMode ? (
            <RichTextEditor
              initialContent={noteHtml}
              onSave={handleSaveEdit}
              onPrint={handlePrint}
            />
          ) : (
            <NoteRenderer content={noteHtml} />
          )}
        </Paper>
      </Container>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmDialog}
        onClose={() => setDeleteConfirmDialog(false)}
      >
        <DialogTitle>Delete Note</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &quot;{noteData?.title}&quot;? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Custom Prompt Dialog */}
      <Dialog 
        open={customPromptDialog} 
        onClose={() => setCustomPromptDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Redeploy with Custom Prompt</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Enter your custom system prompt below. This will be used to regenerate the notes
            from the original source material.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={10}
            variant="outlined"
            label="Custom System Prompt"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Enter your custom prompt here..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomPromptDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCustomPromptSubmit}
            variant="contained"
            disabled={!customPrompt.trim()}
          >
            Redeploy
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading Overlay */}
      {redeploying && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress />
            <Typography>Redeploying notes...</Typography>
          </Paper>
        </Box>
      )}

      {/* Error/Success Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess('')}
      >
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      </Snackbar>
    </>
  );
}