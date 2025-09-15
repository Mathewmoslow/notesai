'use client';

import React, { useState, useEffect } from 'react';
import { DocumentParser } from '@/utils/documentParser';
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
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
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import GoogleDriveBackup from '@/components/GoogleDriveBackup';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  IconButton,
  Stack
} from '@mui/material';

interface Course {
  id: string;
  name: string;
  instructor?: string;
  description?: string;
}

// const defaultCourses: Course[] = [];

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

interface ModuleEntry {
  slug: string;
  title: string;
  date: string;
  path: string;
  module: string;
}

interface CourseEntry {
  id: string;
  title: string;
  modules: ModuleEntry[];
}

interface Manifest {
  courses: CourseEntry[];
}

interface SectionOption {
  id: string;
  label: string;
  description: string;
  category: string;
}

const sectionOptions: SectionOption[] = [
  // Core Sections
  { id: 'overview', label: 'Overview', description: 'Brief introduction and context', category: 'Core' },
  { id: 'keyTakeaways', label: 'Key Takeaways', description: 'Most important points to remember', category: 'Core' },
  { id: 'mainConcepts', label: 'Main Concepts', description: 'Core ideas and frameworks', category: 'Core' },
  
  // Clinical Sections
  { id: 'pathophysiology', label: 'Pathophysiology', description: 'Disease processes and mechanisms', category: 'Clinical' },
  { id: 'clinicalManifestations', label: 'Clinical Manifestations', description: 'Signs, symptoms, and assessments', category: 'Clinical' },
  { id: 'diagnostics', label: 'Diagnostic Studies', description: 'Tests, labs, and imaging', category: 'Clinical' },
  { id: 'nursingInterventions', label: 'Nursing Interventions', description: 'Care and management strategies', category: 'Clinical' },
  { id: 'medications', label: 'Medications', description: 'Drugs and pharmacology', category: 'Clinical' },
  { id: 'clinicalApplications', label: 'Clinical Applications', description: 'Theory to practice examples', category: 'Clinical' },
  { id: 'complications', label: 'Complications', description: 'Potential problems and risks', category: 'Clinical' },
  
  // Patient Care
  { id: 'patientEducation', label: 'Patient Education', description: 'Teaching and discharge planning', category: 'Patient Care' },
  { id: 'culturalConsiderations', label: 'Cultural Considerations', description: 'Diverse patient populations', category: 'Patient Care' },
  { id: 'ethicalLegal', label: 'Ethical & Legal', description: 'Ethics and legal aspects', category: 'Patient Care' },
  
  // Study Aids
  { id: 'keyTerms', label: 'Key Terms', description: 'Important vocabulary', category: 'Study Aids' },
  { id: 'mnemonics', label: 'Memory Aids', description: 'Mnemonics and tricks', category: 'Study Aids' },
  { id: 'conceptMap', label: 'Concept Map (Disease Processes)', description: 'Visual organization for diseases/conditions', category: 'Study Aids' },
  { id: 'checkYourself', label: 'Check Yourself', description: 'Self-assessment questions', category: 'Study Aids' },
  
  // Practice
  { id: 'practiceQuestions', label: 'Practice Questions', description: 'NCLEX-style questions', category: 'Practice' },
  { id: 'caseStudy', label: 'Case Study', description: 'Detailed patient scenario', category: 'Practice' },
  
  // Additional
  { id: 'clinicalPearls', label: 'Clinical Pearls', description: 'High-yield tips', category: 'Additional' },
  { id: 'redFlags', label: 'Red Flags', description: 'Critical warning signs', category: 'Additional' },
];

