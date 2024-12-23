import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { useSelector } from "react-redux";
import "./Calendar.css"; // Import the CSS file for styling

// Calendar component to display tasks with deadlines
const Calendar = () => {
  // Use the useSelector hook to select the tasks from the Redux state
  const tasks = useSelector((state) => state.tasks.tasks);

  // Filter tasks that have a deadline and map them to calendar events
  const events = tasks
    .filter((task) => task.deadline) // Only include tasks with a deadline
    .map((task) => ({
      title: task.title, // Use the task title as the event title
      date: task.deadline, // Use the task deadline as the event date
    }));

  return (
    // Container for the calendar
    <div className="calendar-container">
      <FullCalendar
        // Plugins required for the calendar functionality
        plugins={[dayGridPlugin]}
        // Initial view of the calendar (month view in this case)
        initialView="dayGridMonth"
        // Events to be displayed on the calendar
        events={events}
        // Set the height of the calendar to auto-adjust based on content
        height="auto"
        // Set the content height for better appearance
        contentHeight={500}
      />
    </div>
  );
};

// Export the Calendar component as the default export
export default Calendar;
