'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  AppBar,
  Toolbar,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  Tabs,
  Tab,
} from '@mui/material';
import {
  School as SchoolIcon,
  MenuBook as TextbookIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  NavigateNext as NextIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';

interface Module {
  slug: string;
  title: string;
  date: string;
  path: string;
  module?: string;
}

interface Course {
  id: string;
  title: string;
  modules: Module[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SemesterOverview() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [allProgress, setAllProgress] = useState<{ [key: string]: Set<string> }>({});
  const [semesterStats, setSemesterStats] = useState({
    totalModules: 0,
    completedModules: 0,
    totalCourses: 0,
    studyHours: 0,
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    try {
      const manifest = JSON.parse(localStorage.getItem('courses-manifest') || '{"courses":[]}');
      setCourses(manifest.courses);
      
      // Load progress for all courses
      const progress: { [key: string]: Set<string> } = {};
      let totalCompleted = 0;
      let totalModules = 0;
      
      manifest.courses.forEach((course: Course) => {
        const saved = localStorage.getItem(`course-progress-${course.id}`);
        if (saved) {
          const completed = new Set<string>(JSON.parse(saved));
          progress[course.id] = completed;
          totalCompleted += completed.size;
        } else {
          progress[course.id] = new Set<string>();
        }
        totalModules += course.modules.length;
      });
      
      setAllProgress(progress);
      setSemesterStats({
        totalModules,
        completedModules: totalCompleted,
        totalCourses: manifest.courses.length,
        studyHours: Math.round(totalCompleted * 1.5), // Estimate 1.5 hours per module
      });
    } catch (error) {
      console.error('Failed to load semester data:', error);
    }
  };

  const getCourseProgress = (courseId: string, moduleCount: number) => {
    const completed = allProgress[courseId]?.size || 0;
    return (completed / moduleCount) * 100;
  };

  const exportSemesterTextbook = async () => {
    if (courses.length === 0) {
      alert('No courses available to export');
      return;
    }
    // Create comprehensive semester textbook
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Nursing Semester - Complete Digital Textbook</title>
  <style>
    body { 
      font-family: 'Georgia', serif; 
      line-height: 1.8; 
      max-width: 900px; 
      margin: 0 auto; 
      padding: 40px;
      color: #333;
    }
    .cover-page {
      text-align: center;
      page-break-after: always;
      padding: 100px 0;
    }
    .cover-page h1 {
      font-size: 3em;
      color: #1976d2;
      margin-bottom: 30px;
    }
    .toc {
      page-break-after: always;
    }
    .course-section {
      page-break-before: always;
    }
    .course-title {
      color: #1976d2;
      font-size: 2.5em;
      border-bottom: 3px solid #1976d2;
      padding-bottom: 10px;
    }
    .module-section {
      margin: 40px 0;
    }
    @media print {
      body { margin: 0; padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="cover-page">
    <h1>Nursing Program</h1>
    <h2>Complete Digital Textbook</h2>
    <p>Semester Compilation</p>
    <p>${new Date().getFullYear()}</p>
  </div>
  
  <div class="toc">
    <h1>Table of Contents</h1>
    ${courses.map((course, i) => `
      <div class="course-toc">
        <h2>Part ${i + 1}: ${course.title}</h2>
        <ul>
          ${course.modules.map((m, j) => `
            <li>Chapter ${i + 1}.${j + 1}: ${m.title}</li>
          `).join('')}
        </ul>
      </div>
    `).join('')}
  </div>
  
  ${courses.map((course, i) => `
    <div class="course-section">
      <h1 class="course-title">Part ${i + 1}: ${course.title}</h1>
      ${course.modules.map((m, j) => `
        <div class="module-section">
          <h2>Chapter ${i + 1}.${j + 1}: ${m.title}</h2>
          <iframe src="${m.path}" style="width:100%; min-height:1000px; border:none;"></iframe>
        </div>
      `).join('')}
    </div>
  `).join('')}
  
  <div class="appendix" style="page-break-before: always;">
    <h1>Study Statistics</h1>
    <p>Total Modules Completed: ${semesterStats.completedModules}</p>
    <p>Total Study Hours: ${semesterStats.studyHours}</p>
    <p>Completion Rate: ${Math.round((semesterStats.completedModules / semesterStats.totalModules) * 100)}%</p>
  </div>
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nursing-semester-complete-textbook.html';
    a.click();
  };

  const overallProgress = semesterStats.totalModules > 0 
    ? (semesterStats.completedModules / semesterStats.totalModules) * 100 
    : 0;

  return (
    <>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <SchoolIcon sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            NurseNotes-AI - Semester Overview
          </Typography>
          <Button 
            color="inherit" 
            startIcon={<TextbookIcon />}
            onClick={exportSemesterTextbook}
          >
            Export Complete Textbook
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
          <Typography variant="h3" gutterBottom>
            Semester Learning Module
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Your complete digital nursing textbook, built from all your course notes throughout the semester.
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
            <Card sx={{ flex: '1 1 200px' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <SchoolIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">{semesterStats.totalCourses}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Total Courses
                </Typography>
              </CardContent>
            </Card>
            
            <Card sx={{ flex: '1 1 200px' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TextbookIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">{semesterStats.totalModules}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Total Modules
                </Typography>
              </CardContent>
            </Card>
            
            <Card sx={{ flex: '1 1 200px' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6">{semesterStats.completedModules}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
              </CardContent>
            </Card>
            
            <Card sx={{ flex: '1 1 200px' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ScheduleIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">{semesterStats.studyHours}h</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Study Hours
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" gutterBottom>
              Overall Progress: {Math.round(overallProgress)}%
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={overallProgress} 
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>
        </Paper>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab icon={<TimelineIcon />} label="Learning Path" />
            <Tab icon={<AssessmentIcon />} label="Progress View" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h5" gutterBottom>
            Structured Learning Path
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Follow this recommended sequence for optimal learning outcomes.
          </Typography>
          
          {courses.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center', bgcolor: 'background.paper' }}>
              <Typography variant="h6" gutterBottom>
                No Courses Added Yet
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Start building your semester by adding courses and generating notes.
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => router.push('/')}
                sx={{ mt: 2 }}
              >
                Go to Main Page
              </Button>
            </Card>
          ) : courses.map((course, index) => (
            <Card key={course.id} sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Chip 
                    label={`Course ${index + 1}`} 
                    color="primary" 
                    sx={{ mr: 2 }}
                  />
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    {course.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {allProgress[course.id]?.size || 0}/{course.modules.length} modules
                  </Typography>
                </Box>
                
                <LinearProgress 
                  variant="determinate" 
                  value={getCourseProgress(course.id, course.modules.length)}
                  sx={{ mb: 2, height: 6, borderRadius: 3 }}
                />
                
                <List dense>
                  {course.modules.slice(0, 3).map(module => (
                    <ListItem key={module.slug}>
                      <ListItemText 
                        primary={module.title}
                        secondary={module.date}
                      />
                    </ListItem>
                  ))}
                  {course.modules.length > 3 && (
                    <ListItem>
                      <ListItemText 
                        secondary={`+ ${course.modules.length - 3} more modules`}
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  endIcon={<NextIcon />}
                  onClick={() => router.push(`/courses/${course.id}`)}
                >
                  Continue Learning
                </Button>
              </CardActions>
            </Card>
          ))}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h5" gutterBottom>
            Detailed Progress
          </Typography>
          
          {courses.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center', bgcolor: 'background.paper' }}>
              <Typography variant="h6" gutterBottom>
                No Progress to Show
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Add courses and generate notes to track your learning progress.
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => router.push('/')}
                sx={{ mt: 2 }}
              >
                Get Started
              </Button>
            </Card>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {courses.map(course => {
              const progress = getCourseProgress(course.id, course.modules.length);
              return (
                <Card key={course.id} sx={{ flex: '1 1 300px' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {course.title}
                    </Typography>
                    <Box sx={{ position: 'relative', display: 'inline-flex', width: '100%' }}>
                      <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{ width: '100%', height: 30, borderRadius: 15 }}
                      />
                      <Box
                        sx={{
                          top: 0,
                          left: 0,
                          bottom: 0,
                          right: 0,
                          position: 'absolute',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography variant="caption" component="div" color="text.secondary">
                          {`${Math.round(progress)}%`}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {allProgress[course.id]?.size || 0} of {course.modules.length} modules completed
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => router.push(`/courses/${course.id}`)}>
                      View Course
                    </Button>
                  </CardActions>
                </Card>
              );
            })}
          </Box>
          )}
        </TabPanel>
      </Container>
    </>
  );
}