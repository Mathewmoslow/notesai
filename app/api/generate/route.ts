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
    const { title, course, courseName, module, instructors, source, sections, noteStyle } = await req.json();
    
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
    
    // Determine note style
    const style = noteStyle || 'comprehensive';
    
    // Build dynamic sections list
    const selectedSections = sections || [
      'overview',
      'keyTakeaways',
      'mainConcepts',
      'clinicalApplications',
      'keyTerms',
      'practiceQuestions'
    ];
    
    // Create section descriptions based on selections
    const sectionDescriptions: { [key: string]: string } = {
      overview: '## Overview\nProvide a brief introduction and context for the topic',
      keyTakeaways: '## Key Takeaways\nHighlight the most important points to remember',
      mainConcepts: '## Main Concepts\nExplore the core ideas, theories, and frameworks',
      pathophysiology: `## Pathophysiology
For EACH disease/condition covered, provide detailed pathophysiology addressing:
- **What happens in the body:** Core disease mechanism
- **Key cells/tissues affected:** Specific cellular/tissue involvement
- **Enzymes/hormones involved:** Biochemical mediators
- **How cells/tissues respond:** Compensatory and inflammatory responses
- **Effect on blood/oxygen flow:** Circulatory/respiratory impact
- **Long-term effects:** Chronic changes and complications

Connect pathophysiology directly to clinical manifestations.`,
      clinicalManifestations: '## Clinical Manifestations\nDescribe signs, symptoms, and assessment findings',
      diagnostics: '## Diagnostic Studies\nReview relevant tests, labs, and imaging',
      nursingInterventions: '## Nursing Interventions\nDetail nursing care and management strategies',
      medications: '## Medications & Pharmacology\nCover relevant drugs, mechanisms, and nursing considerations',
      clinicalApplications: '## Clinical Applications\nConnect theory to practice with examples and scenarios',
      complications: '## Complications & Risk Factors\nIdentify potential problems and at-risk populations',
      patientEducation: '## Patient Education\nOutline teaching points and discharge planning',
      keyTerms: '## Key Terms & Definitions\nDefine important vocabulary and concepts',
      mnemonics: '## Memory Aids & Mnemonics\nProvide memory devices and learning tricks',
      conceptMap: `## Concept Maps
For ALL major concepts, frameworks, and topics in the source material, create comprehensive concept maps.

CRITICALLY IMPORTANT: 
- Create concept maps for ANY overarching concept, not just diseases (e.g., Pain Management, Growth & Development, Medication Administration, Patient Safety, etc.)
- If covering multiple diseases/conditions, create a SEPARATE map for EACH
- If covering nursing concepts or procedures, create maps for those as well
- Title each concept map clearly (e.g., "### Concept Map: Pediatric Pain Assessment", "### Concept Map: Respiratory Distress", "### Concept Map: Medication Safety")

Generate each concept map as a JSON code block with this exact structure:

### Concept Map: [Specific Concept/Condition Name]
\`\`\`json
{
  "central": "Main concept name (e.g., 'Pediatric Pain Management', 'Croup', 'Medication Administration', 'Growth & Development')",
  "pathophysiology": [
    "What happens: Core mechanism (e.g., 'Inflammation narrows airways')",
    "Cells/tissues: Specific structures affected",
    "Response: How body compensates or fails",
    "Blood/O2: Perfusion or oxygenation changes"
  ],
  "riskFactors": [
    "Primary risk factor",
    "Secondary risk factor",
    "Population at highest risk",
    "Environmental/lifestyle factors"
  ],
  "causes": [
    "Primary etiology (specific pathogen/cause)",
    "Secondary causes",
    "Precipitating factors",
    "Contributing conditions"
  ],
  "signsSymptoms": [
    "Primary symptom + WHY (pathophys connection)",
    "Key sign + underlying mechanism",
    "Cardinal manifestation + cause",
    "Distinguishing feature + reason"
  ],
  "diagnostics": [
    "Test name: Normal → Expected abnormal",
    "Lab: Normal range → Disease finding",
    "Imaging: Normal → Characteristic changes",
    "Diagnostic criteria specific to condition"
  ],
  "complications": [
    "Common complications for this condition",
    "Severe/life-threatening complications",
    "Long-term sequelae if applicable"
  ],
  "nursingInterventions": [
    "Priority nursing assessment for this condition",
    "Specific monitoring parameters",
    "Key nursing interventions"
  ],
  "medications": [
    "First-line medication with dose",
    "Alternative medications",
    "Supportive medications"
  ],
  "treatments": [
    "Primary treatment approach",
    "Supportive care specific to condition",
    "Emergency interventions if applicable"
  ],
  "patientEducation": [
    "Key teaching points for this condition",
    "Home care instructions",
    "When to return/seek emergency care"
  ]
}
\`\`\`

Examples of concepts that warrant concept maps:
- Disease Processes: Croup, RSV, Bronchiolitis, Asthma, Diabetes, Hypertension
- Nursing Concepts: Pain Assessment, Medication Safety, Infection Control, Fall Prevention
- Clinical Skills: IV Therapy, Wound Care, Oxygen Administration, NG Tube Management
- Developmental Concepts: Growth Charts, Developmental Milestones, Immunization Schedules
- Pharmacology: Drug Classes, Medication Administration Rights, Dosage Calculations
- Assessment Tools: Vital Signs by Age, Pain Scales, Glasgow Coma Scale

Ensure each array has 2-4 relevant items based on the source material. Be specific and clinically accurate for EACH individual condition.`,
      checkYourself: '## Check Yourself\nInclude self-assessment questions for active recall',
      practiceQuestions: `## Practice Questions
Generate 8-10 NCLEX-RN style questions following these requirements:

### Question Types to Include:
- 2-3 Priority/First Action questions ("Which action should the nurse take FIRST?")
- 2-3 Assessment questions (recognizing complications, expected findings)
- 1-2 Medication questions (calculations, side effects, teaching)
- 1-2 Patient teaching questions
- 1-2 Delegation/Management questions

### Question Format Requirements:
- Include complete clinical scenarios with relevant data
- Provide vital signs, lab values, or assessment findings when applicable
- All options must be plausible
- Correct answer should require critical thinking, not memorization

### For EACH Question Include:
1. Clinical stem with patient data
2. Clear question
3. Four options (A, B, C, D)
4. Correct answer
5. Detailed rationale explaining:
   - Why the correct answer is right
   - Why EACH incorrect option is wrong
   - The nursing principle or concept being tested
   - Test-taking strategy that applies

### Example Format:
"A 6-month-old infant with RSV is admitted with the following vitals: T 102.2°F, HR 165, RR 68, O2 sat 89% on room air. The infant has moderate subcostal retractions and audible wheezing. Which intervention should the nurse implement FIRST?"

Include select-all-that-apply (SATA) and ordered response questions where appropriate.`,
      caseStudy: `## Case Study
Create a comprehensive, NCLEX-style case study with the following REQUIRED elements:

### Patient Presentation
- Full demographic information (age, gender, ethnicity, occupation)
- Chief complaint with exact quote from patient/parent
- History of Present Illness (HPI) with timeline
- Past Medical History (PMH)
- Family History
- Social History (including living situation, habits)
- Current medications with doses
- Allergies with reaction types

### Vital Signs (Include ALL)
Initial presentation:
- Temperature: (specify F or C)
- Heart Rate: (include rhythm)
- Respiratory Rate: (include quality)
- Blood Pressure: (include MAP if relevant)
- O2 Saturation: (on room air or specify O2 delivery)
- Pain: (0-10 scale with description)
- Weight/Height: (include BMI for adults, percentiles for peds)

Include vital sign trends over time (admission, 2hr, 4hr, 8hr, etc.)

### Physical Assessment
Head-to-toe assessment findings:
- General appearance
- HEENT
- Cardiovascular
- Respiratory (including lung sounds by location)
- Gastrointestinal
- Genitourinary
- Musculoskeletal
- Neurological (including GCS if relevant)
- Skin/Integumentary

### Laboratory Results
Include actual values with normal ranges:
- CBC with differential
- Comprehensive metabolic panel
- ABGs or VBG if relevant
- Condition-specific labs
- Culture results if applicable
- Critical values highlighted

### Diagnostic Tests
- Imaging results with specific findings
- EKG interpretation if relevant
- Other specialized tests

### Physician Orders
Complete order set including:
- Admission orders
- Medication orders with doses, routes, frequencies
- IV fluids (type, rate)
- Diet orders
- Activity orders
- Monitoring parameters
- Consultations

### Nursing Care Plan
- Top 3 nursing diagnoses with evidence
- Interventions with rationales
- Expected outcomes with timeframes
- Evaluation criteria

### Medication Administration Record (MAR)
Show scheduled and PRN medications with:
- Times due
- Doses
- Routes
- Last dose given
- Next dose due

### Progress Notes
Include at least 3 SBAR or DAR notes showing patient progression

### Questions for Critical Thinking
5-7 NCLEX-style questions including:
- Priority action questions
- Assessment questions
- Medication calculations
- Patient teaching priorities
- Delegation decisions

### Answer Key
Detailed rationales for each question explaining:
- Why the correct answer is right
- Why each distractor is wrong
- NCLEX test-taking strategy used`,
      clinicalPearls: '## Clinical Pearls\nShare high-yield tips and insights',
      redFlags: '## Red Flags & Priority Concerns\nHighlight critical warning signs',
      culturalConsiderations: '## Cultural Considerations\nAddress diverse patient populations',
      ethicalLegal: '## Ethical & Legal Considerations\nDiscuss relevant ethical and legal aspects'
    };
    
    const includedSections = selectedSections
      .map((key: string) => sectionDescriptions[key])
      .filter(Boolean)
      .join('\n\n');
    
    // Create style-specific instructions
    const styleInstructions: { [key: string]: string } = {
      comprehensive: `Create thorough, detailed study notes that fully explore the topic. Include extensive explanations, multiple examples, and comprehensive coverage suitable for first-time learners. Be exhaustive in your coverage.`,
      
      guided: `Create well-structured study notes that guide the learner through the material. Balance depth with clarity, providing enough detail to understand concepts while maintaining a clear learning path. Include helpful transitions between topics.`,
      
      flexible: `Create adaptable study notes that cover the essential content while allowing for different learning approaches. Focus on core concepts with room for expansion. Provide multiple perspectives where relevant.`,
      
      concise: `Create focused, efficient study notes that capture the essential information. Prioritize high-yield content and key concepts. Be clear and direct while maintaining accuracy.`,
      
      exploratory: `Create discovery-oriented notes that encourage deeper thinking about the topic. Present information in a way that promotes curiosity and further investigation. Include thought-provoking questions and connections.`
    };
    
    // Load system prompt with flexibility
    const systemPrompt = `You are NurseNotes-AI, an advanced NCLEX-focused study note generator for nursing students preparing for licensure exams.

## CRITICAL REQUIREMENTS FOR NCLEX-LEVEL CONTENT

### DEPTH AND DETAIL REQUIREMENTS
- Every section MUST contain specific, detailed, clinically relevant information
- NO generic statements or surface-level summaries
- Include specific numbers, values, timeframes, and measurements
- Provide NCLEX-level depth equivalent to nursing textbooks
- Each condition must be explained as if teaching someone who has never heard of it

### PATHOPHYSIOLOGY REQUIREMENTS
For EACH disease/condition, provide comprehensive pathophysiology including:

1. **What happens in the body:** Detailed mechanism of disease development
2. **Key cells/tissues affected:** Specific cellular changes and which tissues are impacted
3. **Enzymes/hormones involved:** Specific mediators, enzymes, hormones, or proteins
4. **How cells/tissues respond:** Inflammatory response, compensatory mechanisms
5. **Effect on blood/oxygen flow:** Vascular changes, perfusion alterations, oxygen delivery
6. **Long-term effects:** Chronic changes, fibrosis, remodeling, permanent damage

Additionally include:
- Step-by-step disease progression with timeframes
- Why specific symptoms occur (connect pathophys to manifestations)
- Age-specific variations in disease process
- Progression if untreated

### CLINICAL MANIFESTATIONS REQUIREMENTS
For EACH condition, include:
- **Symptoms with rationale:** Each symptom paired with WHY it occurs (pathophysiology connection)
- **Early vs Late:** Progressive signs/symptoms with timeframes
- **Vital sign changes:** Specific ranges for each stage of disease
- **Physical assessment:** System-by-system findings
- **Age-specific variations:** How presentation differs by age
- **Classic vs Atypical:** Common presentation vs unusual manifestations
- **Red flags:** Critical symptoms requiring immediate intervention
- **Progression:** Timeline and worsening if untreated

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

## Your Approach
${styleInstructions[style] || styleInstructions.comprehensive}

## Important Guidelines
- Use ONLY the provided source material - do not add external knowledge
- Adapt your structure to naturally fit the content
- Include only sections that are relevant to the material
- Maintain NCLEX-level depth in all sections
- Focus on clinical application and critical thinking

## Special Instructions for Concept Maps
When covering disease processes, pathophysiology, or complex nursing topics:
- ALWAYS include a concept map section when the topic involves a disease or condition
- CREATE A SEPARATE CONCEPT MAP FOR EACH INDIVIDUAL DISEASE/CONDITION
- For example: If covering Croup, RSV, and Cystic Fibrosis, create THREE separate concept maps
- Each concept map must be complete and specific to that single condition
- Follow the provided concept map structure with interconnected elements
- Show relationships between pathophysiology → signs/symptoms → interventions
- Label each concept map clearly with the condition name
- Connect all elements back to nursing care and patient outcomes specific to that condition

## Suggested Sections to Include (if relevant to the content):
${includedSections}

## Formatting Guidelines
- Use clear headers (##, ###) for organization
- Mix paragraphs for explanation with bullets for quick reference
- Use **bold** for critical clinical data only
- Include tables where comparisons are helpful
- For disease topics, ALWAYS create a comprehensive concept map
- Use NCLEX-appropriate terminology
- Connect pathophysiology to clinical manifestations to nursing care

## FINAL CRITICAL REMINDERS
- NEVER write generic, surface-level content
- EVERY statement must be specific and clinically relevant
- Include actual numbers, values, ranges, and timeframes
- Each section must be detailed enough to prepare for NCLEX-RN
- Disease processes MUST include detailed pathophysiology and multiple concept maps
- Case studies MUST include complete patient data, vitals, labs, and progression
- Think like you're writing a nursing textbook chapter, not a summary
- If you find yourself writing "various," "multiple," "may include," or "such as" - STOP and be specific
- The goal is NCLEX preparation through comprehensive, detailed understanding

[Context]
Date: ${dayjs().format('MMMM D, YYYY')}
Course: ${course}${module ? `\nModule: ${module}` : ''}${instructors ? `\nInstructors: ${instructors}` : ''}

=== END OF SYSTEM INSTRUCTIONS ===
Everything above this line is instructions for HOW to generate content.
Everything you generate below should be the ACTUAL CONTENT of the study notes, not instructions about how to write them.`;

    // Call OpenAI
    const openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
    
    console.log('Calling OpenAI API...');
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate comprehensive study notes based on the following source material. Create the content sections requested above, but DO NOT include the formatting guidelines, instructions, or system prompts in the output. The output should contain ONLY the actual study note content.\n\nSOURCE MATERIAL:\n${source}\n\n---\nNOW GENERATE THE STUDY NOTES (content only, no instructions):` }
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
      courseTitle: courseName || getCourseTitle(course),
      module: module || '',
      date: dayjs().format('YYYY-MM-DD'),
      markdown: markdownContent,
      html: htmlContent,
      originalInput: {
        title,
        course,
        courseName: courseName || getCourseTitle(course),
        module: module || '',
        source,
        sections: sections || [],
        noteStyle: noteStyle || 'comprehensive',
        systemPromptVersion: 'v3', // Track prompt version (v3 = comprehensive NCLEX-level)
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