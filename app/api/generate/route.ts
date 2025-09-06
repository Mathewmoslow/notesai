import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { marked } from 'marked';
import dayjs from 'dayjs';
import fs from 'fs-extra';
import path from 'path';

interface CourseInstructor {
  [key: string]: string;
}

const courseInstructors: CourseInstructor = {
  NURS310: 'G. Hagerstrom; S. Dumas',
  NURS320: 'G. Hagerstrom; S. Dumas',
  NURS335: 'A. Hernandez; G. Rivera',
  NURS330: 'S. Abdo; M. Douglas',
  NURS315: 'A. Layson'
};

function slugify(s: string): string {
  return s.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(req: NextRequest) {
  try {
    const { title, course, module, source } = await req.json();
    
    // Validate required fields
    if (!title || !course || !source) {
      return NextResponse.json(
        { error: 'Missing required fields: title, course, and source are required' },
        { status: 400 }
      );
    }

    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not found in environment variables');
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to environment variables.' },
        { status: 500 }
      );
    }
    
    // Load system prompt
    const systemPrompt = `You are NurseNotes-AI, a study-note generator designed for pre-licensure nursing students. Your primary function is to transform various types of nursing source material—such as lecture transcripts, slide decks, journal articles, clinical guidelines, case studies, or mixed-format notes—into high-impact, exam-ready study notes. You strictly use only the source material provided, without incorporating external content or prior general knowledge not present in the document. You always begin by reading the source material in full before proceeding.

First, you draft a custom outline that reflects the logical structure and natural flow of the content. You then write the notes themselves, using that outline as a guide. Your formatting combines paragraph explanations with bulleted summaries—paragraphs take precedence for clarity, while bullets support concise idea capture.

Your output includes these adaptable sections:
- Title & Source Snapshot (include instructor(s) by topic: Adult Health – Professors G. Hagerstrom and S. Dumas; NCLEX Immersion – Professors A. Hernandez and G. Rivera; Childbearing Family/OBGYN – Professors S. Abdo and M. Douglas; Gerontology – Professor A. Layson. Insert current calendar date as prompt date)
- Key Takeaways
- Main Concepts / Frameworks
- Applications & Mini-Cases (using SBAR/SOAP or NGN snippets)
- Clinical Manifestations (formerly Critical Lens)
- Key Terms & Drug Stems
- Check-Yourself Prompts (retrieval-style)
- Concept Map or Graphic Organizer (written layout)
- Practice Take-Home

STOP: PROVIDE THE NOTES AS THEY ARE IN ONE SECTION. CONSIDER THIS SECTION IN ITS ENTIRETY AND SUGGEST IMPROVEMENTS, mainly in layout and depth, and present to the user. If deputed, redo notes and then continue to quality assurance. If not accepted, continue to quality assurance. Add a **case study** at the end once iterative process is completed and quality assurance is checked.

Notes are styled with a clear hierarchy using H2 and H3 headers, brief bullets (≤2 lines), paragraphs (≤3 sentences), and bolding limited to high-yield clinical data. You use tables sparingly for comparisons. You use NCLEX-level terminology and embed brief rationales for nursing interventions, pharmacologic actions, or test logic. You label key vitals, labs, and isolation details as "NCLEX Cram Sheet Snips."

Each "Check-Yourself" item is formatted to support flashcard-style retrieval, and you embed micro-concept-maps or visual notes when needed. Your tone is academic yet conversational, with no filler language or clichés.

You ensure quality by checking that the outline follows the original material's structure, all relevant NCLEX domains are covered, retrieval prompts and SBAR/SOAP appear where appropriate, and that notes are optimized for both desktop and mobile skimming. You do not add, infer, or supplement from external sources or general knowledge—only what is present in the original document is used.

[Generator context]
Prompt Date: ${dayjs().format('MMMM D, YYYY')}
Course: ${course}
Instructors: ${courseInstructors[course] || ''}`;

    // Call OpenAI
    const openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
    
    console.log('Calling OpenAI API...');
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Use ONLY the following source material. Produce the notes as described.\n\nSOURCE:\n${source}` }
      ],
      temperature: 0.2,
    });

    const markdownContent = response.choices[0]?.message?.content || '';
    
    if (!markdownContent.trim()) {
      return NextResponse.json(
        { error: 'Failed to generate notes - empty response from AI' },
        { status: 500 }
      );
    }

    // Generate HTML from markdown
    const htmlBody = await marked.parse(markdownContent, { 
      mangle: false, 
      headerIds: true 
    });
    
    // Create HTML document
    const dateStr = dayjs().format('MMMM D, YYYY');
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} — NurseNotes-AI</title>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
  <style>
    :root{ 
      --primary: #1976d2; 
      --primary-dark: #115293;
      --text-primary: #212121;
      --text-secondary: #757575;
      --background: #fafafa;
      --surface: #ffffff;
      --border: #e0e0e0;
    }
    body { 
      font-family: 'Roboto', sans-serif;
      line-height: 1.6;
      margin: 0;
      background: var(--background);
      color: var(--text-primary);
    }
    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      background: var(--surface);
      border-bottom: 2px solid var(--primary);
    }
    .content-wrapper {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 2rem;
      background: var(--surface);
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    }
    h1 { color: var(--primary); }
    h2 { color: var(--primary); border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
    h3 { color: var(--primary-dark); }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { border: 1px solid var(--border); padding: 0.75rem; text-align: left; }
    th { background: var(--primary); color: white; }
    @media print { 
      body { margin: 0; }
      .header-content, .content-wrapper { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="header-content">
    <div style="color: var(--text-secondary); margin-bottom: 0.5rem;">
      <strong>Course:</strong> ${escapeHtml(course)} • 
      <strong>Instructors:</strong> ${escapeHtml(courseInstructors[course] || '')} • 
      <strong>Date:</strong> ${escapeHtml(dateStr)}
    </div>
    <h1>${escapeHtml(title)}</h1>
    <p style="color: var(--text-secondary);">Generated by NurseNotes-AI from provided source material only.</p>
  </div>
  <div class="content-wrapper">
    ${htmlBody}
  </div>
</body>
</html>`;

    // Generate slug for file naming
    const slug = `${dayjs().format('YYYY-MM-DD')}-${slugify(title)}`;
    
    // Save files if in development (won't persist in Vercel)
    if (process.env.NODE_ENV === 'development') {
      try {
        // Save markdown
        const mdPath = path.join(process.cwd(), 'content', 'raw', `${slug}.md`);
        await fs.ensureDir(path.dirname(mdPath));
        await fs.writeFile(mdPath, markdownContent, 'utf8');
        
        // Save HTML
        const htmlPath = path.join(process.cwd(), 'public', 'notes', `${slug}.html`);
        await fs.ensureDir(path.dirname(htmlPath));
        await fs.writeFile(htmlPath, htmlContent, 'utf8');
        
        // Update manifest
        const manifestPath = path.join(process.cwd(), 'content', 'manifest.json');
        let manifest = { courses: [] };
        
        if (await fs.pathExists(manifestPath)) {
          manifest = await fs.readJson(manifestPath);
        }
        
        let courseEntry = manifest.courses.find((c: any) => c.id === course);
        if (!courseEntry) {
          courseEntry = { 
            id: course, 
            title: getCourseTitle(course), 
            modules: [] 
          };
          manifest.courses.push(courseEntry);
        }
        
        // Add new module
        courseEntry.modules = [{
          slug,
          title,
          date: dayjs().format('YYYY-MM-DD'),
          path: `/notes/${slug}.html`,
          module: module || ''
        }, ...courseEntry.modules.filter((m: any) => m.slug !== slug)];
        
        await fs.writeJson(manifestPath, manifest, { spaces: 2 });
      } catch (error) {
        console.error('Failed to save files locally:', error);
      }
    }

    // Return the generated content
    return NextResponse.json({
      success: true,
      message: 'Notes generated successfully',
      slug,
      notePath: `/api/notes/${slug}`,
      markdown: markdownContent,
      html: htmlContent
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('API Error:', error);
    
    // Check for specific OpenAI errors
    if (errorMessage.includes('API key')) {
      return NextResponse.json(
        { 
          error: 'OpenAI API key is missing or invalid. Please check your environment variables.',
          details: errorMessage
        },
        { status: 500 }
      );
    }
    
    if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
      return NextResponse.json(
        { 
          error: 'OpenAI API quota exceeded. Please check your OpenAI account.',
          details: errorMessage
        },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to generate notes',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

function getCourseTitle(id: string): string {
  const titles: { [key: string]: string } = {
    NURS310: 'Adult Health I',
    NURS320: 'Adult Health II',
    NURS335: 'NCLEX Immersion I',
    NURS330: 'Childbearing Family / OBGYN',
    NURS315: 'Gerontological Nursing'
  };
  return titles[id] || id;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}