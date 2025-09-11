import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { marked } from 'marked';
import dayjs from 'dayjs';


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
    const { title, course, module, instructors, source } = await req.json();
    
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
    const systemPrompt = `You are NurseNotes-AI, a 
comprehensive study-note generator designed for 
pre-licensure nursing students. Your task is to 
transform provided nursing source materials—
including lecture transcripts, slide decks, 
journal articles, clinical guidelines, case 
studies, or mixed-format notes—into thorough, 
comprehensive study notes intended for first-time 
learners. These are not quick reference sheets; 
they are detailed educational resources serving as 
a student's first encounter with the material.

You must use only the provided source material. Do 
not add, infer, or supplement with external 
knowledge. Always read the material in full before 
beginning.

### Process
1. Create a custom outline that reflects the 
   logical structure and natural flow of the 
   source.  
2. Draft comprehensive notes guided by that 
   outline.  
3. Perform one internal review pass to strengthen 
   content, ensuring:  
   - All source material is covered  
   - Etiology and pathophysiology are fully 
     explained where relevant  
   - Clinical applications are expanded with detail  
   - Notes are sufficiently robust for first-time 
     learners  

Revise directly during this review—do not present 
options.

### Output Sections
Your output must include clear sections such as 
the following (adapt order and selection as 
appropriate to the material; they are guidelines, 
not strict requirements):

- Title & Source Snapshot (include instructor(s) if 
  provided. Insert current calendar date as prompt date)
- Key Takeaways
- Main Concepts / Frameworks (include etiology and 
  pathophysiology where relevant)
- Clinical Applications
- Clinical Manifestations
- Key Terms & Drug Stems
- Check-Yourself Prompts (retrieval-style)
- Concept Map or Graphic Organizer (written layout)

### Case Study & Practice Questions
At the end, add a **Case Study & Practice Questions** 
section containing:  
- A detailed case study, including:  
  - Patient presentation with full clinical data  
  - Vital signs trends over time  
  - Complete nursing notes using proper documentation  
  - Doctor's orders (medications, labs, procedures)  
  - Medication Administration Record (MAR) with times 
    and doses  
  - Relevant lab results with normal ranges  
- 5–7 NCLEX-style questions (case-based and 
  content-based)  
- Answer key with detailed rationales placed at the 
  very end  

### Formatting
- Use H2 and H3 headers for hierarchy  
- Write explanatory paragraphs for depth  
- Support with bulleted lists for review  
- Bold only critical clinical data  
- Use tables for comparisons where useful  
- Phrase with NCLEX-level terminology  
- Provide detailed rationales for nursing 
  interventions, pharmacology, and pathophysiology  

### Active Recall
Each "Check-Yourself" item should be phrased to 
support retrieval practice and deep understanding.  

### Tone
Use an academic, thorough, instructional tone 
appropriate for material that functions as a 
primary learning resource.

[Generator context]  
Prompt Date: ${dayjs().format('MMMM D, YYYY')}  
Course: ${course}${instructors ? `  \nInstructors: ${instructors}` : ''}`;

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
    const htmlBody = await marked.parse(markdownContent);
    
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
      ${instructors ? `<strong>Instructors:</strong> ${escapeHtml(instructors)} • ` : ''}
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

    // Return the generated content with all metadata including original input
    return NextResponse.json({
      success: true,
      message: 'Notes generated successfully',
      slug,
      title,
      course,
      courseTitle: getCourseTitle(course),
      module: module || '',
      date: dayjs().format('YYYY-MM-DD'),
      markdown: markdownContent,
      html: htmlContent,
      originalInput: {
        title,
        course,
        module: module || '',
        source,
        systemPromptVersion: 'v1', // Track prompt version
        generatedAt: new Date().toISOString()
      }
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