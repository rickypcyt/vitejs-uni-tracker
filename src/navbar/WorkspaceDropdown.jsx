import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

import { BookOpen, Briefcase, Check, ChevronDown, Coffee, Edit, FolderOpen, Gamepad2, Heart, Home, Music, Network, Plane, Plus, Settings, Settings as SettingsIcon, Share, ShoppingBag, Smartphone, Star, Target, Trophy, Umbrella, User, Users, Wifi, Workflow, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import ManageWorkspacesModal from '@/modals/ManageWorkspacesModal';
import ShareWorkspaceModal from '@/modals/ShareWorkspaceModal';
import WorkspaceCreateModal from '@/modals/WorkspaceCreateModal';
import { supabase } from '@/utils/supabaseClient';
import { useSelector } from 'react-redux';

const iconOptions = {
  Briefcase,
  FolderOpen,
  Home,
  Settings,
  User,
  Users,
  Zap,
  BookOpen,
  Coffee,
  Gamepad2,
  Heart,
  Music,
  Plane,
  ShoppingBag,
  Smartphone,
  Star,
  Target,
  Trophy,
  Umbrella,
  Wifi,
  Workflow,
};

// Key para localStorage
const LAST_WORKSPACE_KEY = 'lastSelectedWorkspaceId';

const WorkspaceDropdown = ({
  workspaces = [],
  activeWorkspace,
  onSelectWorkspace,
  onCreateWorkspace,
  onEditWorkspace,
  onDeleteWorkspace,
  friends,
  onOpenSettings // <-- nueva prop
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const user = useSelector(state => state.auth.user);

  const getTaskCountByWorkspace = ws => ws.taskCount || 0;

  // Restaurar workspace seleccionado al montar
  useEffect(() => {
    if (!activeWorkspace && workspaces.length > 0) {
      const lastId = localStorage.getItem(LAST_WORKSPACE_KEY);
      if (lastId) {
        const found = workspaces.find(ws => ws.id === lastId);
        if (found) {
          onSelectWorkspace(found);
        }
      }
    }
  }, [workspaces, activeWorkspace, onSelectWorkspace]);

  const handleShareWorkspace = async (workspaceId, receivedBy, sharedBy, { onSuccess, onError }) => {
    try {
      const { error } = await supabase
        .from('shared_workspaces')
        .insert([{ workspace_id: workspaceId, shared_by: sharedBy, received_by: receivedBy }]);
      if (error) {
        onError && onError(error.message);
        return;
      }
      onSuccess && onSuccess();
    } catch (err) {
      onError && onError(err.message);
    }
  };

  // Si friends no está definido, muestra advertencia
  if (!friends) {
    console.warn('WorkspaceDropdown: friends prop is missing. The autocomplete for friends will be empty.');
  }

  // Envolver onSelectWorkspace para guardar en localStorage
  const handleSelectWorkspace = (ws) => {
    localStorage.setItem(LAST_WORKSPACE_KEY, ws.id);
    console.log(`Workspace changed: saved workspace id ${ws.id} to localStorage`);
    onSelectWorkspace(ws);
  };

  return (
    <>
      {/* Desktop Dropdown */}
      <div className="hidden lg:block">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2 rounded-md transition-colors border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)]">
              {(() => {
                const IconComp = iconOptions[activeWorkspace?.icon] || Briefcase;
                return <IconComp size={18} />;
              })()}
              <span className="font-medium truncate max-w-[100px]">{activeWorkspace?.name || 'Workspace'}</span>
              <ChevronDown size={16} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="min-w-[200px] rounded-lg p-1 w-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] z-[10000] animate-in fade-in0 zoom-in-95" sideOffset={5} align="end" collisionPadding={10}>
              {[...workspaces].sort((a, b) => a.name.localeCompare(b.name)).map(ws => (
                <DropdownMenu.Item
                  key={ws.id}
                  onClick={() => handleSelectWorkspace(ws)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer outline-none transition-colors ${activeWorkspace?.id === ws.id ? 'text-[var(--accent-primary)] font-semibold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'}`}
                >
                  {(() => {
                    const IconComp = iconOptions[ws.icon] || Briefcase;
                    return <IconComp size={14} />;
                  })()}
                  <span className="flex-1">{ws.name} <span className="text-xs text-[var(--text-secondary)]">({getTaskCountByWorkspace(ws)})</span></span>
                  {activeWorkspace?.id === ws.id && <Check size={14} className="text-[var(--accent-primary)]" />}
                </DropdownMenu.Item>
              ))}
              <DropdownMenu.Separator className="h-px bg-[var(--border-primary)] my-1" />
              <DropdownMenu.Item
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
              >
                <Plus size={14} />
                New workspace
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onClick={() => setShowManageModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
              >
                <Edit size={14} />
                Edit workspaces
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
              >
                <Share size={14} />
                Share workspace
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="h-px bg-[var(--border-primary)] my-1" />
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
      {/* Mobile Dropdown */}
      <div className="lg:hidden flex-shrink-0">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:outline-none p-2 rounded-lg">
              {(() => {
                const IconComp = iconOptions[activeWorkspace?.icon] || Briefcase;
                return <IconComp size={24} />;
              })()}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="min-w-[200px] rounded-lg p-1 w-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] z-[10000] animate-in fade-in0 zoom-in-95" sideOffset={5} align="end" collisionPadding={10}>
              {[...workspaces].sort((a, b) => a.name.localeCompare(b.name)).map(ws => (
                <DropdownMenu.Item
                  key={ws.id}
                  onClick={() => handleSelectWorkspace(ws)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer outline-none transition-colors ${activeWorkspace?.id === ws.id ? 'text-[var(--accent-primary)] font-semibold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'}`}
                >
                  {(() => {
                    const IconComp = iconOptions[ws.icon] || Briefcase;
                    return <IconComp size={14} />;
                  })()}
                  <span className="flex-1">{ws.name} <span className="text-xs text-[var(--text-secondary)]">({getTaskCountByWorkspace(ws)})</span></span>
                  {activeWorkspace?.id === ws.id && <Check size={14} className="text-[var(--accent-primary)]" />}
                </DropdownMenu.Item>
              ))}
              <DropdownMenu.Separator className="h-px bg-[var(--border-primary)] my-1" />
              <DropdownMenu.Item
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
              >
                <Plus size={14} />
                New workspace
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onClick={() => setShowManageModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
              >
                <Edit size={14} />
                Edit workspaces
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 hover:bg-[var(--bg-primary)] rounded-md cursor-pointer outline-none transition-colors"
              >
                <Share size={14} />
                Share workspace
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="h-px bg-[var(--border-primary)] my-1" />
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
      {/* Modals */}
      <WorkspaceCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onWorkspaceCreated={onCreateWorkspace}
      />
      <ManageWorkspacesModal
        isOpen={showManageModal}
        onClose={() => setShowManageModal(false)}
        workspaces={workspaces}
        onWorkspaceUpdated={onEditWorkspace}
        onWorkspaceDeleted={onDeleteWorkspace}
      />
      {showShareModal && (
        <ShareWorkspaceModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          workspaces={workspaces}
          friends={friends}
          currentUserId={user?.id}
          onShare={handleShareWorkspace}
        />
      )}
    </>
  );
};

export default WorkspaceDropdown; 