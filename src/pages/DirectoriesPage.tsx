import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { DirectoryListItem } from '../types/directory';
import DirectorySidebar from '../components/directories/DirectorySidebar';
import DirectoryView from '../components/directories/DirectoryView';

const DirectoriesPage: React.FC = () => {
    const [directories, setDirectories] = useState<DirectoryListItem[]>([]);
    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const selectedDirectory = directories.find((item) => item.path === selectedPath) ?? null;
    const childDirectories = selectedPath
        ? directories.filter((item) => item.parent_path === selectedPath)
        : [];

    useEffect(() => {
        const fetchDirectories = async () => {
            setLoading(true);
            setError(null);
            try {
                const list = await invoke<DirectoryListItem[]>('get_directories_flat');
                setDirectories(list);

                const rememberedPath = sessionStorage.getItem('directories.selectedPath');
                const rememberedExists = rememberedPath
                    ? list.some((item) => item.path === rememberedPath)
                    : false;

                if (rememberedExists && rememberedPath) {
                    setSelectedPath(rememberedPath);
                } else if (list.length > 0) {
                    setSelectedPath(list[0].path);
                }
            } catch (err) {
                console.error('Failed to load directory list', err);
                setError('No se pudo cargar el listado de carpetas.');
            } finally {
                setLoading(false);
            }
        };
        fetchDirectories();
    }, []);

    useEffect(() => {
        if (!selectedPath) {
            return;
        }
        sessionStorage.setItem('directories.selectedPath', selectedPath);
    }, [selectedPath]);

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

    if (directories.length === 0) {
        return (
            <div className="flex h-full w-full items-center justify-center" style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
                No hay carpetas indexadas todavía.
            </div>
        );
    }

    return (
        <div className="flex h-full w-full border-t" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
            <DirectorySidebar directories={directories} selectedPath={selectedPath} onSelect={setSelectedPath} />
            <div className="flex-1 flex flex-col relative border-l overflow-hidden" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)' }}>
                <DirectoryView
                    selectedPath={selectedPath}
                    selectedDirectory={selectedDirectory}
                    childDirectories={childDirectories}
                    onSelectDirectory={setSelectedPath}
                />
            </div>
        </div>
    );
};

export default DirectoriesPage;