export default function Home() {
  const [tabValue, setTabValue] = useState(0);
  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('');
  const [module, setModule] = useState('');
  const [instructors, setInstructors] = useState('');
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatedPath, setGeneratedPath] = useState('');
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [openCourseDialog, setOpenCourseDialog] = useState(false);
  const [newCourseId, setNewCourseId] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseInstructor, setNewCourseInstructor] = useState('');
  const [newCourseDescription, setNewCourseDescription] = useState('');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseManagementOpen, setCourseManagementOpen] = useState(false);
  const [noteStyle, setNoteStyle] = useState<string>('guided');
  const [selectedSections, setSelectedSections] = useState<string[]>([
    'overview',
    'keyTakeaways',
    'mainConcepts',
    'clinicalApplications',
    'conceptMap',
    'keyTerms',
    'practiceQuestions'
  ]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadManifest();
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCourses = () => {
    const savedCourses = localStorage.getItem('user-courses');
    if (savedCourses) {
      const parsedCourses = JSON.parse(savedCourses);
      setCourses(parsedCourses);
      // Set default course if not already set
      if (!course && parsedCourses.length > 0) {
        setCourse(parsedCourses[0].id);
      }
    } else {
      // No saved courses - start with empty list
      setCourses([]);
      setCourse('');
    }
  };

  const saveCourses = (updatedCourses: Course[]) => {
    setCourses(updatedCourses);
    localStorage.setItem('user-courses', JSON.stringify(updatedCourses));
  };

  const handleAddCourse = () => {
    if (!newCourseId || !newCourseName) {
      setError('Please fill in both Course ID and Course Name');
      return;
    }
    
    // Check for duplicate course ID
    if (courses.some(c => c.id === newCourseId)) {
      setError('A course with this ID already exists');
      return;
    }
    
    const newCourse: Course = {
      id: newCourseId,
      name: newCourseName,
      instructor: newCourseInstructor,
      description: newCourseDescription
    };
    
    const updatedCourses = [...courses, newCourse];
    saveCourses(updatedCourses);
    
    setNewCourseId('');
    setNewCourseName('');
    setNewCourseInstructor('');
    setNewCourseDescription('');
    setOpenCourseDialog(false);
    setSuccess('Course added successfully!');
  };

  const handleDeleteCourse = (courseId: string) => {
    const updatedCourses = courses.filter(c => c.id !== courseId);
    saveCourses(updatedCourses);
    
    // Reset selected course if it was deleted
    if (course === courseId) {
      setCourse(updatedCourses.length > 0 ? updatedCourses[0].id : '');
    }
    
    setSuccess('Course deleted successfully!');
  };

  const handleEditCourse = (courseToEdit: Course) => {
    setEditingCourse(courseToEdit);
    setNewCourseId(courseToEdit.id);
    setNewCourseName(courseToEdit.name);
    setNewCourseInstructor(courseToEdit.instructor || '');
    setNewCourseDescription(courseToEdit.description || '');
    setOpenCourseDialog(true);
  };

  const handleUpdateCourse = () => {
    if (!editingCourse || !newCourseId || !newCourseName) {
      setError('Please fill in both Course ID and Course Name');
      return;
    }
    
    // Check for duplicate course ID (if ID was changed)
    if (newCourseId !== editingCourse.id && courses.some(c => c.id === newCourseId)) {
      setError('A course with this ID already exists');
      return;
    }
    
    const updatedCourses = courses.map(c => 
      c.id === editingCourse.id 
        ? { id: newCourseId, name: newCourseName, instructor: newCourseInstructor, description: newCourseDescription }
        : c
    );
    
    saveCourses(updatedCourses);
    
    // Update selected course if it was edited
    if (course === editingCourse.id) {
      setCourse(newCourseId);
    }
    
    setEditingCourse(null);
    setNewCourseId('');
    setNewCourseName('');
    setNewCourseInstructor('');
    setNewCourseDescription('');
    setOpenCourseDialog(false);
    setSuccess('Course updated successfully!');
  };

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
      const selectedCourse = courses.find(c => c.id === course);
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          course,
          courseName: selectedCourse?.name || course,
          module,
          instructors,
          source,
          sections: selectedSections,
          noteStyle,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Notes generated successfully!');
        
        // Store the generated note data with original input
        const noteData = {
          slug: data.slug,
          title: data.title,
          course: data.course,
          courseTitle: data.courseTitle,
          module: data.module,
          date: data.date,
          html: data.html,
          markdown: data.markdown,
          originalInput: data.originalInput // Store original input for redeploy
        };
        
        // Store in localStorage
        const storedNotes = JSON.parse(localStorage.getItem('generated-notes') || '{}');
        storedNotes[data.slug] = noteData;
        localStorage.setItem('generated-notes', JSON.stringify(storedNotes));
        
        // Update courses manifest in localStorage
        const manifest: Manifest = JSON.parse(localStorage.getItem('courses-manifest') || '{"courses":[]}');
        let courseEntry = manifest.courses.find((c: CourseEntry) => c.id === data.course);
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
        courseEntry.modules = [moduleEntry, ...courseEntry.modules.filter((m: ModuleEntry) => m.slug !== data.slug)];
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

    // Check if file format is supported
    if (!DocumentParser.isSupported(file.name)) {
      const supportedFormats = DocumentParser.getSupportedFormats();
      setError(`Unsupported file format. Supported formats: ${supportedFormats.slice(0, 10).join(', ')}...`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const parsed = await DocumentParser.parseFile(file);
      const formattedContent = DocumentParser.formatForDisplay(parsed);
      setSource(formattedContent);
      setSuccess(`File "${file.name}" loaded successfully (${parsed.metadata?.format || 'Unknown format'})`);
      
      // Auto-fill title if empty and metadata has title
      if (!title && parsed.metadata?.title) {
        setTitle(parsed.metadata.title);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to read file: ${errorMessage}`);
    } finally {
      setLoading(false);
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
          <GoogleDriveBackup />
          <IconButton 
            color="inherit" 
            onClick={() => window.location.href = '/settings'}
            sx={{ mr: 1 }}
          >
            <SettingsIcon />
          </IconButton>
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
            {courses.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Welcome to NurseNotes-AI!</strong>
                </Typography>
                <Typography variant="body2">
                  To get started, you&apos;ll need to add your first course. Click the Course dropdown below and select &quot;Add New Course&quot;.
                </Typography>
              </Alert>
            ) : (
              <Typography variant="body1" color="text.secondary" paragraph>
                Transform your nursing course materials into comprehensive, exam-ready study notes.
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary" paragraph>
              Supported formats: Word (.doc, .docx), Excel (.xls, .xlsx), PowerPoint (.ppt, .pptx), 
              PDF, HTML, Text files, Markdown, CSV, and various code formats.
            </Typography>

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }} suppressHydrationWarning>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    id="note-title"
                    sx={{ flex: '1 1 300px' }}
                    required
                    label="Note Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Management of Oncologic Disorders"
                    disabled={loading}
                  />
                  <FormControl sx={{ flex: '1 1 300px' }} required>
                    <InputLabel id="course-label">Course</InputLabel>
                    <Select
                      id="course-select"
                      labelId="course-label"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      label="Course"
                      disabled={loading || courses.length === 0}
                      displayEmpty
                    >
                      {courses.length === 0 && (
                        <MenuItem value="" disabled>
                          No courses available - Add one below
                        </MenuItem>
                      )}
                      {courses.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.id} - {c.name}
                        </MenuItem>
                      ))}
                      {courses.length > 0 && <Divider />}
                      <MenuItem onClick={() => {
                        setEditingCourse(null);
                        setNewCourseId('');
                        setNewCourseName('');
                        setOpenCourseDialog(true);
                      }}>
                        <AddIcon sx={{ mr: 1 }} /> Add New Course
                      </MenuItem>
                      <MenuItem onClick={() => setCourseManagementOpen(true)}>
                        <EditIcon sx={{ mr: 1 }} /> Manage Courses
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    id="module-input"
                    sx={{ flex: '1 1 300px' }}
                    label="Module (Optional)"
                    value={module}
                    onChange={(e) => setModule(e.target.value)}
                    placeholder="e.g., Module 2"
                    disabled={loading}
                  />
                  <TextField
                    id="instructors-input"
                    sx={{ flex: '1 1 300px' }}
                    label="Instructors (Optional)"
                    value={instructors}
                    onChange={(e) => setInstructors(e.target.value)}
                    placeholder="e.g., Dr. Smith, Prof. Johnson"
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
                        accept=".doc,.docx,.xls,.xlsx,.xlsm,.ppt,.pptx,.pdf,.txt,.md,.html,.htm,.css,.js,.jsx,.ts,.tsx,.json,.csv,.tsv,.xml,.yaml,.yml,.py,.java,.c,.cpp,.h,.hpp,.cs,.php,.rb,.go,.rs,.swift,.kt,.scala,.r,.m,.sql,.sh,.bash,.ps1,.bat"
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
                  id="source-material"
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

                {/* Note Style Selection */}
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SettingsIcon fontSize="small" />
                      Customize Note Generation
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {/* Note Style */}
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Note Style - Choose Your Learning Approach
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                          Select how detailed and structured you want your notes to be
                        </Typography>
                        <ToggleButtonGroup
                          value={noteStyle}
                          exclusive
                          onChange={(e, newStyle) => newStyle && setNoteStyle(newStyle)}
                          aria-label="note style"
                          orientation="vertical"
                          fullWidth
                        >
                          <ToggleButton value="comprehensive" aria-label="comprehensive" sx={{ py: 2, justifyContent: 'flex-start' }}>
                            <Box sx={{ textAlign: 'left', width: '100%' }}>
                              <Typography variant="body1" fontWeight="bold">📚 Comprehensive</Typography>
                              <Typography variant="caption" display="block" color="text.secondary">
                                Maximum detail with extensive explanations and multiple examples. Best for first-time learning.
                              </Typography>
                              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                <strong>Output:</strong> 10-15 pages • <strong>Use when:</strong> Learning new topics
                              </Typography>
                            </Box>
                          </ToggleButton>
                          <ToggleButton value="guided" aria-label="guided" sx={{ py: 2, justifyContent: 'flex-start' }}>
                            <Box sx={{ textAlign: 'left', width: '100%' }}>
                              <Typography variant="body1" fontWeight="bold">🎯 Guided</Typography>
                              <Typography variant="caption" display="block" color="text.secondary">
                                Well-structured with clear progression and smooth transitions. Balances depth with clarity.
                              </Typography>
                              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                <strong>Output:</strong> 7-10 pages • <strong>Use when:</strong> Following a learning path
                              </Typography>
                            </Box>
                          </ToggleButton>
                          <ToggleButton value="flexible" aria-label="flexible" sx={{ py: 2, justifyContent: 'flex-start' }}>
                            <Box sx={{ textAlign: 'left', width: '100%' }}>
                              <Typography variant="body1" fontWeight="bold">🔄 Flexible</Typography>
                              <Typography variant="caption" display="block" color="text.secondary">
                                Core concepts with room for expansion. Multiple perspectives on key topics.
                              </Typography>
                              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                <strong>Output:</strong> 5-8 pages • <strong>Use when:</strong> Building on existing knowledge
                              </Typography>
                            </Box>
                          </ToggleButton>
                          <ToggleButton value="concise" aria-label="concise" sx={{ py: 2, justifyContent: 'flex-start' }}>
                            <Box sx={{ textAlign: 'left', width: '100%' }}>
                              <Typography variant="body1" fontWeight="bold">⚡ Concise</Typography>
                              <Typography variant="caption" display="block" color="text.secondary">
                                High-yield facts and essential information only. Direct and focused on NCLEX-relevant content.
                              </Typography>
                              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                <strong>Output:</strong> 3-5 pages • <strong>Use when:</strong> Quick review or NCLEX prep
                              </Typography>
                            </Box>
                          </ToggleButton>
                          <ToggleButton value="exploratory" aria-label="exploratory" sx={{ py: 2, justifyContent: 'flex-start' }}>
                            <Box sx={{ textAlign: 'left', width: '100%' }}>
                              <Typography variant="body1" fontWeight="bold">🔍 Exploratory</Typography>
                              <Typography variant="caption" display="block" color="text.secondary">
                                Thought-provoking questions and deeper connections. Encourages critical thinking.
                              </Typography>
                              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                <strong>Output:</strong> 6-10 pages • <strong>Use when:</strong> Advanced study or concept exploration
                              </Typography>
                            </Box>
                          </ToggleButton>
                        </ToggleButtonGroup>
                      </Box>

                      {/* Section Selection */}
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Include Sections (AI will include relevant ones based on your content)
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                          <Button
                            size="small"
                            onClick={() => setSelectedSections(sectionOptions.map(s => s.id))}
                          >
                            Select All
                          </Button>
                          <Button
                            size="small"
                            onClick={() => setSelectedSections([])}
                          >
                            Clear All
                          </Button>
                          <Button
                            size="small"
                            onClick={() => setSelectedSections(['overview', 'keyTakeaways', 'mainConcepts', 'clinicalApplications', 'conceptMap', 'keyTerms', 'practiceQuestions'])}
                          >
                            Reset to Default
                          </Button>
                        </Box>
                        
                        {['Core', 'Clinical', 'Patient Care', 'Study Aids', 'Practice', 'Additional'].map(category => (
                          <Box key={category} sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                              {category}
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {sectionOptions
                                .filter(section => section.category === category)
                                .map(section => (
                                  <Tooltip key={section.id} title={section.description} arrow>
                                    <Chip
                                      label={section.label}
                                      onClick={() => {
                                        setSelectedSections(prev =>
                                          prev.includes(section.id)
                                            ? prev.filter(id => id !== section.id)
                                            : [...prev, section.id]
                                        );
                                      }}
                                      color={selectedSections.includes(section.id) ? 'primary' : 'default'}
                                      variant={selectedSections.includes(section.id) ? 'filled' : 'outlined'}
                                      size="small"
                                    />
                                  </Tooltip>
                                ))}
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>

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
              <>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search notes by title, course, module, or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  sx={{ mb: 2 }}
                />
                
                <List>
                  {recentNotes
                    .filter(note => {
                      const query = searchQuery.toLowerCase();
                      
                      // Get the full note content from localStorage for searching
                      const storedNotes = JSON.parse(localStorage.getItem('generated-notes') || '{}');
                      const fullNote = storedNotes[note.slug || ''];
                      
                      // Extract text content from HTML for searching
                      let bodyText = '';
                      if (fullNote && fullNote.html) {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = fullNote.html;
                        bodyText = (tempDiv.textContent || tempDiv.innerText || '').toLowerCase();
                      }
                      
                      return (
                        note.title.toLowerCase().includes(query) ||
                        (note.courseId || note.course).toLowerCase().includes(query) ||
                        (note.module || '').toLowerCase().includes(query) ||
                        bodyText.includes(query)
                      );
                    })
                    .map((note, index, filteredNotes) => (
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
                        {index < filteredNotes.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                </List>
                
                {recentNotes.filter(note => {
                  const query = searchQuery.toLowerCase();
                  
                  // Get the full note content from localStorage for searching
                  const storedNotes = JSON.parse(localStorage.getItem('generated-notes') || '{}');
                  const fullNote = storedNotes[note.slug || ''];
                  
                  // Extract text content from HTML for searching
                  let bodyText = '';
                  if (fullNote && fullNote.html) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = fullNote.html;
                    bodyText = (tempDiv.textContent || tempDiv.innerText || '').toLowerCase();
                  }
                  
                  return (
                    note.title.toLowerCase().includes(query) ||
                    (note.courseId || note.course).toLowerCase().includes(query) ||
                    (note.module || '').toLowerCase().includes(query) ||
                    bodyText.includes(query)
                  );
                }).length === 0 && searchQuery && (
                  <Alert severity="info">
                    No notes found matching &quot;{searchQuery}&quot;
                  </Alert>
                )}
              </>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="h4" gutterBottom>
              My Learning Modules
            </Typography>
            {courses.length === 0 ? (
              <>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2" gutterBottom>
                    <strong>No courses added yet!</strong>
                  </Typography>
                  <Typography variant="body2">
                    Add your first course to start building your personalized digital nursing textbook. Each course will contain all your generated study notes organized by module.
                  </Typography>
                </Alert>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setEditingCourse(null);
                    setNewCourseId('');
                    setNewCourseName('');
                    setNewCourseInstructor('');
                    setNewCourseDescription('');
                    setOpenCourseDialog(true);
                  }}
                  size="large"
                >
                  Add Your First Course
                </Button>
              </>
            ) : (
              <>
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
                        Course ID: {course.id}
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
          </>
        )}
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

        {/* Add/Edit Course Dialog */}
        <Dialog open={openCourseDialog} onClose={() => setOpenCourseDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingCourse ? 'Edit Course' : 'Add New Course'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                fullWidth
                label="Course ID"
                value={newCourseId}
                onChange={(e) => setNewCourseId(e.target.value)}
                placeholder="e.g., NURS340"
                helperText="Enter the course code/ID"
              />
              <TextField
                fullWidth
                label="Course Name"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                placeholder="e.g., Pediatric Nursing"
                helperText="Enter the full course name"
              />
              <TextField
                fullWidth
                label="Instructor(s)"
                value={newCourseInstructor}
                onChange={(e) => setNewCourseInstructor(e.target.value)}
                placeholder="e.g., Dr. Smith, Prof. Johnson"
                helperText="Enter the instructor name(s) (optional)"
              />
              <TextField
                fullWidth
                label="Course Description"
                value={newCourseDescription}
                onChange={(e) => setNewCourseDescription(e.target.value)}
                placeholder="Brief description of the course"
                helperText="Enter a brief description (optional)"
                multiline
                rows={3}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setOpenCourseDialog(false);
              setEditingCourse(null);
              setNewCourseId('');
              setNewCourseName('');
              setNewCourseInstructor('');
              setNewCourseDescription('');
            }}>
              Cancel
            </Button>
            <Button 
              onClick={editingCourse ? handleUpdateCourse : handleAddCourse} 
              variant="contained"
              startIcon={editingCourse ? <SaveIcon /> : <AddIcon />}
            >
              {editingCourse ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Course Management Dialog */}
        <Dialog open={courseManagementOpen} onClose={() => setCourseManagementOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Manage Courses
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Edit or delete existing courses. Changes are saved automatically.
            </Typography>
            <List>
              {courses.map((courseItem, index) => (
                <React.Fragment key={courseItem.id}>
                  <ListItem
                    secondaryAction={
                      <Stack direction="row" spacing={1}>
                        <IconButton edge="end" onClick={() => handleEditCourse(courseItem)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton edge="end" onClick={() => handleDeleteCourse(courseItem.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    }
                  >
                    <ListItemText
                      primary={courseItem.name}
                      secondary={`Course ID: ${courseItem.id}`}
                    />
                  </ListItem>
                  {index < courses.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
            {courses.length === 0 && (
              <Alert severity="info">
                No courses added yet. Close this dialog and use &quot;Add New Course&quot; to get started.
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCourseManagementOpen(false)}>
              Close
            </Button>
            <Button 
              onClick={() => {
                setCourseManagementOpen(false);
                setEditingCourse(null);
                setNewCourseId('');
                setNewCourseName('');
                setNewCourseInstructor('');
                setNewCourseDescription('');
                setOpenCourseDialog(true);
              }}
              variant="contained"
              startIcon={<AddIcon />}
            >
              Add New Course
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}