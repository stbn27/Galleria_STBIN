import React, { useState } from 'react';
import { DirectoryNode } from '../../types/directory';
import { ChevronRight, ChevronDown, Folder } from 'lucide-react';

interface DirectoryTreeProps {
  nodes: DirectoryNode[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

const TreeNode: React.FC<{
  node: DirectoryNode;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  level: number;
}> = ({ node, selectedPath, onSelect, level }) => {
  const [expanded, setExpanded] = useState(level < 1);
  const isSelected = selectedPath === node.path;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div 
        className={`flex items-center py-1 px-2 cursor-pointer hover:bg-neutral-800 rounded text-sm ${isSelected ? 'bg-neutral-800 text-cyan-400' : 'text-neutral-300'}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => {
          onSelect(node.path);
          if (hasChildren && isSelected) {
            setExpanded(!expanded);
          } else if (hasChildren && !expanded && !isSelected) {
            setExpanded(true);
          }
        }}
      >
        <span 
          className="w-4 h-4 flex-shrink-0 flex items-center justify-center mr-1"
          onClick={(e) => {
            if (hasChildren) {
              e.stopPropagation();
              setExpanded(!expanded);
            }
          }}
        >
          {hasChildren && (
            expanded ? <ChevronDown className="w-3 h-3 text-neutral-400" /> : <ChevronRight className="w-3 h-3 text-neutral-400" />
          )}
        </span>
        <Folder className="w-4 h-4 mr-2 text-neutral-400 flex-shrink-0" />
        <span className="truncate">{node.name}</span>
        <span className="ml-2 text-xs text-neutral-500 bg-neutral-900 px-1.5 rounded-full">{node.count}</span>
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNode key={child.path} node={child} selectedPath={selectedPath} onSelect={onSelect} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const DirectoryTree: React.FC<DirectoryTreeProps> = ({ nodes, selectedPath, onSelect }) => {
  return (
    <div className="w-64 border-r border-neutral-800 bg-neutral-950 overflow-y-auto h-full p-2">
      <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-2">Carpetas</h3>
      {nodes.map(node => (
        <TreeNode key={node.path} node={node} selectedPath={selectedPath} onSelect={onSelect} level={0} />
      ))}
    </div>
  );
};

export default DirectoryTree;