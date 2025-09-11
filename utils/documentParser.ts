import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { convert } from 'html-to-text';

export interface ParsedDocument {
  text: string;
  metadata?: {
    title?: string;
    author?: string;
    pages?: number;
    format?: string;
  };
}

export class DocumentParser {
  private static readonly SUPPORTED_FORMATS = {
    // Microsoft Office formats
    '.doc': 'word',
    '.docx': 'word',
    '.xls': 'excel',
    '.xlsx': 'excel',
    '.xlsm': 'excel',
    '.ppt': 'powerpoint',
    '.pptx': 'powerpoint',
    
    // Text and code formats
    '.txt': 'text',
    '.md': 'text',
    '.markdown': 'text',
    '.rtf': 'text',
    '.csv': 'csv',
    '.tsv': 'csv',
    
    // Web formats
    '.html': 'html',
    '.htm': 'html',
    '.xml': 'text',
    '.css': 'text',
    '.js': 'text',
    '.jsx': 'text',
    '.ts': 'text',
    '.tsx': 'text',
    '.json': 'text',
    '.yaml': 'text',
    '.yml': 'text',
    
    // Document formats
    '.pdf': 'pdf',
    
    // Other code formats
    '.py': 'text',
    '.java': 'text',
    '.c': 'text',
    '.cpp': 'text',
    '.h': 'text',
    '.hpp': 'text',
    '.cs': 'text',
    '.php': 'text',
    '.rb': 'text',
    '.go': 'text',
    '.rs': 'text',
    '.swift': 'text',
    '.kt': 'text',
    '.scala': 'text',
    '.r': 'text',
    '.m': 'text',
    '.sql': 'text',
    '.sh': 'text',
    '.bash': 'text',
    '.ps1': 'text',
    '.bat': 'text',
  };

  static isSupported(filename: string): boolean {
    const extension = this.getFileExtension(filename);
    return extension in this.SUPPORTED_FORMATS;
  }

  static getSupportedFormats(): string[] {
    return Object.keys(this.SUPPORTED_FORMATS);
  }

