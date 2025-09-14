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
    
    // Create a combined HTML document with all modules
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>${course.title} - Complete Textbook</title>
  <style>
    body { font-family: 'Times New Roman', serif; line-height: 1.8; max-width: 800px; margin: 0 auto; padding: 40px; }
    h1 { color: #1976d2; page-break-before: always; }
    h2 { color: #115293; margin-top: 30px; }
    h3 { color: #333; }
    .module { page-break-before: always; margin-bottom: 60px; }
    .toc { page-break-after: always; }
    .toc-item { margin: 10px 0; }
    @media print { 
      body { margin: 0; padding: 20px; }
      .module { page-break-before: always; }
    }
  </style>
</head>
<body>
  <div class="toc">
    <h1>${course.title}</h1>
    <h2>Table of Contents</h2>
    ${course.modules.map((m, i) => `
      <div class="toc-item">${i + 1}. ${m.title}</div>
    `).join('')}
  </div>
  
  ${course.modules.map((m, i) => `
    <div class="module">
      <h1>Chapter ${i + 1}: ${m.title}</h1>
      <iframe src="${m.path}" style="width:100%; min-height:800px; border:none;"></iframe>
    </div>
  `).join('')}
</body>
</html>`;
    
    // Download as HTML file
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${courseId}-complete-textbook.html`;
    a.click();
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