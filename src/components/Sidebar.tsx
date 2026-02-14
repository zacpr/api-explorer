import { useState } from 'react';
import type { ApiOperation } from '@/models/types';
import Logo from './Logo';

interface SidebarProps {
  tags: string[];
  operations: ApiOperation[];
  selectedOperation: ApiOperation | null;
  selectedTag: string | null;
  onSelectOperation: (op: ApiOperation) => void;

  schemaName?: string;
  operationCount: number;
}

function Sidebar({
  tags,
  operations,
  selectedOperation,
  selectedTag,
  onSelectOperation,
  schemaName,
  operationCount,
}: SidebarProps) {
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());

  const toggleTag = (tag: string) => {
    const newExpanded = new Set(expandedTags);
    if (newExpanded.has(tag)) {
      newExpanded.delete(tag);
    } else {
      newExpanded.add(tag);
    }
    setExpandedTags(newExpanded);
  };

  const operationsByTag = tags.reduce((acc, tag) => {
    acc[tag] = operations.filter(op => op.tags.includes(tag));
    return acc;
  }, {} as Record<string, ApiOperation[]>);

  return (
    <div className="sidebar">
      <div className="header">
        <div className="brand">
          <Logo size={36} />
          <div>
            <h1>API Explorer</h1>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              {schemaName || 'No schema loaded'}
            </div>
          </div>
        </div>
      </div>

      <div className="tag-tree">
        {tags.map(tag => {
          const tagOps = operationsByTag[tag] || [];
          const isExpanded = expandedTags.has(tag);
          const isSelected = selectedTag === tag;

          return (
            <div key={tag} className="tag-item">
              <div
                className="tag-header"
                onClick={() => toggleTag(tag)}
                style={{
                  background: isSelected ? 'var(--accent)' : undefined,
                  color: isSelected ? 'white' : undefined,
                }}
              >
                <span className={`tag-arrow ${isExpanded ? 'expanded' : ''}`}>▶</span>
                <span>{tag}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.7 }}>
                  {tagOps.length}
                </span>
              </div>

              {isExpanded && (
                <div className="operation-list">
                  {tagOps.map(op => (
                    <div
                      key={op.operationId}
                      className={`operation-item ${selectedOperation?.operationId === op.operationId ? 'active' : ''}`}
                      onClick={() => onSelectOperation(op)}
                      title={`${op.method.toUpperCase()} ${op.path}`}
                    >
                      <span className={`method-badge ${op.method}`}>{op.method}</span>
                      <span className="operation-name">{op.operationId}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="stats">
        {operationCount.toLocaleString()} operations
        {operations.length !== operationCount && (
          <span> ({operations.length} shown)</span>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