  private static getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1) return '';
    return filename.substring(lastDot).toLowerCase();
  }

  static async parseFile(file: File): Promise<ParsedDocument> {
    const extension = this.getFileExtension(file.name);
    const format = this.SUPPORTED_FORMATS[extension as keyof typeof DocumentParser.SUPPORTED_FORMATS];

    if (!format) {
      throw new Error(`Unsupported file format: ${extension}`);
    }

    try {
      switch (format) {
        case 'word':
          return await this.parseWord(file);
        case 'excel':
          return await this.parseExcel(file);
        case 'powerpoint':
          return await this.parsePowerPoint(file);
        case 'pdf':
          return await this.parsePDF(file);
        case 'csv':
          return await this.parseCSV(file);
        case 'html':
          return await this.parseHTML(file);
        case 'text':
        default:
          return await this.parseText(file);
      }
    } catch (error) {
      console.error(`Error parsing ${file.name}:`, error);
      throw new Error(`Failed to parse ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async parseWord(file: File): Promise<ParsedDocument> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    return {
      text: result.value,
      metadata: {
        format: 'Microsoft Word',
        title: file.name.replace(/\.(docx?|doc)$/i, ''),
      }
    };
  }

  private static async parseExcel(file: File): Promise<ParsedDocument> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    let fullText = '';
    
    // Process each sheet
    workbook.SheetNames.forEach((sheetName, index) => {
      const worksheet = workbook.Sheets[sheetName];
      
      // Add sheet name as header
      fullText += `\n=== Sheet: ${sheetName} ===\n\n`;
      
      // Convert to CSV format for easy reading
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      
      // Convert CSV to markdown table format
      const rows = csv.split('\n').filter(row => row.trim());
      if (rows.length > 0) {
        // Process header
        const headers = rows[0].split(',');
        fullText += '| ' + headers.join(' | ') + ' |\n';
        fullText += '|' + headers.map(() => '---').join('|') + '|\n';
        
        // Process data rows
        for (let i = 1; i < rows.length; i++) {
          const cells = rows[i].split(',');
          fullText += '| ' + cells.join(' | ') + ' |\n';
        }
      }
      
      fullText += '\n';
    });
    
    return {
      text: fullText,
      metadata: {
        format: 'Microsoft Excel',
        title: file.name.replace(/\.(xlsx?|xlsm?)$/i, ''),
        pages: workbook.SheetNames.length,
      }
    };
  }

  private static async parsePowerPoint(file: File): Promise<ParsedDocument> {
    // For PowerPoint, we'll extract text from the file structure
    // This is a simplified approach - for production, consider using a dedicated library
    const arrayBuffer = await file.arrayBuffer();
    
    try {
      // Dynamically import JSZip to avoid build issues
      const JSZipModule = await import('jszip');
      const JSZip = JSZipModule.default || JSZipModule;
      const zip = new JSZip();
      await zip.loadAsync(arrayBuffer);
      
      let fullText = '';
      let slideCount = 0;
      
      // Extract text from slides
      const slideFiles = Object.keys(zip.files).filter(name => 
        name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
      ).sort();
      
      for (const slideName of slideFiles) {
        slideCount++;
        const slideContent = await zip.files[slideName].async('string');
        
        // Extract text from XML (basic approach)
        const textMatches = slideContent.match(/<a:t[^>]*>([^<]+)<\/a:t>/g);
        if (textMatches) {
          fullText += `\n=== Slide ${slideCount} ===\n`;
          textMatches.forEach(match => {
            const text = match.replace(/<[^>]+>/g, '');
            if (text.trim()) {
              fullText += text + '\n';
            }
          });
        }
      }
      
      // Also try to extract notes
      const notesFiles = Object.keys(zip.files).filter(name => 
        name.startsWith('ppt/notesSlides/') && name.endsWith('.xml')
      );
      
      if (notesFiles.length > 0) {
        fullText += '\n\n=== Speaker Notes ===\n';
        for (const notesFile of notesFiles) {
          const notesContent = await zip.files[notesFile].async('string');
          const notesMatches = notesContent.match(/<a:t[^>]*>([^<]+)<\/a:t>/g);
          if (notesMatches) {
            notesMatches.forEach(match => {
              const text = match.replace(/<[^>]+>/g, '');
              if (text.trim()) {
                fullText += text + '\n';
              }
            });
          }
        }
      }
      
      return {
        text: fullText || 'No text content found in PowerPoint file',
        metadata: {
          format: 'Microsoft PowerPoint',
          title: file.name.replace(/\.pptx?$/i, ''),
          pages: slideCount,
        }
      };
    } catch (error) {
      // Fallback for older PPT format or if JSZip fails
      console.error('PowerPoint parsing error:', error);
      return {
        text: 'PowerPoint file detected but could not extract text. Please save as PPTX format or copy text manually. Error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        metadata: {
          format: 'Microsoft PowerPoint',
          title: file.name.replace(/\.pptx?$/i, ''),
        }
      };
    }
  }

  private static async parsePDF(file: File): Promise<ParsedDocument> {
    // Use API route for PDF parsing to avoid client-side issues
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/parse-document', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to parse PDF');
      }
      
      const data = await response.json();
      return {
        text: data.text,
        metadata: data.metadata,
      };
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async parseCSV(file: File): Promise<ParsedDocument> {
    const text = await file.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        complete: (results) => {
          let markdownTable = '';
          
          if (results.data && results.data.length > 0) {
            const data = results.data as string[][];
            
            // Create markdown table
            if (data.length > 0) {
              // Header
              markdownTable += '| ' + data[0].join(' | ') + ' |\n';
              markdownTable += '|' + data[0].map(() => '---').join('|') + '|\n';
              
              // Data rows
              for (let i = 1; i < data.length; i++) {
                if (data[i].some(cell => cell)) { // Skip empty rows
                  markdownTable += '| ' + data[i].join(' | ') + ' |\n';
                }
              }
            }
          }
          
          resolve({
            text: markdownTable || text,
            metadata: {
              format: 'CSV',
              title: file.name.replace(/\.(csv|tsv)$/i, ''),
            }
          });
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        }
      });
    });
  }

  private static async parseHTML(file: File): Promise<ParsedDocument> {
    const html = await file.text();
    
    // Convert HTML to plain text
    const text = convert(html, {
      wordwrap: false,
      preserveNewlines: true,
      selectors: [
        { selector: 'script', format: 'skip' },
        { selector: 'style', format: 'skip' },
        { selector: 'h1', options: { uppercase: false, leadingLineBreaks: 2, trailingLineBreaks: 1 } },
        { selector: 'h2', options: { uppercase: false, leadingLineBreaks: 2, trailingLineBreaks: 1 } },
        { selector: 'h3', options: { uppercase: false, leadingLineBreaks: 2, trailingLineBreaks: 1 } },
        { selector: 'h4', options: { uppercase: false, leadingLineBreaks: 2, trailingLineBreaks: 1 } },
        { selector: 'h5', options: { uppercase: false, leadingLineBreaks: 2, trailingLineBreaks: 1 } },
        { selector: 'h6', options: { uppercase: false, leadingLineBreaks: 2, trailingLineBreaks: 1 } },
        { selector: 'p', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
        { selector: 'br', format: 'lineBreak' },
        { selector: 'ul', options: { itemPrefix: '• ' } },
        { selector: 'ol', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
        { selector: 'li', options: { leadingLineBreaks: 1 } },
        { selector: 'a', options: { hideLinkHrefIfSameAsText: true } },
        { selector: 'table', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
        { selector: 'th', options: { uppercase: false } },
      ]
    });
    
    // Try to extract title from HTML
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : file.name.replace(/\.html?$/i, '');
    
    return {
      text,
      metadata: {
        format: 'HTML',
        title,
      }
    };
  }

  private static async parseText(file: File): Promise<ParsedDocument> {
    const text = await file.text();
    const extension = this.getFileExtension(file.name);
    
    // For code files, add language hint
    let formattedText = text;
    if (['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.r', '.m', '.sql'].includes(extension)) {
      formattedText = `\`\`\`${extension.substring(1)}\n${text}\n\`\`\``;
    }
    
    return {
      text: formattedText,
      metadata: {
        format: extension.substring(1).toUpperCase() || 'Text',
        title: file.name.replace(new RegExp(`\\${extension}$`, 'i'), ''),
      }
    };
  }

  static formatForDisplay(parsed: ParsedDocument): string {
    let output = '';
    
    // Add metadata header if available
    if (parsed.metadata) {
      output += '=== Document Information ===\n';
      if (parsed.metadata.title) output += `Title: ${parsed.metadata.title}\n`;
      if (parsed.metadata.format) output += `Format: ${parsed.metadata.format}\n`;
      if (parsed.metadata.author) output += `Author: ${parsed.metadata.author}\n`;
      if (parsed.metadata.pages) output += `Pages/Sheets: ${parsed.metadata.pages}\n`;
      output += '\n=== Content ===\n\n';
    }
    
    output += parsed.text;
    
    return output;
  }
}