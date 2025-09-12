'use client';

import React, { useEffect, useState } from 'react';
import { Container, Paper, Typography, Box, Alert, Button } from '@mui/material';

interface Course {
  id: string;
  name: string;
  instructor?: string;
  description?: string;
}

interface Module {
  slug: string;
  title: string;
  date: string;
  path: string;
  module?: string;
}

interface CourseEntry {
  id: string;
  title: string;
  modules: Module[];
}

interface Manifest {
  courses: CourseEntry[];
}

interface NoteData {
  title: string;
  course: string;
  courseTitle?: string;
  module?: string;
  date: string;
  [key: string]: unknown;
}

export default function DebugPage() {
  const [userCourses, setUserCourses] = useState<Course[]>([]);
  const [manifest, setManifest] = useState<Manifest>({ courses: [] });
  const [generatedNotes, setGeneratedNotes] = useState<Record<string, NoteData>>({});

  useEffect(() => {
    // Load all localStorage data
    const courses = JSON.parse(localStorage.getItem('user-courses') || '[]');
    const manifestData = JSON.parse(localStorage.getItem('courses-manifest') || '{"courses":[]}');
    const notes = JSON.parse(localStorage.getItem('generated-notes') || '{}');
    
    setUserCourses(courses);
    setManifest(manifestData);
    setGeneratedNotes(notes);
  }, []);

  const fixManifest = () => {
    // Fix any issues with the manifest
    const courses = JSON.parse(localStorage.getItem('user-courses') || '[]');
    const notes = JSON.parse(localStorage.getItem('generated-notes') || '{}');
    const manifest = JSON.parse(localStorage.getItem('courses-manifest') || '{"courses":[]}');
    
    // Ensure all notes are properly in the manifest
    Object.entries(notes).forEach(([slug, noteData]) => {
      const note = noteData as NoteData;
      let courseEntry = manifest.courses.find((c: CourseEntry) => c.id === note.course);
      
      if (!courseEntry) {
        // Find the course name from user-courses
        const userCourse = courses.find((c: Course) => c.id === note.course);
        courseEntry = {
          id: note.course,
          title: note.courseTitle || userCourse?.name || note.course,
          modules: []
        };
        manifest.courses.push(courseEntry);
      }
      
      // Check if module exists
      const moduleExists = courseEntry.modules.some((m: Module) => m.slug === slug);
      if (!moduleExists) {
        courseEntry.modules.push({
          slug: slug,
          title: note.title,
          date: note.date,
          path: `/notes/${slug}`,
          module: note.module || ''
        });
      }
    });
    
    localStorage.setItem('courses-manifest', JSON.stringify(manifest));
    window.location.reload();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h3" gutterBottom>Debug Page</Typography>
      
      <Button variant="contained" onClick={fixManifest} sx={{ mb: 3 }}>
        Fix Manifest Issues
      </Button>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>User Courses</Typography>
        <pre style={{ overflow: 'auto', background: '#f5f5f5', padding: '10px' }}>
          {JSON.stringify(userCourses, null, 2)}
        </pre>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>Courses Manifest</Typography>
        <pre style={{ overflow: 'auto', background: '#f5f5f5', padding: '10px' }}>
          {JSON.stringify(manifest, null, 2)}
        </pre>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>Generated Notes Summary</Typography>
        <Box>
          {Object.entries(generatedNotes).map(([slug, noteData]) => (
            <Alert key={slug} severity="info" sx={{ mb: 1 }}>
              <strong>{noteData.title}</strong> - Course: {noteData.course} ({noteData.courseTitle})
            </Alert>
          ))}
        </Box>
      </Paper>
    </Container>
  );
}