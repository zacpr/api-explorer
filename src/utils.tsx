import React from 'react';

/**
 * Simple JSON syntax highlighter component
 * Renders JSON with color-coded keys, strings, numbers, booleans, and nulls
 */
interface JsonHighlighterProps {
  data: unknown;
}

export function JsonHighlighter({ data }: JsonHighlighterProps): React.ReactElement {
  const json = JSON.stringify(data, null, 2);
  
  const highlight = (json: string): React.ReactNode[] => {
    const tokens: React.ReactNode[] = [];
    let keyIndex = 0;
    
    // Split by newlines to process line by line
    const lines = json.split('\n');
    
    lines.forEach((line, lineIdx) => {
      // Regex to match JSON tokens
      const regex = /("(?:[^"\\]|\\.)*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(true|false|null)|([{}[\],:])/g;
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      const lineTokens: React.ReactNode[] = [];
      
      while ((match = regex.exec(line)) !== null) {
        // Add text before match
        if (match.index > lastIndex) {
          lineTokens.push(
            <span key={`text-${lineIdx}-${lastIndex}`}>{line.slice(lastIndex, match.index)}</span>
          );
        }
        
        const [token, string, number, boolean, punctuation] = match;
        
        if (string) {
          // Check if this is a key (followed by colon)
          const isKey = line.slice(match.index + token.length).trim().startsWith(':');
          lineTokens.push(
            <span
              key={`str-${lineIdx}-${keyIndex++}`}
              style={{ 
                color: isKey ? '#9cdcfe' : '#ce9178',
              }}
            >
              {token}
            </span>
          );
        } else if (number) {
          lineTokens.push(
            <span key={`num-${lineIdx}-${keyIndex++}`} style={{ color: '#b5cea8' }}>
              {token}
            </span>
          );
        } else if (boolean) {
          lineTokens.push(
            <span key={`bool-${lineIdx}-${keyIndex++}`} style={{ color: '#569cd6' }}>
              {token}
            </span>
          );
        } else if (punctuation) {
          lineTokens.push(
            <span key={`punct-${lineIdx}-${keyIndex++}`} style={{ color: '#d4d4d4' }}>
              {token}
            </span>
          );
        }
        
        lastIndex = match.index + token.length;
      }
      
      // Add remaining text
      if (lastIndex < line.length) {
        lineTokens.push(
          <span key={`text-end-${lineIdx}`}>{line.slice(lastIndex)}</span>
        );
      }
      
      tokens.push(
        <div key={`line-${lineIdx}`} style={{ display: 'block' }}>
          {lineTokens.length > 0 ? lineTokens : <span>&nbsp;</span>}
        </div>
      );
    });
    
    return tokens;
  };
  
  return (
    <pre style={{ 
      fontFamily: "'Monaco', 'Menlo', 'Fira Code', monospace",
      fontSize: '13px',
      lineHeight: '1.6',
      margin: 0,
      padding: 0,
      background: 'transparent',
    }}>
      {highlight(json)}
    </pre>
  );
}

/**
 * Format a timestamp to a readable string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

/**
 * Format duration in ms to a readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
