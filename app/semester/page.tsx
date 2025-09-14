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

  // Function to render concept map as SVG HTML (simplified version)
  const renderConceptMapAsSVG = (data: {
    central?: string;
    pathophysiology?: string[];
    riskFactors?: string[];
    causes?: string[];
    signsSymptoms?: string[];
    diagnostics?: string[];
    medications?: string[];
    nursingInterventions?: string[];
    complications?: string[];
    treatments?: string[];
    patientEducation?: string[];
  }) => {
    if (!data || !data.central) return '';
    
    return `
      <svg width="100%" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid meet" style="width: 100%; max-width: 100%; display: block; margin: 15px auto; background: white; border: 1px solid #ddd; border-radius: 8px;">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#666" />
          </marker>
        </defs>
        <g transform="translate(600, 400)">
          <polygon points="0,-40 12,-12 40,-8 20,8 24,36 0,20 -24,36 -20,8 -40,-8 -12,-12" fill="#FFD700" stroke="#FFA500" stroke-width="2"/>
          <text x="0" y="0" text-anchor="middle" font-size="12" font-weight="bold">${data.central}</text>
        </g>
        <g transform="translate(600, 120)">
          <ellipse cx="0" cy="0" rx="180" ry="55" fill="#E8F5E9" stroke="#4CAF50" stroke-width="2"/>
          <text x="0" y="-35" text-anchor="middle" font-size="14" font-weight="bold" fill="#2E7D32">PATHOPHYSIOLOGY</text>
        </g>
        <g transform="translate(150, 250)">
          <ellipse cx="0" cy="0" rx="85" ry="45" fill="#FFF3E0" stroke="#FF9800" stroke-width="2"/>
          <text x="0" y="-25" text-anchor="middle" font-size="13" font-weight="bold" fill="#E65100">RISK FACTORS</text>
        </g>
        <g transform="translate(600, 560)">
          <ellipse cx="0" cy="0" rx="130" ry="45" fill="#FCE4EC" stroke="#E91E63" stroke-width="2"/>
          <text x="0" y="-25" text-anchor="middle" font-size="12" font-weight="bold" fill="#880E4F">MEDICATIONS</text>
        </g>
        <line x1="600" y1="175" x2="600" y2="360" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)"/>
      </svg>
    `;
  };
  
  const exportSemesterTextbook = async () => {
    if (courses.length === 0) {
      alert('No courses available to export');
      return;
    }
    
    // Get all notes from localStorage
    const storedNotes = JSON.parse(localStorage.getItem('generated-notes') || '{}');
    
    // Build all course content
    let totalModules = 0;
    let totalWithContent = 0;
    
    const courseSections = courses.map((course, courseIndex) => {
      const courseModules = course.modules.map((module, moduleIndex) => {
        totalModules++;
        const noteData = storedNotes[module.slug];
        
        if (!noteData || !noteData.html) {
          return `
            <div class="chapter">
              <h2 class="chapter-title">Chapter ${courseIndex + 1}.${moduleIndex + 1}: ${module.title}</h2>
              <p class="missing-content">Content not available. Please regenerate this note.</p>
            </div>
          `;
        }
        
        totalWithContent++;
        // Extract content from stored HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(noteData.html, 'text/html');
        
        // Try multiple selectors to find the content
        let content = '';
        const contentWrapper = doc.querySelector('.content-wrapper');
        const mainContent = doc.querySelector('main');
        const bodyContent = doc.body;
        
        if (contentWrapper) {
          content = contentWrapper.innerHTML;
        } else if (mainContent) {
          content = mainContent.innerHTML;
        } else if (bodyContent) {
          content = bodyContent.innerHTML;
        } else {
          content = noteData.html;
        }
        
        // Clean up the content - remove any nested HTML structure
        content = content.replace(/<\/?html[^>]*>/gi, '');
        content = content.replace(/<\/?head[^>]*>/gi, '');
        content = content.replace(/<\/?body[^>]*>/gi, '');
        content = content.replace(/<meta[^>]*>/gi, '');
        content = content.replace(/<title[^>]*>.*?<\/title>/gi, '');
        content = content.replace(/<link[^>]*>/gi, '');
        content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
        content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        
        // Remove all internal links to prevent "Not allowed to load local resource" errors
        content = content.replace(/<a\s+[^>]*href=['"]\/notes\/[^'"]*['"][^>]*>(.*?)<\/a>/gi, '$1');
        
        // Process concept maps - replace JSON with SVG
        const conceptMapRegex = /<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/g;
        content = content.replace(conceptMapRegex, (match: string, codeContent: string) => {
          try {
            const decodedContent = codeContent
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/&amp;/g, '&');
            
            // Check if it's a concept map JSON (has central and any of the common branches)
            if (decodedContent.includes('"central"') && 
                (decodedContent.includes('"branches"') || 
                 decodedContent.includes('"pathophysiology"') ||
                 decodedContent.includes('"complications"') ||
                 decodedContent.includes('"riskFactors"') ||
                 decodedContent.includes('"causes"') ||
                 decodedContent.includes('"signsSymptoms"') ||
                 decodedContent.includes('"diagnostics"') ||
                 decodedContent.includes('"medications"') ||
                 decodedContent.includes('"nursingInterventions"') ||
                 decodedContent.includes('"treatments"') ||
                 decodedContent.includes('"patientEducation"'))) {
              const jsonMatch = decodedContent.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const mapData = JSON.parse(jsonMatch[0]);
                return renderConceptMapAsSVG(mapData);
              }
            }
          } catch {
            // Not a concept map
          }
          return match;
        });
        
        return `
          <div class="chapter">
            <h2 class="chapter-title">Chapter ${courseIndex + 1}.${moduleIndex + 1}: ${module.title}</h2>
            <div class="chapter-meta">${module.module ? `Module: ${module.module} | ` : ''}Date: ${module.date}</div>
            ${content}
          </div>
        `;
      }).join('');
      
      return `
        <div class="course-section">
          <h1 class="course-title">Part ${courseIndex + 1}: ${course.title}</h1>
          ${courseModules}
        </div>
      `;
    }).join('');
    
    // Alert if missing content
    if (totalWithContent < totalModules) {
      const proceed = confirm(`${totalModules - totalWithContent} of ${totalModules} modules are missing content. Do you want to continue with the export?`);
      if (!proceed) return;
    }
    
    // Create comprehensive semester textbook with embedded content
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete Nursing Semester - Digital Textbook</title>
  <style>
    /* Reset and base */
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
    
    /* Screen viewing */
    @media screen {
      body {
        background: #e0e0e0;
      }
      .page-container {
        width: 8.5in;
        margin: 20px auto;
        padding: 1in;
        background: white;
        box-shadow: 0 0 15px rgba(0,0,0,0.1);
      }
    }
    
    /* Print styles */
    @media print {
      .page-container {
        width: 100%;
        margin: 0;
        padding: 0;
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
      font-size: 42pt;
      font-weight: bold;
      color: #1976d2;
      margin-bottom: 30px;
    }
    
    .cover-subtitle {
      font-size: 24pt;
      color: #555;
      margin-bottom: 20px;
    }
    
    .cover-meta {
      font-size: 14pt;
      color: #666;
      line-height: 2;
    }
    
    /* Table of contents */
    .toc {
      page-break-after: always;
    }
    
    .toc h1 {
      font-size: 28pt;
      color: #1976d2;
      margin-bottom: 30px;
      border-bottom: 3px solid #1976d2;
      padding-bottom: 10px;
    }
    
    .course-toc {
      margin: 25px 0;
    }
    
    .course-toc h2 {
      font-size: 18pt;
      color: #115293;
      margin-bottom: 10px;
    }
    
    .course-toc ul {
      list-style: none;
      padding-left: 20px;
    }
    
    .course-toc li {
      font-size: 11pt;
      margin: 5px 0;
      padding-left: 20px;
      position: relative;
    }
    
    .course-toc li:before {
      content: "→";
      position: absolute;
      left: 0;
      color: #1976d2;
    }
    
    /* Course sections */
    .course-section {
      page-break-before: always;
    }
    
    .course-title {
      font-size: 28pt;
      color: #1976d2;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 3px solid #1976d2;
      page-break-after: avoid;
    }
    
    /* Chapters */
    .chapter {
      margin-bottom: 30px;
    }
    
    .chapter-title {
      font-size: 20pt;
      color: #115293;
      margin: 20px 0 10px;
      padding-bottom: 8px;
      border-bottom: 2px solid #ddd;
      page-break-after: avoid;
    }
    
    .chapter-meta {
      font-size: 10pt;
      color: #666;
      font-style: italic;
      margin-bottom: 20px;
    }
    
    /* Content styles */
    h1 { font-size: 18pt; color: #1976d2; margin: 18px 0 8px; page-break-after: avoid; }
    h2 { font-size: 14pt; color: #115293; margin: 16px 0 6px; border-bottom: 1px solid #ddd; padding-bottom: 4px; page-break-after: avoid; }
    h3 { font-size: 12pt; color: #333; margin: 14px 0 5px; page-break-after: avoid; }
    h4 { font-size: 11pt; color: #555; margin: 12px 0 4px; page-break-after: avoid; }
    
    p {
      margin: 10px 0;
      text-align: justify;
      orphans: 3;
      widows: 3;
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
      page-break-inside: avoid;
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
      page-break-inside: avoid;
    }
    
    /* Missing content notice */
    .missing-content {
      padding: 30px;
      background: #fff3e0;
      border: 2px dashed #ff9800;
      color: #e65100;
      text-align: center;
      font-style: italic;
      font-size: 12pt;
      margin: 20px 0;
    }
    
    /* Appendix */
    .appendix {
      page-break-before: always;
      margin-top: 40px;
    }
    
    .appendix h1 {
      font-size: 24pt;
      color: #1976d2;
      margin-bottom: 20px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 20px 0;
    }
    
    .stat-box {
      padding: 15px;
      background: #f5f5f5;
      border-left: 4px solid #1976d2;
    }
    
    .stat-label {
      font-weight: bold;
      color: #555;
      margin-bottom: 5px;
    }
    
    .stat-value {
      font-size: 18pt;
      color: #1976d2;
    }
    
    /* Images and SVGs */
    img, svg {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 15px auto;
      page-break-inside: avoid;
    }
    
    /* Avoid breaking inside important elements */
    .alert, blockquote {
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="page-container">
    <!-- Cover Page -->
    <div class="cover-page">
      <h1 class="cover-title">Nursing Program</h1>
      <p class="cover-subtitle">Complete Semester Textbook</p>
      <div class="cover-meta">
        <p>All Courses & Modules</p>
        <p>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p>Total Courses: ${courses.length}</p>
        <p>Total Modules: ${totalModules}</p>
        <p>Content Available: ${totalWithContent} of ${totalModules}</p>
      </div>
    </div>
    
    <!-- Table of Contents -->
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
    
    <!-- Course Content -->
    ${courseSections}
    
    <!-- Appendix with Statistics -->
    <div class="appendix">
      <h1>Study Progress Statistics</h1>
      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-label">Modules Completed</div>
          <div class="stat-value">${semesterStats.completedModules}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Total Study Hours</div>
          <div class="stat-value">${semesterStats.studyHours}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Completion Rate</div>
          <div class="stat-value">${Math.round((semesterStats.completedModules / semesterStats.totalModules) * 100)}%</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Total Modules</div>
          <div class="stat-value">${semesterStats.totalModules}</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `semester-textbook-${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
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