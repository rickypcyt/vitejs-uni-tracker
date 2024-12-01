import React from 'react';
import { Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Box, Text, Button, Input } from "@chakra-ui/react";
import { useDispatch } from 'react-redux';
import { toggleTaskCompletion, attachPDF } from '../redux/TasksSlice';

const TaskDetails = ({ task }) => {
  const dispatch = useDispatch();

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const pdfUrl = URL.createObjectURL(file);
      dispatch(attachPDF({ taskId: task.id, pdfUrl }));
    }
  };

  const handleToggleCompletion = () => {
    // Llamar a la acción para cambiar la tarea de completada
    dispatch(toggleTaskCompletion(task.id));

    // También hacer la solicitud PUT al backend para actualizar la tarea
    fetch(`http://localhost:5000/api/tasks/${task.id}/toggle`, { method: 'PUT' })
      .then(response => response.json())
      .then(updatedTask => {
        console.log('Task updated:', updatedTask);
      })
      .catch(error => {
        console.error('Error updating task:', error);
      });
  };

  return (
    <Accordion allowToggle width="100%">
      <AccordionItem>
        <h2>
          <AccordionButton>
            <Box flex="1" textAlign="left">
              {task.completed ? '✅ ' : '⏳ '}
              {task.title}
            </Box>
            <AccordionIcon />
          </AccordionButton>
        </h2>
        <AccordionPanel pb={4}>
          <Text>Deadline: {task.deadline}</Text>
          <Text>{task.notes}</Text>
          <Button onClick={handleToggleCompletion} colorScheme={task.completed ? 'red' : 'green'}>
            {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
          </Button>
          <Input type="file" onChange={handleFileUpload} mt={2} />
          {task.pdf && (
            <a href={task.pdf} target="_blank" rel="noopener noreferrer">
              View Attached PDF
            </a>
          )}
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
};

export default TaskDetails;
