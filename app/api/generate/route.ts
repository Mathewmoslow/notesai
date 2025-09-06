import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const execFileAsync = promisify(execFile);

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
    
    // Create temp input file
    const inputDir = path.join(process.cwd(), 'temp');
    await mkdir(inputDir, { recursive: true });
    const inputFile = path.join(inputDir, `source-${Date.now()}.txt`);
    await writeFile(inputFile, source);
    
    // Build command args
    const args = [
      'tools/nursenotes-cli.mjs',
      '--source', inputFile,
      '--course', course,
      '--title', title
    ];
    
    if (module) {
      args.push('--module', module);
    }
    
    // Execute the CLI tool
    console.log('Executing CLI with args:', args);
    const { stdout, stderr } = await execFileAsync('node', args, {
      env: {
        ...process.env,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
        OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini'
      },
      cwd: process.cwd()
    });
    
    // Clean up temp file
    try {
      const fs = await import('fs/promises');
      await fs.unlink(inputFile);
    } catch (e) {
      console.error('Failed to clean up temp file:', e);
    }
    
    // Extract slug from output for returning the generated note path
    const slugMatch = stdout.match(/Slug: (.+)/);
    const slug = slugMatch ? slugMatch[1].trim() : '';
    
    return NextResponse.json({
      success: true,
      message: 'Notes generated successfully',
      output: stdout,
      slug,
      notePath: slug ? `/notes/${slug}.html` : '',
      stderr: stderr || undefined
    });
    
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate notes',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}