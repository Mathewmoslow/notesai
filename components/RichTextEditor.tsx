'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Select,
  MenuItem,
  FormControl,
  Divider,
  Tooltip,
  Popover,
  Button,
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatStrikethrough,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  FormatAlignJustify,
  FormatListBulleted,
  FormatListNumbered,
  FormatIndentDecrease,
  FormatIndentIncrease,
  FormatQuote,
  Code,
  Link,
  Image,
  TableChart,
  Undo,
  Redo,
  Save,
  Print,
  FormatColorText,
  FormatColorFill,
  Superscript,
  Subscript,
  ClearAll,
  Functions,
  Rectangle,
  Circle,
  ArrowRightAlt,
  Timeline,
  CheckBox,
  RadioButtonUnchecked,
  Star,
  FavoriteBorder,
} from '@mui/icons-material';

interface RichTextEditorProps {
  initialContent: string;
  onSave: (content: string) => void;
  onPrint?: () => void;
}

const fontFamilies = [
  'Arial',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Helvetica',
  'Courier New',
  'Comic Sans MS',
  'Impact',
  'Lucida Console',
  'Tahoma',
  'Trebuchet MS',
  'Palatino',
];

const fontSizes = [
  '8px', '9px', '10px', '11px', '12px', '14px', '16px', '18px',
  '20px', '24px', '28px', '32px', '36px', '48px', '72px'
];

const colors = [
  '#000000', '#434343', '#666666', '#999999', '#cccccc', '#e0e0e0', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff',
  '#9900ff', '#ff00ff', '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3',
  '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc', '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599',
  '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd', '#cc4125', '#e06666',
  '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
];

