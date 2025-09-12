'use client';

import React from 'react';
import ConceptMap from './ConceptMap';
import { Box } from '@mui/material';

interface NoteRendererProps {
  content: string;
}

const NoteRenderer: React.FC<NoteRendererProps> = ({ content }) => {
  // Function to extract and parse concept map JSON from HTML content
  const extractConceptMap = (html: string) => {
    // First try to find JSON in code blocks within the HTML
    const codeBlockRegex = /<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/g;
    let match;
    
    while ((match = codeBlockRegex.exec(html)) !== null) {
      const codeContent = match[1];
      // Decode HTML entities
      const decodedContent = codeContent
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&');
      
      // Check if this looks like our concept map JSON
      if (decodedContent.includes('"central"') && 
          decodedContent.includes('"pathophysiology"') &&
          decodedContent.includes('"nursingInterventions"')) {
        try {
          // Try to extract just the JSON part
          const jsonMatch = decodedContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.error('Failed to parse concept map JSON:', e);
        }
      }
    }
    
    // Also try to find in the raw HTML if it's embedded differently
    const jsonRegex = /\{[^{}]*"central"[^{}]*"pathophysiology"[\s\S]*?"patientEducation"[^{}]*\}/;
    const jsonMatch = html.match(jsonRegex);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('Failed to parse embedded JSON:', e);
      }
    }
    
    return null;
  };

  // Function to render content with concept map
  const renderContent = () => {
    const conceptMapData = extractConceptMap(content);
    
    if (!conceptMapData) {
      // If no concept map found, return content as-is
      return <div dangerouslySetInnerHTML={{ __html: content }} />;
    }

    // Remove the JSON code block from the HTML and insert our visual map
    const modifiedContent = content;
    
    // Find and replace the concept map section in HTML
    const h2Regex = /<h2[^>]*>Concept Map<\/h2>[\s\S]*?<pre><code[^>]*>[\s\S]*?<\/code><\/pre>/;
    if (h2Regex.test(modifiedContent)) {
      const parts = modifiedContent.split(h2Regex);
      
      return (
        <>
          {/* Render content before concept map */}
          {parts[0] && <div dangerouslySetInnerHTML={{ __html: parts[0] }} />}
          
          {/* Render visual concept map */}
          <Box sx={{ my: 4 }}>
            <h2>Concept Map</h2>
            <ConceptMap data={conceptMapData} />
          </Box>
          
          {/* Render content after concept map */}
          {parts[1] && <div dangerouslySetInnerHTML={{ __html: parts[1] }} />}
        </>
      );
    }
    
    // Fallback: just append the concept map at the end
    return (
      <>
        <div dangerouslySetInnerHTML={{ __html: content }} />
        <Box sx={{ my: 4 }}>
          <h2>Visual Concept Map</h2>
          <ConceptMap data={conceptMapData} />
        </Box>
      </>
    );
  };

  return <>{renderContent()}</>;
};

export default NoteRenderer;