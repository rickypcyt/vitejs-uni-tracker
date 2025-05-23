import { supabase } from '../utils/supabaseClient';
import {
  fetchTasksSuccess,
  addTaskSuccess,
  toggleTaskStatusOptimistic,
  updateTaskSuccess,
  deleteTaskSuccess,
  taskError
} from './TaskSlice';

// En tu archivo TaskActions.js
export const fetchTasks = () => async (dispatch) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Obtener tareas filtradas por user_id
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id); // <- Filtro clave

    if (error) throw error;

    dispatch(fetchTasksSuccess(data));
  } catch (error) {
    dispatch(taskError(error.message));
  }
};

// Acción para obtener tareas
export const addTask = (newTask) => async (dispatch) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // If no user, generate a local ID and store in localStorage
      const localTasks = JSON.parse(localStorage.getItem('localTasks') || '[]');
      const localTask = {
        ...newTask,
        id: Date.now(), // Use timestamp as local ID
        created_at: new Date().toISOString(),
        completed: false,
        activetask: false
      };
      localTasks.push(localTask);
      localStorage.setItem('localTasks', JSON.stringify(localTasks));
      return localTask;
    }

    const taskWithUser = {
      title: newTask.title,
      description: newTask.description,
      deadline: newTask.deadline,
      difficulty: newTask.difficulty,
      assignment: newTask.assignment,
      user_id: user.id, // ← Solo campos existentes en la tabla
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert([taskWithUser])
      .select();

    if (error) throw error;

    // Despachar la acción de éxito con la tarea creada
    dispatch(addTaskSuccess(data[0]));
    return data[0];
  } catch (error) {
    // Despachar la acción de error
    dispatch(taskError(error.message));
    throw error;
  }
};

// Acción para marcar como completado/no completado
export const toggleTaskStatus = (id, completed) => async (dispatch) => {
  try {
    // Actualización optimista
    dispatch(toggleTaskStatusOptimistic({ id, completed }));

    // Nueva lógica para completed_at
    const completed_at = completed ? new Date().toISOString() : null;

    const { data, error } = await supabase
      .from('tasks')
      .update({ completed, completed_at })
      .eq('id', id)
      .select();

    if (error) throw error;

    dispatch(updateTaskSuccess(data[0]));
  } catch (error) {
    // Revertir en caso de error
    dispatch(toggleTaskStatusOptimistic({ id, completed: !completed }));
    dispatch(taskError(error.message));
  }
};


// Acción para eliminar tarea
export const deleteTask = (id) => async (dispatch) => {
  try {
    // Eliminar la tarea de la base de datos
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Despachar la tarea eliminada
    dispatch(deleteTaskSuccess(id));
  } catch (error) {
    // Manejar errores
    dispatch(taskError(error.message));
  }
};

// Acción para actualizar tarea
export const updateTask = (task) => async (dispatch) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    if (!task || !task.id) {
      throw new Error('ID de tarea inválido');
    }

    // Verificar que la tarea pertenece al usuario
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select('user_id')
      .eq('id', task.id)
      .single();

    if (taskError) throw taskError;

    if (!taskData || taskData.user_id !== user.id) {
      throw new Error('No tienes permiso para editar esta tarea');
    }

    const { data, error } = await supabase
      .from('tasks')
      .update({
        title: task.title,
        description: task.description,
        deadline: task.deadline,
        completed: task.completed,
        difficulty: task.difficulty,
        assignment: task.assignment,
        activetask: task.activetask
      })
      .eq('id', task.id)
      .select();

    if (error) throw error;

    dispatch(updateTaskSuccess(data[0]));
  } catch (error) {
    dispatch(taskError(error.message));
    throw error;
  }
};

