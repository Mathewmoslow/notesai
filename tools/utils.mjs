import { execFile } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

export function slugify(s){
  return String(s).toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export async function run(cmd, args, opts){
  return new Promise((resolve, reject) => {
    execFile(cmd, args, opts, (err, stdout, stderr) => {
      if (err) return reject(err);
      if (stderr) process.stderr.write(stderr);
      resolve(stdout);
    });
  });
}

export async function updateManifest(manifestPath, entry){
  let data = { courses: [] };
  
  if (await fs.pathExists(manifestPath)) {
    data = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  }
  
  const courseId = entry.course;
  let course = data.courses.find(c => c.id === courseId);
  
  if (!course){
    course = { 
      id: courseId, 
      title: courseTitle(courseId), 
      modules: [] 
    };
    data.courses.push(course);
  }
  
  // Add new module and filter out any with same slug
  course.modules = [{
    slug: entry.slug,
    title: entry.title,
    date: entry.date,
    path: entry.path,
    module: entry.module || ''
  }, ...course.modules.filter(m => m.slug !== entry.slug)];
  
  // Sort modules by date (newest first)
  course.modules.sort((a, b) => b.date.localeCompare(a.date));
  
  await fs.ensureDir(path.dirname(manifestPath));
  await fs.writeFile(manifestPath, JSON.stringify(data, null, 2), 'utf8');
}

function courseTitle(id){
  const m = {
    NURS310: 'Adult Health I',
    NURS320: 'Adult Health II',
    NURS335: 'NCLEX Immersion I',
    NURS330: 'Childbearing Family / OBGYN',
    NURS315: 'Gerontological Nursing'
  };
  return m[id] || id;
}