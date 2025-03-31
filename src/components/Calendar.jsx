import { useState, useEffect } from "react";
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { motion } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { useTaskForm } from "../redux/useTaskForm";
import { X, ChevronLeft, ChevronRight, Save, Trash2, Play, Circle, CheckCircle2 } from "lucide-react";
import { updateTask, deleteTask, toggleTaskStatus } from "../redux/TaskActions";

const localizer = momentLocalizer(moment);

const CustomToolbar = (toolbar) => {
  const goToBack = () => {
    toolbar.onNavigate('PREV');
  };

  const goToNext = () => {
    toolbar.onNavigate('NEXT');
  };

  return (
    <div className="rbc-toolbar flex items-center justify-center">
      <div className="flex items-center gap-4">
        <button onClick={goToBack} className="hover:bg-bg-tertiary p-2 rounded-lg">
          <ChevronLeft size={24} />
        </button>
        <span className="text-lg">{toolbar.label}</span>
        <button onClick={goToNext} className="hover:bg-bg-tertiary p-2 rounded-lg">
          <ChevronRight size={24} />
        </button>
      </div>

    </div>
  );
};

{/* <div className="flex gap-2">
  <button
    onClick={() => toolbar.onView('month')}
    className={toolbar.view === 'month' ? 'rbc-active' : ''}
  >
    Month
  </button>
  <button
    onClick={() => toolbar.onView('week')}
    className={toolbar.view === 'week' ? 'rbc-active' : ''}
  >
    Week
  </button>
  <button
    onClick={() => toolbar.onView('day')}
    className={toolbar.view === 'day' ? 'rbc-active' : ''}
  >
    Day
  </button>
  <button
    onClick={() => toolbar.onView('agenda')}
    className={toolbar.view === 'agenda' ? 'rbc-active' : ''}
  >
    Agenda
  </button>
</div> */}

const CustomEvent = ({ event, view, onSelectTask }) => {
  const handleClick = (e) => {
    e.stopPropagation();
    onSelectTask(event.taskId);
  };

  return (
    <div className="task-dot" onClick={handleClick}>
      <span className="sr-only">{event.title}</span>
    </div>
  );
};

const CustomDayPropGetter = (date) => {
  return {
    className: 'custom-day-cell',
    style: {}
  };
};

