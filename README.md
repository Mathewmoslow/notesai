# NurseNotes-AI

Transform nursing course materials into comprehensive, exam-ready study notes using AI.

## Features

- 📚 **AI-Powered Note Generation**: Uses OpenAI to transform lecture transcripts, slides, and notes into structured study materials
- 🎨 **Material-UI Interface**: Clean, modern interface built with Material-UI components
- 📝 **Multiple Input Methods**: Upload files, paste content, or type directly
- 🗂️ **Organized by Course**: Supports multiple nursing courses with instructor mappings
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🖨️ **Print-Friendly**: Generated notes are optimized for printing
- 🔄 **GitHub Actions Integration**: Generate notes directly from GitHub
- ⚡ **Vercel Deployment**: Automatic deployment with every push

## Quick Start

### Prerequisites

- Node.js 20+
- OpenAI API Key
- GitHub account (for deployment)
- Vercel account (for hosting)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Mathewmoslow/notesai.git
cd notesai
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```bash
cp .env.example .env.local
```

4. Add your OpenAI API key to `.env.local`:
```
OPENAI_API_KEY=your-api-key-here
OPENAI_MODEL=gpt-4o-mini
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Usage

### Web Interface

1. Navigate to the application
2. Enter a title for your notes
3. Select the course
4. Optionally add a module name
5. Paste or upload your source material
6. Click "Generate Notes"
7. View or download the generated HTML notes

### Command Line

Generate notes from the command line:

```bash
npm run generate -- \
  --source ./lecture.txt \
  --course NURS320 \
  --title "Cardiac Assessment" \
  --module "Module 3"
```

### GitHub Actions

1. Go to Actions → Generate NurseNotes
2. Click "Run workflow"
3. Fill in the form with your content
4. The workflow will generate and commit the notes

## Deployment

### Vercel

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard:
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL` (optional, defaults to gpt-4o-mini)
3. Deploy

### GitHub Secrets

Add these secrets to your repository:
- `OPENAI_API_KEY` - Your OpenAI API key
- `OPENAI_MODEL` - (optional) Model to use

## Course Mappings

| Course ID | Course Name | Instructors |
|-----------|------------|-------------|
| NURS310 | Adult Health I | G. Hagerstrom; S. Dumas |
| NURS320 | Adult Health II | G. Hagerstrom; S. Dumas |
| NURS335 | NCLEX Immersion I | A. Hernandez; G. Rivera |
| NURS330 | Childbearing Family/OBGYN | S. Abdo; M. Douglas |
| NURS315 | Gerontological Nursing | A. Layson |

## Project Structure

```
nursenotes-ai/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── page.tsx           # Main UI
│   └── providers.tsx      # Material-UI theme
├── tools/                 # CLI tools
│   ├── nursenotes-cli.mjs # Note generation CLI
│   ├── html-template.mjs  # HTML template
│   └── utils.mjs          # Utility functions
├── prompts/               # AI prompts
│   └── nursenotes_system.txt
├── content/               # Generated content
│   ├── raw/              # Markdown files
│   └── manifest.json     # Navigation data
├── public/
│   └── notes/            # Generated HTML notes
└── .github/workflows/     # GitHub Actions

```

## API Endpoints

### POST /api/generate

Generate notes from source material.

**Request Body:**
```json
{
  "title": "Note title",
  "course": "NURS320",
  "module": "Module 2 (optional)",
  "source": "Source text content"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notes generated successfully",
  "slug": "2024-01-15-note-title",
  "notePath": "/notes/2024-01-15-note-title.html"
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.