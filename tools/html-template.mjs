export function makeHtml({ title, course, instructors, date, markdownHtml }) {
  return `<!DOCTYPE html>
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
      --secondary: #dc004e;
      --text-primary: #212121;
      --text-secondary: #757575;
      --background: #fafafa;
      --surface: #ffffff;
      --border: #e0e0e0;
      --success: #4caf50;
      --info: #2196f3;
      --warning: #ff9800;
      --error: #f44336;
    }
    
    * { box-sizing: border-box; }
    
    html, body { 
      margin: 0; 
      padding: 0;
      background: var(--background); 
      color: var(--text-primary); 
      font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    header { 
      background: var(--surface);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 1.5rem 0;
      margin-bottom: 2rem;
    }
    
    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
    }
    
    .meta { 
      color: var(--text-secondary); 
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }
    
    h1 { 
      font-size: 2.5rem; 
      font-weight: 400;
      margin: 0.5rem 0;
      color: var(--primary);
      letter-spacing: -0.01562em;
    }
    
    main { 
      max-width: 1200px; 
      margin: 0 auto 4rem; 
      padding: 0 2rem;
      background: var(--surface);
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
    }
    
    .content-wrapper {
      padding: 2rem;
    }
    
    h2 { 
      font-size: 2rem; 
      font-weight: 400;
      margin: 2rem 0 1rem; 
      color: var(--primary);
      border-bottom: 2px solid var(--primary);
      padding-bottom: 0.5rem;
    }
    
    h3 { 
      font-size: 1.5rem; 
      font-weight: 500;
      margin: 1.5rem 0 0.75rem; 
      color: var(--primary-dark);
    }
    
    h4 {
      font-size: 1.25rem;
      font-weight: 500;
      margin: 1.25rem 0 0.5rem;
      color: var(--text-primary);
    }
    
    p { 
      margin: 1rem 0; 
      line-height: 1.8;
    }
    
    ul, ol { 
      margin: 1rem 0 1rem 1.5rem;
      line-height: 1.8;
    }
    
    li {
      margin: 0.5rem 0;
    }
    
    strong { 
      font-weight: 500; 
      color: var(--primary-dark);
    }
    
    .callout { 
      background: #e3f2fd; 
      border-left: 4px solid var(--info);
      padding: 1rem 1.5rem;
      margin: 1.5rem 0;
      border-radius: 4px;
    }
    
    .warning {
      background: #fff3e0;
      border-left-color: var(--warning);
    }
    
    .success {
      background: #e8f5e9;
      border-left-color: var(--success);
    }
    
    .error {
      background: #ffebee;
      border-left-color: var(--error);
    }
    
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 1.5rem 0;
      background: var(--surface);
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
      border-radius: 4px;
      overflow: hidden;
    }
    
    th, td { 
      padding: 1rem;
      text-align: left; 
      vertical-align: top;
    }
    
    th { 
      background: var(--primary);
      color: white;
      font-weight: 500;
      text-transform: uppercase;
      font-size: 0.875rem;
      letter-spacing: 0.05em;
    }
    
    tr {
      border-bottom: 1px solid var(--border);
    }
    
    tr:last-child {
      border-bottom: none;
    }
    
    tr:hover {
      background: rgba(0,0,0,0.02);
    }
    
    .concept { 
      font-family: 'Roboto Mono', 'Courier New', monospace;
      white-space: pre-wrap; 
      background: #f5f5f5;
      border: 1px solid var(--border);
      padding: 1.5rem;
      border-radius: 4px;
      margin: 1.5rem 0;
      overflow-x: auto;
    }
    
    code {
      background: #f5f5f5;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-family: 'Roboto Mono', monospace;
      font-size: 0.875rem;
    }
    
    blockquote {
      border-left: 4px solid var(--primary);
      margin: 1.5rem 0;
      padding-left: 1.5rem;
      color: var(--text-secondary);
      font-style: italic;
    }
    
    a {
      color: var(--primary);
      text-decoration: none;
      transition: color 0.3s ease;
    }
    
    a:hover {
      color: var(--primary-dark);
      text-decoration: underline;
    }
    
    .chip {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: var(--primary);
      color: white;
      border-radius: 16px;
      font-size: 0.875rem;
      margin: 0.25rem;
    }
    
    footer { 
      max-width: 1200px; 
      margin: 2rem auto;
      padding: 2rem;
      color: var(--text-secondary);
      font-size: 0.875rem;
      text-align: center;
      border-top: 1px solid var(--border);
    }
    
    .nav-button {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background: var(--primary);
      color: white;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      transition: background 0.3s ease;
      margin: 0.5rem;
    }
    
    .nav-button:hover {
      background: var(--primary-dark);
      text-decoration: none;
    }
    
    /* Print styles */
    @media print {
      header, footer { 
        border: none; 
      }
      
      .nav-button {
        display: none;
      }
      
      a { 
        color: black; 
        text-decoration: none; 
      }
      
      body { 
        margin: 0;
        background: white;
      }
      
      main { 
        padding: 0;
        box-shadow: none;
      }
      
      h1, h2, h3 {
        color: black;
      }
      
      th {
        background: #f5f5f5;
        color: black;
      }
    }
    
    /* Responsive design */
    @media (max-width: 768px) {
      h1 {
        font-size: 2rem;
      }
      
      h2 {
        font-size: 1.5rem;
      }
      
      h3 {
        font-size: 1.25rem;
      }
      
      .header-content,
      main {
        padding: 0 1rem;
      }
      
      .content-wrapper {
        padding: 1rem;
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="header-content">
      <div class="meta">
        <strong>Course:</strong> ${escapeHtml(course)} • 
        <strong>Instructors:</strong> ${escapeHtml(instructors)} • 
        <strong>Date:</strong> ${escapeHtml(date)}
      </div>
      <h1>${escapeHtml(title)}</h1>
      <p class="meta">Generated by NurseNotes-AI from provided source material only.</p>
    </div>
  </header>
  
  <main>
    <div class="content-wrapper">
      ${markdownHtml}
    </div>
  </main>
  
  <footer>
    <a href="/" class="nav-button">Back to Index</a>
    <p>NurseNotes-AI © ${new Date().getFullYear()} • Powered by OpenAI</p>
  </footer>
</body>
</html>`;
}

function escapeHtml(s){
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}