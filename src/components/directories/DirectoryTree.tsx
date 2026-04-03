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
                className="flex items-center py-1 px-2 cursor-pointer rounded text-sm"
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = isSelected ? 'var(--accent-subtle)' : 'transparent';
                }}
                onClick={() => {
                    onSelect(node.path);
                    if (hasChildren && isSelected) {
                        setExpanded(!expanded);
                    } else if (hasChildren && !expanded && !isSelected) {
                        setExpanded(true);
                    }
                }}
                style={{
                    paddingLeft: `${level * 16 + 8}px`,
                    background: isSelected ? 'var(--accent-subtle)' : 'transparent',
                    color: isSelected ? 'var(--accent)' : 'var(--text-primary)'
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
                        expanded ? <ChevronDown className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} /> : <ChevronRight className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
                    )}
                </span>
                <Folder className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
                <span className="truncate">{node.name}</span>
                <span
                    className="ml-2 text-xs px-1.5 rounded-full"
                    style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}
                >
                    {node.count}
                </span>
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
        <div className="w-64 border-r overflow-y-auto h-full p-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-2 px-2" style={{ color: 'var(--text-secondary)' }}>Carpetas</h3>
            {nodes.length === 0 ? (
                <div className="px-2 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    No hay directorios para mostrar.
                </div>
            ) : (
                nodes.map(node => (
                    <TreeNode key={node.path} node={node} selectedPath={selectedPath} onSelect={onSelect} level={0} />
                ))
            )}
        </div>
    );
};

export default DirectoryTree;