import { Check, Plus, Square, X } from 'lucide-react';
import { FormActions, FormButton, FormInput, FormTextarea } from '@/modals/FormElements';
import React, { useEffect, useState } from 'react';
import { setSyncCountdownWithTimer, setSyncPomodoroWithTimer } from '@/store/slices/uiSlice';
import { useDispatch, useSelector } from 'react-redux';

import AutocompleteInput from '@/modals/AutocompleteInput';
import BaseModal from '@/modals/BaseModal';
import TaskForm from '@/pages/tasks/TaskForm';
import TaskSelectionPanel from '@/pages/tasks/TaskSelectionPanel';
import { supabase } from '@/utils/supabaseClient';

const StartSessionModal = ({ isOpen, onClose, onStart }) => {
  const dispatch = useDispatch();
  const syncPomodoroWithTimer = useSelector(state => state.ui.syncPomodoroWithTimer);
  const syncCountdownWithTimer = useSelector(state => state.ui.syncCountdownWithTimer);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [tasks, setTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [lastAddedTaskId, setLastAddedTaskId] = useState(null);
  const [titleError, setTitleError] = useState(false);
  const [assignment, setAssignment] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [syncPomo, setSyncPomo] = useState(syncPomodoroWithTimer);
  const [syncCountdown, setSyncCountdown] = useState(syncCountdownWithTimer);

  useEffect(() => {
    if (isOpen) {
      fetchSessionTasks();
      setSessionTitle('');
      setSessionDescription('');
      setSelectedTasks([]);
      setAssignment('');
      setTitleError(false);
      fetchAssignments();
    }
  }, [isOpen]);

  useEffect(() => {
    setSyncPomo(syncPomodoroWithTimer);
    setSyncCountdown(syncCountdownWithTimer);
  }, [syncPomodoroWithTimer, syncCountdownWithTimer, isOpen]);

  useEffect(() => {
    if (lastAddedTaskId) {
      setSelectedTasks(prev => [...prev, lastAddedTaskId]);
      setLastAddedTaskId(null);
      fetchSessionTasks();
    }
  }, [lastAddedTaskId]);

  const fetchSessionTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Fetch all tasks for the user
      const { data: userTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false)
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.error('Error fetching user tasks:', tasksError);
        setTasks([]);
        setSelectedTasks([]);
        return;
      }

      setTasks(userTasks);
      // Initialize selectedTasks with tasks that are already active
      setSelectedTasks(userTasks.filter(task => task.activetask).map(task => task.id));
    } catch (error) {
      console.error('Error in fetchSessionTasks:', error);
      setTasks([]);
      setSelectedTasks([]);
    }
  };

  const fetchAssignments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('tasks')
        .select('assignment')
        .eq('user_id', user.id)
        .not('assignment', 'is', null)
        .not('assignment', 'eq', '')
        .order('assignment');
      if (error) throw error;
      setAssignments([...new Set(data.map((task) => task.assignment))]);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  // Modified function to handle task movement between columns
  const handleMoveTask = (task, toActive) => {
    setSelectedTasks(prev => {
      if (toActive) {
        // Add task ID to selectedTasks if moving to active column
        if (!prev.includes(task.id)) {
          return [...prev, task.id];
        }
      } else {
        // Remove task ID from selectedTasks if moving to available column
        return prev.filter(id => id !== task.id);
      }
      return prev; // Return previous state if no change
    });
  };

  const handleTaskFormClose = (newTaskId) => {
    setShowTaskForm(false);
    if (newTaskId) {
      setLastAddedTaskId(newTaskId);
    }
  };

  const handleStart = async () => {
    if (!sessionTitle.trim()) {
      setTitleError(true);
      return;
    }

    setTitleError(false);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Get today's date for session number calculation
      const today = new Date().toISOString().split("T")[0];
      console.log('Fetching latest session for date:', today);

      const { data: latestSession, error: latestSessionError } = await supabase
        .from('study_laps')
        .select('session_number')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .order('session_number', { ascending: false })
        .limit(1)
        .single();

      if (latestSessionError && latestSessionError.code !== 'PGRST116') throw latestSessionError;

      // Calculate next session number
      const nextSessionNumber = latestSession ? Number(latestSession.session_number) + 1 : 1;
      console.log('Creating new session with number:', nextSessionNumber);

      // Check if a session with this title already exists today
      const { data: existingSession, error: checkError } = await supabase
        .from('study_laps')
        .select('id')
        .eq('name', sessionTitle.trim())
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking for existing session:', checkError);
      }

      if (existingSession) {
        console.warn('Session with this title already exists today:', existingSession);
        return;
      }

      // Create the new session
      const { data: session, error: sessionError } = await supabase
        .from('study_laps')
        .insert([{
          user_id: user.id,
          started_at: new Date().toISOString(),
          tasks_completed: 0, // Will be updated on finish
          name: sessionTitle.trim(),
          description: sessionDescription.trim(),
          session_number: nextSessionNumber,
          created_at: new Date().toISOString(),
          session_assignment: assignment || null,
        }])
        .select()
        .single();

      if (sessionError) throw sessionError;
      console.log('Successfully created new session:', session.id);

      // Link selected tasks to the new session and set activetask to true
      if (selectedTasks.length > 0) {
        // Insert links into session_tasks table
        const { error: sessionTasksError } = await supabase
          .from('session_tasks')
          .insert(
            selectedTasks.map(taskId => ({
              session_id: session.id,
              task_id: taskId,
              completed_at: null // Not completed when session starts
            }))
          );

        if (sessionTasksError) throw sessionTasksError;

        // Update activetask status for selected tasks
        const { error: updateTasksError } = await supabase
          .from('tasks')
          .update({ activetask: true })
          .in('id', selectedTasks);

        if (updateTasksError) {
          console.error('Error updating tasks activetask status:', updateTasksError);
        }
      }

      // Pass the created session details back to StudyTimer
      onStart({
        sessionId: session.id,
        tasks: selectedTasks,
        title: sessionTitle.trim(),
        syncPomo,
        syncCountdown
      });

      // Close the modal after successful session start
      onClose();

    } catch (error) {
      console.error('Error starting session:', error);
      // Optionally show a toast or error message
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Start New Session"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-2 mb-4">
            <div className="flex-1">
              <label htmlFor="sessionTitle" className="block text-base font-bold text-[var(--text-primary)] mb-2 text-center md:text-left">
                Title
              </label>
              <FormInput
                id="sessionTitle"
                value={sessionTitle}
                onChange={setSessionTitle}
                error={titleError ? 'Title is required' : ''}
                required
                placeholder="Enter session title"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="assignment" className="block text-base font-bold text-[var(--text-primary)] mb-2 text-center md:text-left">
                Assignment (optional)
              </label>
              <AutocompleteInput
                id="assignment"
                value={assignment}
                onChange={setAssignment}
                placeholder="Enter assignment name"
                suggestions={assignments}
              />
            </div>
          </div>
          <label htmlFor="sessionDescription" className="block text-base font-bold text-[var(--text-primary)] mb-2 text-center">
            Description (Optional)
          </label>
          <FormTextarea
            id="sessionDescription"
            value={sessionDescription}
            onChange={setSessionDescription}
            placeholder="Enter session description"
          />
        </div>
        {/* Controles de sincronización */}
        <div className="flex flex-col gap-1 mt-2">
          <button
            type="button"
            onClick={() => setSyncPomo((v) => !v)}
            className="flex items-center justify-between w-full gap-2 px-2 py-1 rounded-lg bg-transparent hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer text-[var(--text-secondary)] text-sm select-none"
          >
            <span>Start pomodoro at the same time</span>
            {syncPomo ? <Check size={20} style={{ color: "var(--accent-primary)" }} /> : <Square size={20} style={{ color: "var(--accent-primary)" }} />}
          </button>
          <button
            type="button"
            onClick={() => setSyncCountdown((v) => !v)}
            className="flex items-center justify-between w-full gap-2 px-2 py-1 rounded-lg bg-transparent hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer text-[var(--text-secondary)] text-sm select-none"
          >
            <span>Start countdown at the same time</span>
            {syncCountdown ? <Check size={20} style={{ color: "var(--accent-primary)" }} /> : <Square size={20} style={{ color: "var(--accent-primary)" }} />}
          </button>
        </div>

        <TaskSelectionPanel
          activeTasks={tasks.filter(task => selectedTasks.includes(task.id))}
          availableTasks={tasks.filter(task => !selectedTasks.includes(task.id))}
          onMoveTask={handleMoveTask}
          onAddTask={() => setShowTaskForm(true)}
          selectedTasks={selectedTasks}
          onTaskSelect={id => handleMoveTask(tasks.find(t => t.id === id), true)}
          mode="move"
          showNewTaskButton={true}
          maxHeight="350px"
          activeTitle={<span className="font-bold text-center block">Active Tasks</span>}
          availableTitle={<span className="font-bold text-center block">Available Tasks</span>}
          hideAssignmentAndDescriptionAvailable={true}
        />

        <FormActions>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-md border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] font-semibold bg-transparent hover:bg-[var(--accent-primary)]/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStart}
            className="px-6 py-2 rounded-md border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] font-semibold bg-transparent hover:bg-[var(--accent-primary)]/10 transition-colors"
          >
            Start Session
          </button>
        </FormActions>
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          onClose={handleTaskFormClose}
          onTaskCreated={(newTaskId) => {
            fetchSessionTasks();
            setSelectedTasks(prev => [...prev, newTaskId]);
          }}
        />
      )}
    </BaseModal>
  );
};

export default StartSessionModal; 