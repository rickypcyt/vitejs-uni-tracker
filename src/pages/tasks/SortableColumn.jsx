import { ChevronDown, ChevronUp, ListOrdered, Plus } from 'lucide-react';

import ColumnDropdownMenu from '@/components/ColumnDropdownMenu';
import React from 'react';
import { TaskItem } from '@/pages/tasks/TaskItem';

export const SortableColumn = ({
  id,
  assignment,
  tasks,
  collapsed,
  onToggleCollapse,
  onAddTask,
  onTaskToggle,
  onTaskDelete,
  onEditTask,
  onTaskContextMenu,
  onSortClick,
  onColumnMenuClick,
  columnMenu,
  onCloseColumnMenu,
  onMoveToWorkspace,
}) => {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between w-full mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            onClick={onToggleCollapse}
            className="flex items-center justify-center p-1 hover:bg-neutral-700/50 rounded-lg transition-colors flex-shrink-0"
          >
            {collapsed ? (
              <ChevronDown size={20} className="text-neutral-400 hover:text-neutral-200 transition-transform duration-200" />
            ) : (
              <ChevronUp size={20} className="text-neutral-400 hover:text-neutral-200 transition-transform duration-200" />
            )}
          </button>
          <h3 className="font-medium text-lg text-[var(--text-primary)] group-hover:text-[var(--text-primary)] truncate">
            {assignment}
          </h3>
          <span className="text-base text-[var(--text-secondary)] flex-shrink-0">
            ({tasks.length})
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <button
            onClick={onAddTask}
            className="p-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] transition-all duration-200 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:scale-105 active:scale-95"
            title="Add task"
          >
            <Plus size={22} />
          </button>
          <button
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              onSortClick(assignment, { x: rect.left, y: rect.bottom });
            }}
            className="p-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] transition-all duration-200 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:scale-105 active:scale-95"
            title="Sort tasks"
          >
            <ListOrdered size={22} />
          </button>
          
          {/* Radix UI Dropdown Menu */}
          <ColumnDropdownMenu
            assignment={assignment}
            tasks={tasks}
            onMoveToWorkspace={onMoveToWorkspace}
            columnMenu={columnMenu}
          />
        </div>
      </div>

      
      {!collapsed && (
        <div
          className={
            `space-y-2 overflow-y-auto flex-1 min-h-0 custom-scrollbar pr-1`
          }
        >
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleCompletion={onTaskToggle}
              onDelete={onTaskDelete}
              onEditTask={onEditTask}
              onContextMenu={(e) => onTaskContextMenu(e, task)}
              assignmentId={id}
              active={!!task.activetask}
            />
          ))}
        </div>
      )}

      {/* Column Menu - Mantenemos el menú original para compatibilidad */}
      {columnMenu && (
        <ColumnMenu
          x={columnMenu.x}
          y={columnMenu.y}
          assignment={assignment}
          onAddTask={onAddTask}
          onSortClick={onSortClick}
          onToggleCollapse={onToggleCollapse}
          onClose={onCloseColumnMenu}
          collapsed={collapsed}
          tasks={tasks}
        />
      )}
    </div>
  );
}; 