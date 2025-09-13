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

// Current system prompt (v2) - NCLEX-focused comprehensive notes
const CURRENT_SYSTEM_PROMPT = `You are NurseNotes-AI, an advanced NCLEX-focused study note generator for nursing students preparing for licensure exams.

## CRITICAL REQUIREMENTS FOR NCLEX-LEVEL CONTENT

### DEPTH AND DETAIL REQUIREMENTS
- Every section MUST contain specific, detailed, clinically relevant information
- NO generic statements or surface-level summaries
- Include specific numbers, values, timeframes, and measurements
- Provide NCLEX-level depth equivalent to nursing textbooks
- Each condition must be explained as if teaching someone who has never heard of it

### PATHOPHYSIOLOGY REQUIREMENTS
For EACH disease/condition, provide:
- Detailed cellular/tissue level changes
- Step-by-step disease progression
- Specific inflammatory mediators involved
- Exact anatomical structures affected
- Compensatory mechanisms
- Why specific symptoms occur based on the pathophysiology
- Age-specific variations in disease process

### CLINICAL MANIFESTATIONS REQUIREMENTS
For EACH condition, include:
- Early vs Late signs/symptoms with timeframes
- Specific vital sign ranges for each stage
- Physical assessment findings by body system
- Age-specific manifestations
- Classic presentation vs atypical presentations
- Red flag symptoms requiring immediate intervention
- Progression timeline if untreated

### DIAGNOSTIC REQUIREMENTS
Always include specific values:
- Normal ranges AND expected abnormal values
- Critical values requiring immediate action
- Gold standard tests with sensitivity/specificity if relevant
- Cost-effective screening vs confirmatory tests
- Age-specific normal values
- Interpretation guidelines

### MEDICATION REQUIREMENTS
For EACH medication mentioned:
- Generic and brand names
- Exact dosing (mg/kg for pediatrics)
- Route and frequency
- Mechanism of action
- Major side effects and their incidence
- Nursing considerations
- Contraindications
- Drug interactions
- Monitoring parameters

### NURSING INTERVENTIONS REQUIREMENTS
Must be specific and actionable:
- Priority order based on ABC's and Maslow's
- Exact monitoring frequencies (e.g., "VS q15min x 4, then q30min x 2, then q1h")
- Specific assessment parameters
- Evidence-based interventions with rationales
- Expected outcomes with timeframes
- Documentation requirements

## Your output should include these sections (adapt as needed):
- Overview with specific learning objectives
- Key Takeaways (5-7 critical points)
- Main Concepts with detailed explanations
- Pathophysiology (detailed for each condition)
- Clinical Manifestations (comprehensive signs/symptoms)
- Diagnostic Studies with normal/abnormal values
- Medications with complete drug information
- Nursing Interventions (priority-ordered)
- Complications and how to prevent/manage them
- Patient Education with teach-back points
- Concept Maps for EACH disease/condition
- Practice Questions (8-10 NCLEX-style with rationales)
- Case Study with complete patient data

## Special Instructions for Concept Maps
When covering disease processes or complex topics:
- CREATE A SEPARATE CONCEPT MAP FOR EACH INDIVIDUAL DISEASE/CONDITION
- Each concept map must be complete and specific to that single condition
- Include all required fields with 2-4 specific items each
- Show relationships between pathophysiology → signs/symptoms → interventions

## FINAL CRITICAL REMINDERS
- NEVER write generic, surface-level content
- EVERY statement must be specific and clinically relevant
- Include actual numbers, values, ranges, and timeframes
- Each section must be detailed enough to prepare for NCLEX-RN
- Disease processes MUST include detailed pathophysiology and multiple concept maps
- Case studies MUST include complete patient data, vitals, labs, and progression
- Think like you're writing a nursing textbook chapter, not a summary`;

// Store previous versions of prompts for backward compatibility
const PROMPT_VERSIONS: { [key: string]: string } = {
  'v1': `You are NurseNotes-AI, a study-note generator designed for pre-licensure nursing students. Your primary function is to transform various types of nursing source material—such as lecture transcripts, slide decks, journal articles, clinical guidelines, case studies, or mixed-format notes—into high-impact, exam-ready study notes. You strictly use only the source material provided, without incorporating external content or prior general knowledge not present in the document. You always begin by reading the source material in full before proceeding.

First, you draft a custom outline that reflects the logical structure and natural flow of the content. You then write the notes themselves, using that outline as a guide. Your formatting combines paragraph explanations with bulleted summaries—paragraphs take precedence for clarity, while bullets support concise idea capture.

Your output includes these adaptable sections:
- Title & Source Snapshot (include instructor(s) if provided. Insert current calendar date as prompt date)
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

You ensure quality by checking that the outline follows the original material's structure, all relevant NCLEX domains are covered, retrieval prompts and SBAR/SOAP appear where appropriate, and that notes are optimized for both desktop and mobile skimming. You do not add, infer, or supplement from external sources or general knowledge—only what is present in the original document is used.`,
  'v2': CURRENT_SYSTEM_PROMPT,
  'v3': CURRENT_SYSTEM_PROMPT // v3 is same as v2 but ensures latest comprehensive version
};

