'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Chip,
  Divider,
} from '@mui/material';
import {
  School as SchoolIcon,
  CloudUpload as CloudUploadIcon,
  ContentPaste as PasteIcon,
  Description as NotesIcon,
  AutoAwesome as GenerateIcon,
  Refresh as RefreshIcon,
  MenuBook as TextbookIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';

interface Course {
  id: string;
  name: string;
  instructors: string;
}

const courses: Course[] = [
  { id: 'NURS310', name: 'Adult Health I', instructors: 'G. Hagerstrom; S. Dumas' },
  { id: 'NURS320', name: 'Adult Health II', instructors: 'G. Hagerstrom; S. Dumas' },
  { id: 'NURS335', name: 'NCLEX Immersion I', instructors: 'A. Hernandez; G. Rivera' },
  { id: 'NURS330', name: 'Childbearing Family/OBGYN', instructors: 'S. Abdo; M. Douglas' },
  { id: 'NURS315', name: 'Gerontological Nursing', instructors: 'A. Layson' },
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface Note {
  title: string;
  course: string;
  courseId?: string;
  courseTitle?: string;
  module?: string;
  date: string;
  path: string;
  slug?: string;
}

export default function Home() {
  const [tabValue, setTabValue] = useState(0);
  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('NURS320');
  const [module, setModule] = useState('');
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatedPath, setGeneratedPath] = useState('');
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);

  useEffect(() => {
    loadManifest();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !course || !source) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setGeneratedPath('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          course,
          module,
          source,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Notes generated successfully!');
        
        // Store the generated note data
        const noteData = {
          slug: data.slug,
          title: data.title,
          course: data.course,
          courseTitle: data.courseTitle,
          module: data.module,
          date: data.date,
          html: data.html,
          markdown: data.markdown
        };
        
        // Store in localStorage
        const storedNotes = JSON.parse(localStorage.getItem('generated-notes') || '{}');
        storedNotes[data.slug] = noteData;
        localStorage.setItem('generated-notes', JSON.stringify(storedNotes));
        
        // Update courses manifest in localStorage
        const manifest = JSON.parse(localStorage.getItem('courses-manifest') || '{"courses":[]}');
        let courseEntry = manifest.courses.find((c: any) => c.id === data.course);
        if (!courseEntry) {
          courseEntry = {
            id: data.course,
            title: data.courseTitle,
            modules: []
          };
          manifest.courses.push(courseEntry);
        }
        
        // Add new module to course
        const moduleEntry = {
          slug: data.slug,
          title: data.title,
          date: data.date,
          path: `/notes/${data.slug}`,
          module: data.module
        };
        
        // Remove duplicate if exists and add new one at the beginning
        courseEntry.modules = [moduleEntry, ...courseEntry.modules.filter((m: any) => m.slug !== data.slug)];
        localStorage.setItem('courses-manifest', JSON.stringify(manifest));
        
        // Set generated path for viewing
        setGeneratedPath(`/notes/${data.slug}`);
        
        // Add to recent notes
        setRecentNotes(prev => [{
          title: data.title,
          course: data.course,
          courseId: data.course,
          courseTitle: data.courseTitle,
          module: data.module,
          date: data.date,
          path: `/notes/${data.slug}`,
          slug: data.slug
        }, ...prev].slice(0, 10));
        
        // Clear form
        setTitle('');
        setModule('');
        setSource('');
      } else {
        setError(data.error || 'Failed to generate notes');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError('Network error: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
      setError('Please upload a .txt or .md file');
      return;
    }

    try {
      const text = await file.text();
      setSource(text);
      setSuccess(`File "${file.name}" loaded successfully`);
    } catch {
      setError('Failed to read file');
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setSource(text);
      setSuccess('Content pasted from clipboard');
    } catch {
      setError('Failed to read clipboard. Please paste manually.');
    }
  };

  const loadManifest = () => {
    try {
      const manifest = JSON.parse(localStorage.getItem('courses-manifest') || '{"courses":[]}');
      const allNotes: Note[] = [];
      manifest.courses.forEach((course: { id: string; title: string; modules: Note[] }) => {
        course.modules.forEach((module: Note) => {
          allNotes.push({
            ...module,
            courseId: course.id,
            courseTitle: course.title,
          });
        });
      });
      setRecentNotes(allNotes.slice(0, 10));
    } catch {
      console.error('Failed to load manifest');
    }
  };

  return (
    <>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <SchoolIcon sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            NurseNotes-AI
          </Typography>
          <Button 
            color="inherit" 
            onClick={() => window.location.href = '/semester'}
            startIcon={<TextbookIcon />}
          >
            Semester View
          </Button>
          <Button 
            color="inherit" 
            onClick={() => window.location.href = '/courses/NURS320'}
            startIcon={<TimelineIcon />}
          >
            Learning Path
          </Button>
          <Button color="inherit" onClick={loadManifest}>
            <RefreshIcon sx={{ mr: 1 }} />
            Load Notes
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} aria-label="tabs">
              <Tab icon={<GenerateIcon />} label="Generate Notes" />
              <Tab icon={<NotesIcon />} label="Recent Notes" />
              <Tab icon={<TextbookIcon />} label="My Courses" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Typography variant="h4" gutterBottom>
              Generate Study Notes
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Transform your nursing course materials into comprehensive, exam-ready study notes.
            </Typography>

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    sx={{ flex: '1 1 300px' }}
                    required
                    label="Note Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Management of Oncologic Disorders"
                    disabled={loading}
                  />
                  <FormControl sx={{ flex: '1 1 300px' }} required>
                    <InputLabel>Course</InputLabel>
                    <Select
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      label="Course"
                      disabled={loading}
                    >
                      {courses.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.id} - {c.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    sx={{ flex: '1 1 300px' }}
                    label="Module (Optional)"
                    value={module}
                    onChange={(e) => setModule(e.target.value)}
                    placeholder="e.g., Module 2"
                    disabled={loading}
                  />
                  <Box sx={{ flex: '1 1 300px', display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<CloudUploadIcon />}
                      disabled={loading}
                      fullWidth
                    >
                      Upload File
                      <input
                        type="file"
                        hidden
                        accept=".txt,.md"
                        onChange={handleFileUpload}
                      />
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handlePaste}
                      startIcon={<PasteIcon />}
                      disabled={loading}
                      fullWidth
                    >
                      Paste
                    </Button>
                  </Box>
                </Box>

                <TextField
                  fullWidth
                  required
                  multiline
                  rows={12}
                  label="Source Material"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Paste or type your lecture transcript, slides, or notes here..."
                  disabled={loading}
                  sx={{ fontFamily: 'monospace' }}
                />

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading || !title || !course || !source}
                    startIcon={loading ? <CircularProgress size={20} /> : <GenerateIcon />}
                  >
                    {loading ? 'Generating...' : 'Generate Notes'}
                  </Button>

                  {generatedPath && (
                    <Button
                      variant="outlined"
                      onClick={() => window.location.href = generatedPath}
                      startIcon={<NotesIcon />}
                    >
                      View Generated Notes
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="h4" gutterBottom>
              Recent Notes
            </Typography>
            
            {recentNotes.length === 0 ? (
              <Alert severity="info">
                No notes generated yet. Create your first note to see it here!
              </Alert>
            ) : (
              <List>
                {recentNotes.map((note, index) => (
                  <React.Fragment key={index}>
                    <ListItem disablePadding>
                      <ListItemButton
                        onClick={() => window.location.href = note.path}
                      >
                        <ListItemText
                          primary={note.title}
                          secondary={
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                              <Chip label={note.courseId || note.course} size="small" color="primary" />
                              {note.module && <Chip label={note.module} size="small" />}
                              <Chip label={note.date} size="small" variant="outlined" />
                            </Box>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                    {index < recentNotes.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="h4" gutterBottom>
              My Learning Modules
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Access your complete digital textbook organized by course. Each module builds on the previous one to create a comprehensive learning experience.
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
              {courses.map((course) => (
                <Paper key={course.id} sx={{ p: 3, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                  <Box 
                    onClick={() => window.location.href = `/courses/${course.id}`}
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Box>
                      <Typography variant="h6">
                        {course.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Course ID: {course.id} • Instructors: {course.instructors}
                      </Typography>
                    </Box>
                    <Button variant="contained" endIcon={<TextbookIcon />}>
                      View Course
                    </Button>
                  </Box>
                </Paper>
              ))}
              
              <Paper sx={{ p: 3, bgcolor: 'primary.main', color: 'white' }}>
                <Box 
                  onClick={() => window.location.href = '/semester'}
                  sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Box>
                    <Typography variant="h6">
                      Complete Semester Overview
                    </Typography>
                    <Typography variant="body2">
                      View all courses as a comprehensive digital textbook with progress tracking
                    </Typography>
                  </Box>
                  <Button variant="contained" color="secondary" endIcon={<TimelineIcon />}>
                    View Semester
                  </Button>
                </Box>
              </Paper>
            </Box>
          </TabPanel>
        </Paper>

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
      </Container>
    </>
  );
}