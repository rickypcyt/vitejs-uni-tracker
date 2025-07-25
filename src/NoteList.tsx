import { Calendar, Pencil, Trash2 } from 'lucide-react';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/hooks/useAuth';

interface Note {
  id?: string;
  title: string;
  assignment: string;
  description: string;
  date: string;
  user_id?: string;
}

interface NoteListProps {
  notes: Note[];
  loading: boolean;
  error: string | null;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
  editingId: string | null;
  editForm: React.ReactNode;
}

const NoteList: React.FC<NoteListProps> = ({ notes, loading, error, onEdit, onDelete, editingId, editForm }) => {
  const { isLoggedIn } = useAuth();
  // Solo mostrar el spinner si loading y aún no se sabe si hay notas (notes.length === 0)
  if (loading && notes.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)] mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Loading notes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-red-500 mb-4">{error}</div>
          <p className="text-[var(--text-secondary)]">Failed to load notes</p>
        </div>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Pencil className="mx-auto mb-4 w-10 h-10 text-[var(--accent-primary)]" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No notes yet</h3>
          <p className="text-[var(--text-secondary)]">Create your first note to get started</p>
          {!isLoggedIn && (
            <p className="text-sm text-[var(--text-secondary)] opacity-70 mt-2">
              Remember to login first
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="py-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {notes.map((note) => (
          <div
            key={note.id || note.title + note.date}
            className="relative flex flex-col bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-[var(--accent-primary)]/70 transition-all duration-200 group min-h-[260px]"
            onDoubleClick={() => onEdit(note)}
            tabIndex={0}
            role="button"
            aria-label="Edit note"
          >
            {/* Card Header */}
            <div className="mb-2 flex flex-col gap-1">
              <h3 className="font-semibold text-lg text-[var(--text-primary)] truncate mb-1">
                {note.title}
              </h3>
              {note.assignment && (
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] max-w-full truncate">
                  {note.assignment}
                </span>
              )}
            </div>

            {/* Card Content */}
            <div className="mb-3 flex-1 overflow-hidden">
              <div
                className="text-[var(--text-secondary)] text-sm prose prose-sm prose-invert max-w-none max-h-48 flow-y-auto custom-scrollbar bg-transparent p-0 border-0 shadow-none rounded-none"
                style={{ border: 'none', borderRadius: 0, background: 'transparent', boxShadow: 'none', padding: 0 }}
                dangerouslySetInnerHTML={{ __html: note.description }}
              />
            </div>

            {/* Card Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-primary)] mt-auto">
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <Calendar size={14} />
                <span>{new Date(note.date).toLocaleDateString()}</span>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  className="p-2 rounded-lg text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"
                  onClick={() => onEdit(note)}
                  aria-label="Edit note"
                  title="Edit"
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                  onClick={() => onDelete(note)}
                  aria-label="Delete note"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            {/* Edit Form Overlay */}
            {editingId === note.id && (
              <div className="absolute inset-0 bg-[var(--bg-primary)]/95 backdrop-blur-sm rounded-xl p-4 z-10 flex items-center justify-center">
                {editForm}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NoteList; 