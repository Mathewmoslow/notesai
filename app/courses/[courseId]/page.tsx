'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Breadcrumbs,
  Link,
  Card,
  CardContent,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import {
  School as SchoolIcon,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckedIcon,
  ExpandMore as ExpandMoreIcon,
  MenuBook as TextbookIcon,
  Quiz as QuizIcon,
  Download as DownloadIcon,
  Home as HomeIcon,
} from '@mui/icons-material';

interface Module {
  slug: string;
  title: string;
  date: string;
  path: string;
  module?: string;
  completed?: boolean;
}

interface Course {
  id: string;
  title: string;
  modules: Module[];
  instructor?: string;
  description?: string;
}

// No hardcoded course info - all data comes from localStorage

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());

  const loadCourseData = () => {
    try {
      // Check localStorage for all courses
      const storedCourses = JSON.parse(localStorage.getItem('user-courses') || '[]');
      const dynamicCourse = storedCourses.find((c: { id: string; name: string; instructor?: string; description?: string }) => c.id === courseId);
      
      const manifest = JSON.parse(localStorage.getItem('courses-manifest') || '{"courses":[]}');
      const courseData = manifest.courses.find((c: Course) => c.id === courseId);
      
      if (courseData) {
        // Use course data from manifest with info from user-courses
        setCourse({
          ...courseData,
          instructor: dynamicCourse?.instructor || '',
          description: dynamicCourse?.description || 'Course content will be generated based on your study materials.'
        });
      } else if (dynamicCourse) {
        // Create empty course structure for new courses
        setCourse({
          id: courseId,
          title: dynamicCourse.name || courseId,
          instructor: dynamicCourse.instructor || '',
          description: dynamicCourse.description || 'Course content will be generated based on your study materials.',
          modules: []
        });
      } else {
        // Course not found
        setCourse(null);
      }
    } catch (error) {
      console.error('Failed to load course data:', error);
    }
  };

  const loadProgress = () => {
    const saved = localStorage.getItem(`course-progress-${courseId}`);
    if (saved) {
      setCompletedModules(new Set(JSON.parse(saved)));
    }
  };

  useEffect(() => {
    loadCourseData();
    loadProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const toggleModuleComplete = (moduleSlug: string) => {
    const newCompleted = new Set(completedModules);
    if (newCompleted.has(moduleSlug)) {
      newCompleted.delete(moduleSlug);
    } else {
      newCompleted.add(moduleSlug);
    }
    setCompletedModules(newCompleted);
    localStorage.setItem(`course-progress-${courseId}`, JSON.stringify(Array.from(newCompleted)));
  };

  const getProgress = () => {
    if (!course) return 0;
    return (completedModules.size / course.modules.length) * 100;
  };

  const exportAsTextbook = async () => {
    if (!course || course.modules.length === 0) {
      alert('No modules available to export');
      return;
    }
    
    // Get actual content from localStorage
    const storedNotes = JSON.parse(localStorage.getItem('generated-notes') || '{}');
    
    // Build chapters with actual content
    const chapters = course.modules.map((module, index) => {
      const noteData = storedNotes[module.slug];
      if (!noteData || !noteData.html) {
        return `
          <div class="chapter">
            <h1 class="chapter-title">Chapter ${index + 1}: ${module.title}</h1>
            <p class="missing-content">Content not available. Please regenerate this note.</p>
          </div>
        `;
      }
      
      // Extract just the body content from the stored HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(noteData.html, 'text/html');
      const contentWrapper = doc.querySelector('.content-wrapper');
      const content = contentWrapper ? contentWrapper.innerHTML : noteData.html;
      
      return `
        <div class="chapter">
          <h1 class="chapter-title">Chapter ${index + 1}: ${module.title}</h1>
          <div class="chapter-meta">Module: ${module.module || 'General'} | Date: ${module.date}</div>
          ${content}
        </div>
      `;
    }).join('');
    
    // Create print-optimized HTML document
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${course.title} - Complete Textbook</title>
  <style>
    /* Reset and base styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    /* Page setup for 8.5x11 inches */
    @page {
      size: 8.5in 11in;
      margin: 1in;
    }
    
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #000;
      background: white;
    }
    
    /* For screen viewing - simulate paper */
    @media screen {
      body {
        background: #e0e0e0;
      }
      .page-container {
        width: 8.5in;
        min-height: 11in;
        margin: 20px auto;
        padding: 1in;
        background: white;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
      }
    }
    
    /* Print styles */
    @media print {
      body {
        background: white;
      }
      .page-container {
        width: 100%;
        margin: 0;
        padding: 0;
        box-shadow: none;
      }
    }
    
    /* Cover page */
    .cover-page {
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 9in;
      text-align: center;
    }
    
    .cover-title {
      font-size: 36pt;
      font-weight: bold;
      color: #1976d2;
      margin-bottom: 20px;
    }
    
    .cover-subtitle {
      font-size: 18pt;
      color: #666;
      margin-bottom: 40px;
    }
    
    .cover-meta {
      font-size: 12pt;
      color: #888;
    }
    
    /* Table of contents */
    .toc {
      page-break-after: always;
    }
    
    .toc h2 {
      font-size: 24pt;
      color: #1976d2;
      margin-bottom: 30px;
      border-bottom: 2px solid #1976d2;
      padding-bottom: 10px;
    }
    
    .toc-item {
      font-size: 12pt;
      margin: 10px 0;
      padding-left: 20px;
      line-height: 1.8;
    }
    
    .toc-item::before {
      content: "→ ";
      color: #1976d2;
      margin-left: -20px;
      margin-right: 10px;
    }
    
    /* Chapters */
    .chapter {
      page-break-before: always;
    }
    
    .chapter-title {
      font-size: 24pt;
      color: #1976d2;
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 2px solid #1976d2;
    }
    
    .chapter-meta {
      font-size: 10pt;
      color: #666;
      margin-bottom: 30px;
      font-style: italic;
    }
    
    /* Content styles */
    h1 { font-size: 20pt; color: #1976d2; margin: 20px 0 10px; }
    h2 { font-size: 16pt; color: #115293; margin: 18px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
    h3 { font-size: 14pt; color: #333; margin: 15px 0 6px; }
    h4 { font-size: 12pt; color: #555; margin: 12px 0 5px; }
    
    p {
      margin: 10px 0;
      text-align: justify;
    }
    
    ul, ol {
      margin: 10px 0 10px 30px;
    }
    
    li {
      margin: 5px 0;
    }
    
    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 10pt;
    }
    
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    
    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    
    /* Code blocks */
    pre, code {
      font-family: 'Courier New', monospace;
      font-size: 9pt;
      background: #f5f5f5;
      padding: 2px 4px;
      border-radius: 3px;
    }
    
    pre {
      padding: 10px;
      overflow-x: auto;
      margin: 10px 0;
    }
    
    /* Alerts and special blocks */
    .alert {
      padding: 10px;
      margin: 15px 0;
      border-left: 4px solid #1976d2;
      background: #f0f7ff;
    }
    
    /* Images and concept maps */
    img, svg {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 15px auto;
    }
    
    /* Page breaks */
    .page-break {
      page-break-before: always;
    }
    
    /* Missing content notice */
    .missing-content {
      padding: 20px;
      background: #fff3e0;
      border: 1px dashed #ff9800;
      color: #e65100;
      text-align: center;
      font-style: italic;
    }
    
    /* Footer for each page (when printed) */
    @media print {
      .chapter {
        position: relative;
      }
      
      @bottom-center {
        content: counter(page);
      }
    }
  </style>
</head>
<body>
  <div class="page-container">
    <!-- Cover Page -->
    <div class="cover-page">
      <h1 class="cover-title">${course.title}</h1>
      <p class="cover-subtitle">Complete Course Textbook</p>
      <p class="cover-meta">
        ${course.instructor ? `Instructor: ${course.instructor}<br>` : ''}
        Generated: ${new Date().toLocaleDateString()}<br>
        Total Modules: ${course.modules.length}
      </p>
    </div>
    
    <!-- Table of Contents -->
    <div class="toc">
      <h2>Table of Contents</h2>
      ${course.modules.map((m, i) => `
        <div class="toc-item">
          <strong>Chapter ${i + 1}:</strong> ${m.title}
          ${m.module ? `<span style="color: #666; font-size: 10pt;"> (${m.module})</span>` : ''}
        </div>
      `).join('')}
    </div>
    
    <!-- Chapters -->
    ${chapters}
  </div>
</body>
</html>`;
    
    // Create and download the file
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${courseId}-textbook-${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  if (!course) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Course Not Found
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            The course &quot;{courseId}&quot; doesn&apos;t exist.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            This might happen if:
          </Typography>
          <Box sx={{ textAlign: 'left', maxWidth: 400, mx: 'auto', mb: 3 }}>
            <Typography variant="body2" component="ul">
              <li>The course was deleted</li>
              <li>The URL was typed incorrectly</li>
              <li>You haven&apos;t added this course yet</li>
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            onClick={() => router.push('/')}
            startIcon={<HomeIcon />}
          >
            Go to Main Page
          </Button>
        </Paper>
      </Container>
    );
  }

  const info = {
    title: course.title,
    instructor: course.instructor || 'TBD',
    description: course.description || 'Course content will be generated based on your study materials.'
  };
  const progress = course.modules.length > 0 ? getProgress() : 0;
  
  // Group modules by topic/module
  const groupedModules: { [key: string]: Module[] } = {};
  course.modules.forEach(m => {
    const key = m.module || 'General Topics';
    if (!groupedModules[key]) groupedModules[key] = [];
    groupedModules[key].push(m);
  });

  return (
    <>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton edge="start" onClick={() => router.push('/')} color="inherit">
            <HomeIcon />
          </IconButton>
          <Breadcrumbs separator="›" sx={{ flexGrow: 1, color: 'white', ml: 2 }}>
            <Link color="inherit" href="/" sx={{ display: 'flex', alignItems: 'center' }}>
              <SchoolIcon sx={{ mr: 0.5 }} />
              NurseNotes-AI
            </Link>
            <Typography color="inherit">{info.title}</Typography>
          </Breadcrumbs>
          <Button 
            color="inherit" 
            startIcon={<TextbookIcon />}
            onClick={exportAsTextbook}
          >
            Export Textbook
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
          <Typography variant="h3" gutterBottom>
            {info.title}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Instructors: {info.instructor}
          </Typography>
          <Typography variant="body1" paragraph>
            {info.description}
          </Typography>
          
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ mr: 2 }}>
                Progress: {completedModules.size} of {course.modules.length} modules completed
              </Typography>
              <Typography variant="body2" color="primary">
                {Math.round(progress)}%
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
          </Box>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button variant="contained" startIcon={<QuizIcon />}>
              Practice Quiz
            </Button>
            <Button variant="outlined" startIcon={<DownloadIcon />}>
              Download All Notes
            </Button>
          </Box>
        </Paper>

        <Typography variant="h4" gutterBottom sx={{ mt: 4 }}>
          Course Modules
        </Typography>
        
        {course.modules.length === 0 ? (
          <Paper elevation={2} sx={{ p: 4, textAlign: 'center', mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              No Content Available Yet
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              This course doesn&apos;t have any generated notes yet.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              To add content to this course:
            </Typography>
            <Box sx={{ textAlign: 'left', maxWidth: 500, mx: 'auto', mb: 3 }}>
              <Typography variant="body2" component="ul">
                <li>Go back to the main page</li>
                <li>Select this course from the dropdown</li>
                <li>Enter your study topic and source materials</li>
                <li>Click &quot;Generate Notes&quot; to create content</li>
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              onClick={() => router.push('/')}
              startIcon={<HomeIcon />}
            >
              Go to Main Page
            </Button>
          </Paper>
        ) : Object.entries(groupedModules).map(([groupName, modules]) => (
          <Accordion 
            key={groupName}
            defaultExpanded
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">{groupName}</Typography>
              <Chip 
                label={`${modules.filter(m => completedModules.has(m.slug)).length}/${modules.length}`}
                size="small"
                color={modules.every(m => completedModules.has(m.slug)) ? "success" : "default"}
                sx={{ ml: 2 }}
              />
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {modules.map((module, index) => (
                  <React.Fragment key={module.slug}>
                    <ListItem disablePadding>
                      <ListItemButton
                        onClick={() => {
                          router.push(`/notes/${module.slug}`);
                          if (!completedModules.has(module.slug)) {
                            toggleModuleComplete(module.slug);
                          }
                        }}
                      >
                        <ListItemIcon>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleModuleComplete(module.slug);
                            }}
                          >
                            {completedModules.has(module.slug) ? (
                              <CheckIcon color="success" />
                            ) : (
                              <UncheckedIcon />
                            )}
                          </IconButton>
                        </ListItemIcon>
                        <ListItemText
                          primary={module.title}
                          secondary={
                            <Box>
                              <Typography variant="caption" component="span">
                                {module.date}
                              </Typography>
                              {completedModules.has(module.slug) && (
                                <Chip 
                                  label="Completed" 
                                  size="small" 
                                  color="success"
                                  sx={{ ml: 1, height: 20 }}
                                />
                              )}
                            </Box>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                    {index < modules.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}

        <Card sx={{ mt: 4, bgcolor: 'primary.light', color: 'white' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Study Tips
            </Typography>
            <Typography variant="body2">
              • Review modules in order for best understanding
              <br />
              • Mark modules as complete to track your progress
              <br />
              • Use the practice quiz after completing all modules
              <br />
              • Export as textbook for offline study or printing
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}