const Calendar = () => {
  const dispatch = useDispatch();
  const tasks = useSelector((state) => state.tasks.tasks);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(null);

  const {
    newTask,
    error,
    handleSubmit,
    updateField,
    setNewTask,
  } = useTaskForm("");

  const handleSelectTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setEditedTask({
        id: task.id,
        title: task.title,
        description: task.description || '',
        deadline: task.deadline,
        completed: task.completed,
        difficulty: task.difficulty,
        assignment: task.assignment || '',
        activetask: task.activetask || false,
        user_id: task.user_id
      });
      setIsEditing(true);
    }
  };

  const handleEditChange = (field, value) => {
    setEditedTask(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveEdit = async () => {
    try {
      await dispatch(updateTask(editedTask));
      setSelectedTask(editedTask);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await dispatch(deleteTask(taskId));
      setSelectedTask(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleToggleCompletion = async (task) => {
    try {
      await dispatch(toggleTaskStatus(task.id, !task.completed));
      setSelectedTask({ ...task, completed: !task.completed });
      setEditedTask(prev => ({ ...prev, completed: !task.completed }));
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  // Filtrar tareas incompletas y asignar índices
  const incompleteTasks = tasks
    .filter(task => !task.completed)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  // Agrupar tareas por fecha
  const tasksByDate = incompleteTasks.reduce((acc, task) => {
    const date = task.deadline;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(task);
    return acc;
  }, {});

  // Crear eventos agrupados
  const events = Object.entries(tasksByDate).map(([date, tasks]) => ({
    title: tasks.map(t => t.title).join(', '),
    description: tasks.map(t => t.description).join('\n'),
    start: new Date(date),
    end: new Date(date),
    allDay: true,
    color: "#0466C8",
    taskId: tasks[0].id, // Usar el ID de la primera tarea para el clic
    tasks: tasks // Guardar todas las tareas del día
  }));

  const handleDayClick = (slotInfo) => {
    const dateString = moment(slotInfo.start).format("YYYY-MM-DD");
    setSelectedDate(slotInfo.start);
    updateField("deadline", dateString);
    setShowModal(true);
  };

  const handleCalendarSubmit = async (e) => {
    const success = await handleSubmit(e);
    if (success) {
      setShowModal(false);
      setNewTask({ title: "", description: "", deadline: "" });
    }
  };

  // Handle escape key to close modals
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        if (selectedTask) {
          setSelectedTask(null);
        } else if (showModal) {
          setShowModal(false);
        }
      }
    };

    if (selectedTask || showModal) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [selectedTask, showModal]);

  return (
    <div className="maincard relative">
      <div style={{ display: showModal || selectedTask ? 'none' : 'block' }}>
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "500px", borderRadius: "10px" }}
          selectable
          onSelectSlot={handleDayClick}
          className="dark-calendar"
          components={{
            toolbar: CustomToolbar,
            event: (props) => <CustomEvent {...props} onSelectTask={handleSelectTask} />
          }}
          views={{
            month: true,
            week: false,
            day: false,
            agenda: false
          }}
          formats={{
            timeGutterFormat: () => '',
            dayFormat: 'ddd DD',
            eventTimeRangeFormat: () => ''
          }}
          dayPropGetter={CustomDayPropGetter}
          onSelectEvent={(event) => {
            setHoveredEvent(event);
            handleSelectTask(event.taskId);
          }}
          onNavigate={() => setHoveredEvent(null)}
        />
      </div>

      {hoveredEvent && !showModal && !selectedTask && (
        <div className="absolute bg-neutral-900 p-4 rounded-lg shadow-lg z-50 max-w-xs border border-neutral-800">
          <div className="text-lg text-neutral-300 mb-2">
            Tasks for {moment(hoveredEvent.start).format("LL")}
          </div>
          {hoveredEvent.tasks.map((task, index) => (
            <div key={task.id} className="mb-2">
              <div className="font-medium text-neutral-200">
                {task.title}
              </div>
              {task.description && (
                <div className="text-lg text-neutral-400">
                  {task.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedTask && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              if (isEditing) {
                setIsEditing(false);
                setEditedTask(null);
              } else {
                setSelectedTask(null);
              }
            }
          }}
        >
          <div className="maincard max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-center flex-1">
                Task Details
              </h3>
              <button
                className="text-gray-400 hover:text-white transition duration-200"
                onClick={() => {
                  if (isEditing) {
                    setIsEditing(false);
                    setEditedTask(null);
                  } else {
                    setSelectedTask(null);
                  }
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-text-primary mb-2">Title</h4>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedTask.title}
                    onChange={(e) => handleEditChange('title', e.target.value)}
                    className="textinput w-full"
                  />
                ) : (
                  <p className="text-text-secondary">{selectedTask.title}</p>
                )}
              </div>

              <div>
                <h4 className="text-lg font-semibold text-text-primary mb-2">Description</h4>
                {isEditing ? (
                  <textarea
                    value={editedTask.description || ''}
                    onChange={(e) => handleEditChange('description', e.target.value)}
                    className="textinput w-full"
                    rows="4"
                  />
                ) : (
                  <p className="text-text-secondary whitespace-pre-wrap">{selectedTask.description || 'No description'}</p>
                )}
              </div>

              <div>
                <h4 className="text-lg font-semibold text-text-primary mb-2">Status</h4>
                <p className="text-text-secondary">
                  {selectedTask.completed ? 'Completed' : 'Pending'}
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-text-primary mb-2">Difficulty</h4>
                {isEditing ? (
                  <select
                    value={editedTask.difficulty}
                    onChange={(e) => handleEditChange('difficulty', e.target.value)}
                    className="textinput w-full"
                  >
                    <option value="easy" className="text-green-500">Easy</option>
                    <option value="medium" className="text-blue-500">Medium</option>
                    <option value="hard" className="text-red-500">Hard</option>
                  </select>
                ) : (
                  <p className={`text-text-secondary ${selectedTask.difficulty === 'easy' ? 'text-green-500' :
                    selectedTask.difficulty === 'medium' ? 'text-blue-500' :
                      'text-red-500'
                    }`}>
                    {selectedTask.difficulty.charAt(0).toUpperCase() + selectedTask.difficulty.slice(1)}
                  </p>
                )}
              </div>

              <div>
                <h4 className="text-lg font-semibold text-text-primary mb-2">Assignment</h4>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedTask.assignment || ''}
                    onChange={(e) => handleEditChange('assignment', e.target.value)}
                    className="textinput w-full"
                    placeholder="Enter assignment name"
                  />
                ) : (
                  <p className="text-text-secondary">
                    {selectedTask.assignment || 'No assignment'}
                  </p>
                )}
              </div>

              <div>
                <h4 className="text-lg font-semibold text-text-primary mb-2">Deadline</h4>
                {isEditing ? (
                  <input
                    type="date"
                    value={editedTask.deadline}
                    onChange={(e) => handleEditChange('deadline', e.target.value)}
                    className="textinput w-full"
                  />
                ) : (
                  <p className="text-text-secondary">
                    {new Date(selectedTask.deadline).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                )}
              </div>

              <div>
                <h4 className="text-lg font-semibold text-text-primary mb-2">Created At</h4>
                <p className="text-text-secondary">
                  {moment(selectedTask.created_at).format('MMMM D, YYYY h:mm A')}
                </p>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => handleDeleteTask(selectedTask.id)}
                  className="text-red-500 hover:text-red-600 transition-colors duration-200 flex items-center gap-2"
                >
                  <Trash2 size={20} />
                  Delete Task
                </button>
                {selectedTask.activetask ? (
                  <button
                    onClick={() => {
                      const updatedTask = { ...selectedTask, activetask: false };
                      dispatch(updateTask(updatedTask));
                      setSelectedTask(null);
                    }}
                    className="text-gray-400 hover:text-gray-300 transition-colors duration-200 flex items-center gap-2"
                  >
                    <Play size={20} className="rotate-180" />
                    Deactivate Task
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const updatedTask = { ...selectedTask, activetask: true };
                      dispatch(updateTask(updatedTask));
                      setSelectedTask(null);
                    }}
                    className="text-gray-400 hover:text-gray-300 transition-colors duration-200 flex items-center gap-2"
                  >
                    <Play size={20} />
                    Set as Active Task
                  </button>
                )}
                <button
                  onClick={() => handleToggleCompletion(selectedTask)}
                  className="text-gray-400 hover:text-gray-300 transition-colors duration-200 flex items-center gap-2"
                >
                  {selectedTask.completed ? (
                    <>
                      <Circle size={20} />
                      Mark as Incomplete
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={20} />
                      Mark as Complete
                    </>
                  )}
                </button>
                {isEditing ? (
                  <button
                    onClick={handleSaveEdit}
                    className="text-green-500 hover:text-green-600 transition-colors duration-200 flex items-center gap-2"
                  >
                    <Save size={20} />
                    Save Changes
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-blue-500 hover:text-blue-600 transition-colors duration-200 flex items-center gap-2"
                  >
                    Edit Task
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {showModal && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 backdrop-blur-sm"
        >
          <div className="maincard">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-white transition duration-200"
              onClick={() => setShowModal(false)}
            >
              <X size={24} />
            </button>
            <h3 className="text-2xl font-bold mb-6 text-center">
              New Task for{" "}
              <span className="text-blue-400">
                {moment(selectedDate).format("LL")}
              </span>
            </h3>

            {error && (
              <div className="text-red-400 mb-4 text-center font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCalendarSubmit} className="space-y-5">
              <input
                type="text"
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) => updateField("title", e.target.value)}
                required
                className="textinput"
              />

              <textarea
                placeholder="Description (optional)"
                value={newTask.description}
                onChange={(e) => updateField("description", e.target.value)}
                className="textinput"
                rows="4"
              />

              <input
                type="date"
                value={newTask.deadline}
                disabled
                className="textinput"
              />

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  className="cancelbutton"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Calendar;
