import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { DirectoryNode } from '../types/directory';
import DirectoryTree from '../components/directories/DirectoryTree';
import DirectoryView from '../components/directories/DirectoryView';

const DirectoriesPage: React.FC = () => {
    const [nodes, setNodes] = useState<DirectoryNode[]>([]);
    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTree = async () => {
            setLoading(true);
            setError(null);
            try {
                const tree = await invoke<DirectoryNode[]>('get_directories');
                setNodes(tree);
                if (tree.length > 0) {
                    setSelectedPath(tree[0].path);
                }
            } catch (err) {
                console.error('Failed to load directory tree', err);
                setError('No se pudo cargar el árbol de directorios.');
            } finally {
                setLoading(false);
            }
        };
        fetchTree();
    }, []);

    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center" style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
                Cargando directorios...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-full w-full items-center justify-center" style={{ background: 'var(--bg-primary)', color: 'var(--danger)' }}>
                {error}
            </div>
        );
    }

    if (nodes.length === 0) {
        return (
            <div className="flex h-full w-full items-center justify-center" style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
                No hay carpetas indexadas todavía.
            </div>
        );
    }

    return (
        <div className="flex h-full w-full border-t" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
            <DirectoryTree nodes={nodes} selectedPath={selectedPath} onSelect={setSelectedPath} />
            <div className="flex-1 flex flex-col relative border-l overflow-hidden" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)' }}>
                <DirectoryView selectedPath={selectedPath} />
            </div>
        </div>
    );
};

export default DirectoriesPage;