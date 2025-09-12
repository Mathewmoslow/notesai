'use client';

import React from 'react';
import { Box } from '@mui/material';

interface ConceptMapData {
  central: string;
  pathophysiology: string[];
  riskFactors: string[];
  causes: string[];
  signsSymptoms: string[];
  diagnostics: string[];
  complications: string[];
  nursingInterventions: string[];
  medications: string[];
  treatments: string[];
  patientEducation: string[];
}

interface ConceptMapProps {
  data: ConceptMapData;
}

const ConceptMap: React.FC<ConceptMapProps> = ({ data }) => {
  return (
    <Box sx={{ 
      width: '100%', 
      overflowX: 'auto', 
      p: 2,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: 2
    }}>
      <svg
        width="1200"
        height="800"
        viewBox="0 0 1200 800"
        style={{ 
          minWidth: '1200px',
          display: 'block',
          margin: '0 auto',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}
      >
        {/* Define arrow markers */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#666" />
          </marker>
        </defs>

        {/* Central Disease/Condition - Star shape */}
        <g transform="translate(600, 400)">
          <polygon
            points="0,-40 12,-12 40,-8 20,8 24,36 0,20 -24,36 -20,8 -40,-8 -12,-12"
            fill="#FFD700"
            stroke="#FFA500"
            strokeWidth="2"
          />
          <foreignObject x="-60" y="-20" width="120" height="40">
            <div style={{ 
              textAlign: 'center', 
              fontSize: '12px', 
              fontWeight: 'bold',
              color: '#333'
            }}>
              {data.central}
            </div>
          </foreignObject>
        </g>

        {/* Pathophysiology - Cloud shape top */}
        <g transform="translate(600, 150)">
          <ellipse cx="0" cy="0" rx="120" ry="60" fill="#E8F5E9" stroke="#4CAF50" strokeWidth="2"/>
          <text x="0" y="-20" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#2E7D32">
            PATHOPHYSIOLOGY
          </text>
          <foreignObject x="-100" y="-10" width="200" height="60">
            <div style={{ fontSize: '11px', padding: '5px' }}>
              <ul style={{ margin: 0, paddingLeft: '15px' }}>
                {data.pathophysiology.slice(0, 3).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </foreignObject>
        </g>

        {/* Risk Factors - Cloud shape left */}
        <g transform="translate(250, 250)">
          <ellipse cx="0" cy="0" rx="100" ry="50" fill="#FFF3E0" stroke="#FF9800" strokeWidth="2"/>
          <text x="0" y="-15" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#E65100">
            RISK FACTORS
          </text>
          <foreignObject x="-80" y="-5" width="160" height="45">
            <div style={{ fontSize: '10px', padding: '3px' }}>
              <ul style={{ margin: 0, paddingLeft: '15px' }}>
                {data.riskFactors.slice(0, 3).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </foreignObject>
        </g>

        {/* Causes/Etiology - Cloud shape right */}
        <g transform="translate(950, 250)">
          <ellipse cx="0" cy="0" rx="100" ry="50" fill="#F3E5F5" stroke="#9C27B0" strokeWidth="2"/>
          <text x="0" y="-15" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#6A1B9A">
            CAUSES
          </text>
          <foreignObject x="-80" y="-5" width="160" height="45">
            <div style={{ fontSize: '10px', padding: '3px' }}>
              <ul style={{ margin: 0, paddingLeft: '15px' }}>
                {data.causes.slice(0, 3).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </foreignObject>
        </g>

        {/* Signs & Symptoms - Rectangle */}
        <g transform="translate(600, 280)">
          <rect x="-100" y="-30" width="200" height="60" rx="5" fill="#FFE5E5" stroke="#F44336" strokeWidth="2"/>
          <text x="0" y="-10" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#C62828">
            SIGNS & SYMPTOMS
          </text>
          <foreignObject x="-90" y="0" width="180" height="40">
            <div style={{ fontSize: '10px', padding: '3px' }}>
              <ul style={{ margin: 0, paddingLeft: '15px' }}>
                {data.signsSymptoms.slice(0, 2).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </foreignObject>
        </g>

        {/* Diagnostics/Labs - Circle */}
        <g transform="translate(200, 400)">
          <circle cx="0" cy="0" r="70" fill="#E3F2FD" stroke="#2196F3" strokeWidth="2"/>
          <text x="0" y="-20" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#1565C0">
            DIAGNOSTICS
          </text>
          <foreignObject x="-60" y="-10" width="120" height="50">
            <div style={{ fontSize: '10px', padding: '3px' }}>
              <ul style={{ margin: 0, paddingLeft: '15px' }}>
                {data.diagnostics.slice(0, 2).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </foreignObject>
        </g>

        {/* Complications - Lightbulb shape */}
        <g transform="translate(1000, 400)">
          <circle cx="0" cy="0" r="60" fill="#FFF9C4" stroke="#FBC02D" strokeWidth="2"/>
          <text x="0" y="-15" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#F57C00">
            COMPLICATIONS
          </text>
          <foreignObject x="-50" y="-5" width="100" height="40">
            <div style={{ fontSize: '10px', padding: '3px' }}>
              <ul style={{ margin: 0, paddingLeft: '15px' }}>
                {data.complications.slice(0, 2).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </foreignObject>
        </g>

        {/* Nursing Interventions - Notebook */}
        <g transform="translate(250, 550)">
          <rect x="-90" y="-30" width="180" height="60" rx="3" fill="#E8EAF6" stroke="#3F51B5" strokeWidth="2"/>
          <line x1="-90" y1="-10" x2="-70" y2="-10" stroke="#3F51B5" strokeWidth="1"/>
          <line x1="-90" y1="0" x2="-70" y2="0" stroke="#3F51B5" strokeWidth="1"/>
          <line x1="-90" y1="10" x2="-70" y2="10" stroke="#3F51B5" strokeWidth="1"/>
          <line x1="-90" y1="20" x2="-70" y2="20" stroke="#3F51B5" strokeWidth="1"/>
          <text x="0" y="-10" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#283593">
            NURSING CARE
          </text>
          <foreignObject x="-80" y="0" width="160" height="40">
            <div style={{ fontSize: '10px', padding: '3px' }}>
              <ul style={{ margin: 0, paddingLeft: '15px' }}>
                {data.nursingInterventions.slice(0, 2).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </foreignObject>
        </g>

        {/* Medications - Cloud */}
        <g transform="translate(600, 550)">
          <ellipse cx="0" cy="0" rx="100" ry="45" fill="#FCE4EC" stroke="#E91E63" strokeWidth="2"/>
          <text x="0" y="-15" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#880E4F">
            MEDICATIONS
          </text>
          <foreignObject x="-80" y="-5" width="160" height="40">
            <div style={{ fontSize: '10px', padding: '3px' }}>
              <ul style={{ margin: 0, paddingLeft: '15px' }}>
                {data.medications.slice(0, 2).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </foreignObject>
        </g>

        {/* Treatments - Rectangle */}
        <g transform="translate(950, 550)">
          <rect x="-80" y="-25" width="160" height="50" rx="5" fill="#E0F2F1" stroke="#009688" strokeWidth="2"/>
          <text x="0" y="-5" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#00695C">
            TREATMENTS
          </text>
          <foreignObject x="-70" y="5" width="140" height="30">
            <div style={{ fontSize: '10px', padding: '3px' }}>
              <ul style={{ margin: 0, paddingLeft: '15px' }}>
                {data.treatments.slice(0, 2).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </foreignObject>
        </g>

        {/* Patient Education - Bottom */}
        <g transform="translate(600, 700)">
          <rect x="-120" y="-25" width="240" height="50" rx="5" fill="#F1F8E9" stroke="#689F38" strokeWidth="2"/>
          <text x="0" y="-5" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#33691E">
            PATIENT EDUCATION
          </text>
          <foreignObject x="-110" y="5" width="220" height="30">
            <div style={{ fontSize: '10px', padding: '3px' }}>
              <ul style={{ margin: 0, paddingLeft: '15px' }}>
                {data.patientEducation.slice(0, 2).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </foreignObject>
        </g>

        {/* Arrows connecting elements */}
        {/* Pathophysiology to Central */}
        <line x1="600" y1="210" x2="600" y2="360" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead)"/>
        
        {/* Risk Factors to Signs/Symptoms */}
        <line x1="330" y1="280" x2="500" y2="280" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead)"/>
        
        {/* Causes to Signs/Symptoms */}
        <line x1="870" y1="280" x2="700" y2="280" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead)"/>
        
        {/* Central to Diagnostics */}
        <line x1="560" y1="400" x2="270" y2="400" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead)"/>
        
        {/* Central to Complications */}
        <line x1="640" y1="400" x2="940" y2="400" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead)"/>
        
        {/* Diagnostics to Nursing */}
        <line x1="230" y1="460" x2="250" y2="490" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead)"/>
        
        {/* Complications to Treatments */}
        <line x1="980" y1="460" x2="960" y2="495" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead)"/>
        
        {/* Central to Medications */}
        <line x1="600" y1="440" x2="600" y2="505" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead)"/>
        
        {/* Medications to Patient Education */}
        <line x1="600" y1="595" x2="600" y2="675" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead)"/>
        
        {/* Nursing to Patient Education */}
        <line x1="340" y1="570" x2="480" y2="680" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead)"/>
        
        {/* Treatments to Patient Education */}
        <line x1="860" y1="570" x2="720" y2="680" stroke="#666" strokeWidth="2" markerEnd="url(#arrowhead)"/>
      </svg>
    </Box>
  );
};

export default ConceptMap;