export async function POST(req: NextRequest) {
  try {
    const { slug, redeployMode, customPrompt } = await req.json();
    
    // Validate required fields
    if (!slug || !redeployMode) {
      return NextResponse.json(
        { error: 'Missing required fields: slug and redeployMode are required' },
        { status: 400 }
      );
    }

    // Validate redeploy mode
    if (!['previous', 'current', 'custom'].includes(redeployMode)) {
      return NextResponse.json(
        { error: 'Invalid redeployMode. Must be "previous", "current", or "custom"' },
        { status: 400 }
      );
    }

    // If custom mode, validate custom prompt
    if (redeployMode === 'custom' && !customPrompt) {
      return NextResponse.json(
        { error: 'Custom prompt is required when using custom redeploy mode' },
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

    // Note: In a real application, you would fetch this from a database
    // For now, we'll return an error indicating the need to pass the original data
    return NextResponse.json(
      { 
        error: 'Original input data must be provided for redeploy. This will be retrieved from the note storage in the frontend.',
        requiresOriginalInput: true 
      },
      { status: 400 }
    );
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Redeploy API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to redeploy notes',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

// This is the actual redeploy function that will be called with the original input
export async function redeployWithData(req: NextRequest) {
  try {
    const { 
      slug, 
      redeployMode, 
      customPrompt,
      originalInput 
    } = await req.json();
    
    // Validate original input
    if (!originalInput || !originalInput.title || !originalInput.course || !originalInput.source) {
      return NextResponse.json(
        { error: 'Original input data is missing or incomplete' },
        { status: 400 }
      );
    }

    // Determine which system prompt to use
    let systemPrompt: string;
    let promptVersion: string;
    
    switch (redeployMode) {
      case 'previous':
        // Use the same prompt version that was originally used
        promptVersion = originalInput.systemPromptVersion || 'v1';
        systemPrompt = PROMPT_VERSIONS[promptVersion] || PROMPT_VERSIONS['v1'];
        break;
      
      case 'current':
        // Use the current/latest system prompt
        promptVersion = 'v3';
        systemPrompt = CURRENT_SYSTEM_PROMPT;
        break;
      
      case 'custom':
        // Use the custom prompt provided
        promptVersion = 'custom';
        systemPrompt = customPrompt;
        break;
      
      default:
        throw new Error('Invalid redeploy mode');
    }

    // Add context to the system prompt
    const fullSystemPrompt = `${systemPrompt}

[Generator context]
Prompt Date: ${dayjs().format('MMMM D, YYYY')}
Course: ${originalInput.course}${originalInput.instructors ? `
Instructors: ${originalInput.instructors}` : ''}
Redeploy Mode: ${redeployMode}
Original Generation Date: ${originalInput.generatedAt || 'Unknown'}

=== END OF SYSTEM INSTRUCTIONS ===
Everything above this line is instructions for HOW to generate content.
Everything you generate below should be the ACTUAL CONTENT of the study notes, not instructions about how to write them.`;

    // Call OpenAI with the determined prompt
    const openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
    
    console.log(`Redeploying with ${redeployMode} mode...`);
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: fullSystemPrompt },
        { role: 'user', content: `Generate comprehensive study notes based on the following source material. Create the content sections requested above, but DO NOT include the formatting guidelines, instructions, or system prompts in the output. The output should contain ONLY the actual study note content.\n\nSOURCE MATERIAL:\n${originalInput.source}\n\n---\nNOW GENERATE THE STUDY NOTES (content only, no instructions):` }
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
  <title>${escapeHtml(originalInput.title)} — NurseNotes-AI (Redeployed)</title>
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
    .redeploy-badge {
      display: inline-block;
      background: #ff9800;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.875rem;
      margin-left: 8px;
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
      <strong>Course:</strong> ${escapeHtml(originalInput.course)} • 
      ${originalInput.instructors ? `<strong>Instructors:</strong> ${escapeHtml(originalInput.instructors)} • ` : ''} 
      <strong>Date:</strong> ${escapeHtml(dateStr)}
      <span class="redeploy-badge">Redeployed (${redeployMode})</span>
    </div>
    <h1>${escapeHtml(originalInput.title)}</h1>
  </div>
  <div class="content-wrapper">
    ${htmlBody}
  </div>
</body>
</html>`;

    // Generate new slug for the redeployed version
    const newSlug = `${dayjs().format('YYYY-MM-DD')}-${slugify(originalInput.title)}-redeployed`;

    // Return the redeployed content with all metadata
    return NextResponse.json({
      success: true,
      message: `Notes redeployed successfully using ${redeployMode} mode`,
      slug: newSlug,
      title: originalInput.title,
      course: originalInput.course,
      courseTitle: originalInput.courseName || getCourseTitle(originalInput.course),
      module: originalInput.module || '',
      date: dayjs().format('YYYY-MM-DD'),
      markdown: markdownContent,
      html: htmlContent,
      originalInput: {
        ...originalInput,
        systemPromptVersion: promptVersion,
        generatedAt: new Date().toISOString(),
        redeployedFrom: slug,
        redeployMode
      }
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Redeploy Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to redeploy notes',
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

// Handle the actual redeploy with data
export async function PUT(req: NextRequest) {
  return redeployWithData(req);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}