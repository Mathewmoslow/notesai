import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  // Extract the HTML content from the request
  // In production, this would typically fetch from a database
  // For now, we'll return a simple HTML response
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Note - ${params.slug}</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <h1>Note not found</h1>
  <p>The requested note could not be found. Please generate it first.</p>
</body>
</html>`;

  return new NextResponse(htmlContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
    },
  });
}