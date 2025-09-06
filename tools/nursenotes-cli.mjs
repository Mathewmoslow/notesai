#!/usr/bin/env node
import fs from 'fs-extra';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import dayjs from 'dayjs';
import { marked } from 'marked';
import OpenAI from 'openai';
import { makeHtml } from './html-template.mjs';
import { slugify, run, updateManifest } from './utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// ---- CLI args ----
const args = parseArgs(process.argv.slice(2));
if (!args.source) die('Missing --source <file.txt|md>');
if (!args.course) die('Missing --course (e.g., NURS310)');
if (!args.title) die('Missing --title');
const moduleName = args.module || '';

// ---- Read source ----
const srcPath = path.resolve(args.source);
if (!(await fs.pathExists(srcPath))) die(`Source not found: ${srcPath}`);
const sourceText = await fs.readFile(srcPath, 'utf8');

// ---- System prompt ----
const sysPath = path.join(root, 'prompts', 'nursenotes_system.txt');
const systemBase = await fs.readFile(sysPath, 'utf8');

// inject date + instructor mapping
const dateStr = dayjs().format('MMMM D, YYYY');
const courseInstructors = mapCourseToInstructors(args.course);
const system = `${systemBase}\n\n[Generator context]\nPrompt Date: ${dateStr}\nCourse: ${args.course}\nInstructors: ${courseInstructors}`;

// ---- OpenAI call ----
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const messages = [
  { role: 'system', content: system },
  { role: 'user', content: `Use ONLY the following source material. Produce the notes as described.\n\nSOURCE:\n${sourceText}` }
];

console.log('Generating notes with OpenAI...');
const resp = await openai.chat.completions.create({
  model,
  messages,
  temperature: 0.2,
});

const md = resp?.choices?.[0]?.message?.content || '';
if (!md.trim()) die('LLM returned empty content');

// ---- Write Markdown ----
const slug = `${dayjs().format('YYYY-MM-DD')}-${slugify(args.title)}`;
const mdOut = path.join(root, 'content', 'raw', `${slug}.md`);
await fs.ensureDir(path.dirname(mdOut));
await fs.writeFile(mdOut, md, 'utf8');

// ---- Convert to HTML ----
const htmlBody = marked.parse(md, { mangle: false, headerIds: true });
const html = makeHtml({
  title: args.title,
  course: args.course,
  instructors: courseInstructors,
  date: dateStr,
  markdownHtml: htmlBody
});

const htmlOut = path.join(root, 'public', 'notes', `${slug}.html`);
await fs.ensureDir(path.dirname(htmlOut));
await fs.writeFile(htmlOut, html, 'utf8');

// ---- Update manifest for nav ----
const manifestPath = path.join(root, 'content', 'manifest.json');
await updateManifest(manifestPath, {
  course: args.course,
  module: moduleName,
  title: args.title,
  date: dayjs().format('YYYY-MM-DD'),
  slug,
  path: `/notes/${slug}.html`
});

// ---- Commit & push (optional via --commit) ----
if (args.commit) {
  await run('git', ['add', '.'], { cwd: root });
  await run('git', ['commit', '-m', `Add NurseNotes: ${args.title}`], { cwd: root });
  await run('git', ['push', process.env.GIT_REMOTE || 'origin', process.env.GIT_BRANCH || 'main'], { cwd: root });
}

console.log(`\n✅ Generated:\n- ${path.relative(root, mdOut)}\n- ${path.relative(root, htmlOut)}\nUpdated nav: content/manifest.json\nSlug: ${slug}\n`);

// ---- helpers ----
function parseArgs(argv){
  const out = {}; 
  let k = null;
  for (const a of argv){
    if (a.startsWith('--')){ 
      k = a.replace(/^--/, ''); 
      out[k] = true; 
    }
    else if (k){ 
      out[k] = a; 
      k = null; 
    }
  }
  return out;
}

function die(msg){ 
  console.error('Error:', msg); 
  process.exit(1); 
}

function mapCourseToInstructors(course){
  const m = {
    NURS310: 'G. Hagerstrom; S. Dumas',
    NURS320: 'G. Hagerstrom; S. Dumas',
    NURS335: 'A. Hernandez; G. Rivera',
    NURS330: 'S. Abdo; M. Douglas',
    NURS315: 'A. Layson'
  };
  return m[course] || '';
}