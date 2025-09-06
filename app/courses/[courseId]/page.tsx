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
}

const courseInfo: { [key: string]: { title: string; instructor: string; description: string } } = {
  NURS310: {
    title: 'Adult Health I',
    instructor: 'G. Hagerstrom; S. Dumas',
    description: 'Comprehensive study of adult health nursing concepts, pathophysiology, and clinical applications.'
  },
  NURS320: {
    title: 'Adult Health II',
    instructor: 'G. Hagerstrom; S. Dumas',
    description: 'Advanced adult health nursing with focus on complex conditions and critical care.'
  },
  NURS335: {
    title: 'NCLEX Immersion I',
    instructor: 'A. Hernandez; G. Rivera',
    description: 'Intensive NCLEX preparation covering test-taking strategies and comprehensive content review.'
  },
  NURS330: {
    title: 'Childbearing Family/OBGYN',
    instructor: 'S. Abdo; M. Douglas',
    description: 'Maternal-child nursing, obstetrics, gynecology, and family-centered care.'
  },
  NURS315: {
    title: 'Gerontological Nursing',
    instructor: 'A. Layson',
    description: 'Specialized care for older adults, aging processes, and geriatric syndromes.'
  },
};

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());

  const loadCourseData = () => {
    try {
      const manifest = JSON.parse(localStorage.getItem('courses-manifest') || '{"courses":[]}');
      const courseData = manifest.courses.find((c: Course) => c.id === courseId);
      if (courseData) {
        setCourse(courseData);
      } else {
        // If no data, create empty course structure
        setCourse({
          id: courseId,
          title: courseInfo[courseId]?.title || courseId,
          modules: []
        });
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
    if (!course) return;
    
    // Create a combined HTML document with all modules
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>${courseInfo[courseId].title} - Complete Textbook</title>
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
    <h1>${courseInfo[courseId].title}</h1>
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
      <Container>
        <Typography>Loading course...</Typography>
      </Container>
    );
  }

  const info = courseInfo[courseId];
  const progress = getProgress();
  
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
        
        {Object.entries(groupedModules).map(([groupName, modules]) => (
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