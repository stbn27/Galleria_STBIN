import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { DirectoryNode } from '../types/directory';
import DirectoryTree from '../components/directories/DirectoryTree';
import DirectoryView from '../components/directories/DirectoryView';

const DirectoriesPage: React.FC = () => {
  const [nodes, setNodes] = useState<DirectoryNode[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  useEffect(() => {
    const fetchTree = async () => {
      try {
        const tree = await invoke<DirectoryNode[]>('get_directory_tree');
        setNodes(tree);
        if (tree.length > 0) {
          setSelectedPath(tree[0].path);
        }
      } catch (err) {
        console.error('Failed to load directory tree', err);
      }
    };
    fetchTree();
  }, []);

  return (
    <div className="flex h-full w-full bg-neutral-900 border-t border-neutral-800 text-neutral-200">
      <DirectoryTree nodes={nodes} selectedPath={selectedPath} onSelect={setSelectedPath} />
      <div className="flex-1 flex flex-col bg-neutral-950/50 relative border-l border-neutral-800 overflow-hidden">
         <DirectoryView selectedPath={selectedPath} />
      </div>
    </div>
  );
};

export default DirectoriesPage;