export default function RichTextEditor({ initialContent, onSave, onPrint }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState('14px');
  const [textColor, setTextColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('transparent');
  const [colorAnchorEl, setColorAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [bgColorAnchorEl, setBgColorAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [shapeAnchorEl, setShapeAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [alignment, setAlignment] = useState<string>('left');
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  useEffect(() => {
    if (editorRef.current && initialContent) {
      editorRef.current.innerHTML = initialContent;
    }
  }, [initialContent]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    saveToUndoStack();
  };

  const saveToUndoStack = () => {
    if (editorRef.current) {
      setUndoStack(prev => [...prev.slice(-49), editorRef.current!.innerHTML]);
      setRedoStack([]);
    }
  };

  const handleUndo = () => {
    if (undoStack.length > 0 && editorRef.current) {
      const lastState = undoStack[undoStack.length - 1];
      setRedoStack(prev => [...prev, editorRef.current!.innerHTML]);
      setUndoStack(prev => prev.slice(0, -1));
      editorRef.current.innerHTML = lastState;
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0 && editorRef.current) {
      const nextState = redoStack[redoStack.length - 1];
      setUndoStack(prev => [...prev, editorRef.current!.innerHTML]);
      setRedoStack(prev => prev.slice(0, -1));
      editorRef.current.innerHTML = nextState;
    }
  };

  const handleFormat = (event: React.MouseEvent<HTMLElement>, newFormats: string[]) => {
    setSelectedFormats(newFormats);
    newFormats.forEach(format => {
      switch (format) {
        case 'bold':
          execCommand('bold');
          break;
        case 'italic':
          execCommand('italic');
          break;
        case 'underline':
          execCommand('underline');
          break;
        case 'strikethrough':
          execCommand('strikeThrough');
          break;
        case 'superscript':
          execCommand('superscript');
          break;
        case 'subscript':
          execCommand('subscript');
          break;
      }
    });
  };

  const handleAlignment = (event: React.MouseEvent<HTMLElement>, newAlignment: string) => {
    if (newAlignment !== null) {
      setAlignment(newAlignment);
      switch (newAlignment) {
        case 'left':
          execCommand('justifyLeft');
          break;
        case 'center':
          execCommand('justifyCenter');
          break;
        case 'right':
          execCommand('justifyRight');
          break;
        case 'justify':
          execCommand('justifyFull');
          break;
      }
    }
  };

  const handleFontFamily = (value: string) => {
    setFontFamily(value);
    execCommand('fontName', value);
  };

  const handleFontSize = (value: string) => {
    setFontSize(value);
    const sizeMap: { [key: string]: string } = {
      '8px': '1',
      '9px': '1',
      '10px': '1',
      '11px': '2',
      '12px': '2',
      '14px': '3',
      '16px': '4',
      '18px': '5',
      '20px': '5',
      '24px': '6',
      '28px': '6',
      '32px': '7',
      '36px': '7',
      '48px': '7',
      '72px': '7',
    };
    execCommand('fontSize', sizeMap[value] || '3');
  };

  const insertTable = () => {
    const rows = prompt('Number of rows:', '3');
    const cols = prompt('Number of columns:', '3');
    if (rows && cols) {
      let table = '<table border="1" style="border-collapse: collapse; width: 100%;">';
      for (let i = 0; i < parseInt(rows); i++) {
        table += '<tr>';
        for (let j = 0; j < parseInt(cols); j++) {
          table += '<td style="padding: 8px; border: 1px solid #ddd;">&nbsp;</td>';
        }
        table += '</tr>';
      }
      table += '</table><br>';
      execCommand('insertHTML', table);
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const insertImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = `<img src="${event.target?.result}" alt="Inserted image" style="max-width: 100%; height: auto;">`;
          execCommand('insertHTML', img);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const insertShape = (shapeType: string) => {
    let shapeHTML = '';
    const color = textColor;
    
    switch (shapeType) {
      case 'rectangle':
        shapeHTML = `<div style="display: inline-block; width: 100px; height: 60px; background-color: ${color}; margin: 5px;">&nbsp;</div>`;
        break;
      case 'circle':
        shapeHTML = `<div style="display: inline-block; width: 60px; height: 60px; background-color: ${color}; border-radius: 50%; margin: 5px;">&nbsp;</div>`;
        break;
      case 'arrow':
        shapeHTML = `<span style="font-size: 24px; color: ${color};">→</span>`;
        break;
      case 'line':
        shapeHTML = `<hr style="border-color: ${color}; margin: 10px 0;">`;
        break;
      case 'star':
        shapeHTML = `<span style="font-size: 24px; color: ${color};">★</span>`;
        break;
      case 'heart':
        shapeHTML = `<span style="font-size: 24px; color: ${color};">♥</span>`;
        break;
      case 'checkbox':
        shapeHTML = `<input type="checkbox" style="margin: 0 5px;">`;
        break;
      case 'radio':
        shapeHTML = `<input type="radio" style="margin: 0 5px;">`;
        break;
    }
    
    if (shapeHTML) {
      execCommand('insertHTML', shapeHTML);
    }
    setShapeAnchorEl(null);
  };

  const insertMathSymbol = () => {
    const symbols = ['∑', '∏', '√', '∞', '∫', '≈', '≠', '≤', '≥', '±', 'π', 'θ', 'α', 'β', 'γ', 'δ', 'λ', 'μ', 'σ', 'φ'];
    const symbol = prompt(`Choose a symbol: ${symbols.join(' ')}`);
    if (symbol) {
      execCommand('insertHTML', symbol);
    }
  };

  const handleSave = () => {
    if (editorRef.current) {
      onSave(editorRef.current.innerHTML);
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const clearFormatting = () => {
    execCommand('removeFormat');
    execCommand('formatBlock', 'div');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Paper elevation={1} sx={{ p: 1, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          <Tooltip title="Undo">
            <IconButton onClick={handleUndo} size="small">
              <Undo />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Redo">
            <IconButton onClick={handleRedo} size="small">
              <Redo />
            </IconButton>
          </Tooltip>
          
          <Divider orientation="vertical" flexItem />
          
          <Tooltip title="Save">
            <IconButton onClick={handleSave} size="small" color="primary">
              <Save />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Print">
            <IconButton onClick={handlePrint} size="small">
              <Print />
            </IconButton>
          </Tooltip>
          
          <Divider orientation="vertical" flexItem />
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={fontFamily}
              onChange={(e) => handleFontFamily(e.target.value)}
              displayEmpty
            >
              {fontFamilies.map(font => (
                <MenuItem key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 80 }}>
            <Select
              value={fontSize}
              onChange={(e) => handleFontSize(e.target.value)}
              displayEmpty
            >
              {fontSizes.map(size => (
                <MenuItem key={size} value={size}>
                  {size}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Divider orientation="vertical" flexItem />
          
          <ToggleButtonGroup
            value={selectedFormats}
            onChange={handleFormat}
            aria-label="text formatting"
            size="small"
          >
            <ToggleButton value="bold" aria-label="bold">
              <FormatBold />
            </ToggleButton>
            <ToggleButton value="italic" aria-label="italic">
              <FormatItalic />
            </ToggleButton>
            <ToggleButton value="underline" aria-label="underline">
              <FormatUnderlined />
            </ToggleButton>
            <ToggleButton value="strikethrough" aria-label="strikethrough">
              <FormatStrikethrough />
            </ToggleButton>
          </ToggleButtonGroup>
          
          <ToggleButtonGroup
            value={selectedFormats}
            onChange={handleFormat}
            aria-label="super subscript"
            size="small"
          >
            <ToggleButton value="superscript" aria-label="superscript">
              <Superscript />
            </ToggleButton>
            <ToggleButton value="subscript" aria-label="subscript">
              <Subscript />
            </ToggleButton>
          </ToggleButtonGroup>
          
          <Divider orientation="vertical" flexItem />
          
          <Tooltip title="Text Color">
            <IconButton
              size="small"
              onClick={(e) => setColorAnchorEl(e.currentTarget)}
              style={{ color: textColor }}
            >
              <FormatColorText />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Highlight Color">
            <IconButton
              size="small"
              onClick={(e) => setBgColorAnchorEl(e.currentTarget)}
              style={{ backgroundColor: bgColor === 'transparent' ? undefined : bgColor }}
            >
              <FormatColorFill />
            </IconButton>
          </Tooltip>
          
          <Divider orientation="vertical" flexItem />
          
          <ToggleButtonGroup
            value={alignment}
            exclusive
            onChange={handleAlignment}
            aria-label="text alignment"
            size="small"
          >
            <ToggleButton value="left" aria-label="left aligned">
              <FormatAlignLeft />
            </ToggleButton>
            <ToggleButton value="center" aria-label="centered">
              <FormatAlignCenter />
            </ToggleButton>
            <ToggleButton value="right" aria-label="right aligned">
              <FormatAlignRight />
            </ToggleButton>
            <ToggleButton value="justify" aria-label="justified">
              <FormatAlignJustify />
            </ToggleButton>
          </ToggleButtonGroup>
          
          <Divider orientation="vertical" flexItem />
          
          <Tooltip title="Bullet List">
            <IconButton onClick={() => execCommand('insertUnorderedList')} size="small">
              <FormatListBulleted />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Numbered List">
            <IconButton onClick={() => execCommand('insertOrderedList')} size="small">
              <FormatListNumbered />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Decrease Indent">
            <IconButton onClick={() => execCommand('outdent')} size="small">
              <FormatIndentDecrease />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Increase Indent">
            <IconButton onClick={() => execCommand('indent')} size="small">
              <FormatIndentIncrease />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Quote">
            <IconButton onClick={() => execCommand('formatBlock', 'blockquote')} size="small">
              <FormatQuote />
            </IconButton>
          </Tooltip>
          
          <Divider orientation="vertical" flexItem />
          
          <Tooltip title="Insert Link">
            <IconButton onClick={insertLink} size="small">
              <Link />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Insert Image">
            <IconButton onClick={insertImage} size="small">
              <Image />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Insert Table">
            <IconButton onClick={insertTable} size="small">
              <TableChart />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Insert Shape">
            <IconButton 
              onClick={(e) => setShapeAnchorEl(e.currentTarget)} 
              size="small"
            >
              <Rectangle />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Insert Math Symbol">
            <IconButton onClick={insertMathSymbol} size="small">
              <Functions />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Code">
            <IconButton onClick={() => execCommand('formatBlock', 'pre')} size="small">
              <Code />
            </IconButton>
          </Tooltip>
          
          <Divider orientation="vertical" flexItem />
          
          <Tooltip title="Clear Formatting">
            <IconButton onClick={clearFormatting} size="small">
              <ClearAll />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>
      
      <Box
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={saveToUndoStack}
        sx={{
          flex: 1,
          p: 3,
          bgcolor: 'background.paper',
          minHeight: 400,
          overflowY: 'auto',
          outline: 'none',
          fontFamily: fontFamily,
          fontSize: fontSize,
          '&:focus': {
            outline: 'none',
          },
          '& *': {
            maxWidth: '100%',
          },
          '& img': {
            maxWidth: '100%',
            height: 'auto',
          },
          '& table': {
            borderCollapse: 'collapse',
            width: '100%',
          },
          '& td, & th': {
            border: '1px solid #ddd',
            padding: '8px',
          },
        }}
      />
      
      <Popover
        open={Boolean(colorAnchorEl)}
        anchorEl={colorAnchorEl}
        onClose={() => setColorAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, width: 280, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {colors.map(color => (
                <Button
                  key={color}
                  sx={{
                    minWidth: 30,
                    width: 30,
                    height: 30,
                    backgroundColor: color,
                    border: '1px solid #ccc',
                    padding: 0,
                    '&:hover': {
                      backgroundColor: color,
                      transform: 'scale(1.2)',
                    },
                  }}
                  onClick={() => {
                    setTextColor(color);
                    execCommand('foreColor', color);
                    setColorAnchorEl(null);
                  }}
                />
            ))}
        </Box>
      </Popover>
      
      <Popover
        open={Boolean(bgColorAnchorEl)}
        anchorEl={bgColorAnchorEl}
        onClose={() => setBgColorAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, width: 280, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {colors.map(color => (
                <Button
                  key={color}
                  sx={{
                    minWidth: 30,
                    width: 30,
                    height: 30,
                    backgroundColor: color,
                    border: '1px solid #ccc',
                    padding: 0,
                    '&:hover': {
                      backgroundColor: color,
                      transform: 'scale(1.2)',
                    },
                  }}
                  onClick={() => {
                    setBgColor(color);
                    execCommand('hiliteColor', color);
                    setBgColorAnchorEl(null);
                  }}
                />
            ))}
        </Box>
      </Popover>
      
      <Popover
        open={Boolean(shapeAnchorEl)}
        anchorEl={shapeAnchorEl}
        onClose={() => setShapeAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Tooltip title="Rectangle">
                <IconButton onClick={() => insertShape('rectangle')}>
                  <Rectangle />
                </IconButton>
              </Tooltip>
              <Tooltip title="Circle">
                <IconButton onClick={() => insertShape('circle')}>
                  <Circle />
                </IconButton>
              </Tooltip>
              <Tooltip title="Arrow">
                <IconButton onClick={() => insertShape('arrow')}>
                  <ArrowRightAlt />
                </IconButton>
              </Tooltip>
              <Tooltip title="Line">
                <IconButton onClick={() => insertShape('line')}>
                  <Timeline />
                </IconButton>
              </Tooltip>
              <Tooltip title="Star">
                <IconButton onClick={() => insertShape('star')}>
                  <Star />
                </IconButton>
              </Tooltip>
              <Tooltip title="Heart">
                <IconButton onClick={() => insertShape('heart')}>
                  <FavoriteBorder />
                </IconButton>
              </Tooltip>
              <Tooltip title="Checkbox">
                <IconButton onClick={() => insertShape('checkbox')}>
                  <CheckBox />
                </IconButton>
              </Tooltip>
              <Tooltip title="Radio Button">
                <IconButton onClick={() => insertShape('radio')}>
                  <RadioButtonUnchecked />
                </IconButton>
              </Tooltip>
        </Box>
      </Popover>
    </Box>
  );
}