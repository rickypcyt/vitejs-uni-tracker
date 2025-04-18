// utils/componentRegistry.ts
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import ProgressTracker from '../components/ProgressTracker';
import Calendar from '../components/Calendar';
import StudyTimer from '../components/StudyTimer';
import NoiseGenerator from '../components/NoiseGenerator';
import Statistics from '../components/Stats';
import Pomodoro from '../components/Pomodoro';
import StartSessionMenu from '../components/StartSessionMenu';

interface ComponentConfig {
  component: (props?: any) => JSX.Element;
  name: string;
  isWide: boolean;
}

export const ComponentRegistry: Record<string, ComponentConfig> = {
  TaskForm: { component: TaskForm, name: 'Task Form', isWide: false },
  TaskList: { component: TaskList, name: 'Task List', isWide: false },
  ProgressTracker: { component: ProgressTracker, name: 'Progress Tracker', isWide: false },
  Calendar: { component: Calendar, name: 'Calendar', isWide: false },
  StudyTimer: { component: StudyTimer, name: 'StudyTimer', isWide: false },
  NoiseGenerator: { component: NoiseGenerator, name: 'NoiseGenerator', isWide: false },
  Statistics: { component: Statistics, name: 'Statistics', isWide: false },
  Pomodoro: { component: Pomodoro, name: 'Pomodoro', isWide: false },
  StartSessionMenu: { component: StartSessionMenu, name: 'Start Session Menu', isWide: false }
};