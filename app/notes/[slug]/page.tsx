'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Paper, Typography, Button, Box } from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';

export default function NotePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [noteHtml, setNoteHtml] = useState<string>('');
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load note from localStorage
    const storedNotes = JSON.parse(localStorage.getItem('generated-notes') || '{}');
    const note = storedNotes[slug];
    
    if (note) {
      setNoteHtml(note.html);
      setNoteTitle(note.title);
    } else {
      setNoteHtml(`
        <div style="padding: 40px; text-align: center;">
          <h1>Note Not Found</h1>
          <p>The requested note could not be found. Please generate it first.</p>
        </div>
      `);
      setNoteTitle('Note Not Found');
    }
    setLoading(false);
  }, [slug]);

  if (loading) {
    return (
      <Container>
        <Typography>Loading note...</Typography>
      </Container>
    );
  }

  return (
    <>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => router.back()}
        >
          Back
        </Button>
      </Box>
      <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
        <Paper elevation={0} sx={{ p: 0 }}>
          <div dangerouslySetInnerHTML={{ __html: noteHtml }} />
        </Paper>
      </Container>
    </>
  );
}