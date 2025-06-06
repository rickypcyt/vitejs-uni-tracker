import React, { memo } from 'react';
import StudyTimer from '../components/tools/StudyTimer';
import Pomodoro from '../components/tools/Pomodoro';
import NoiseGenerator from '../components/tools/NoiseGenerator';
import { useLocation } from 'react-router-dom';

const SessionPage = memo(() => {
  const location = useLocation();

  return (
    <div className="w-full px-6 pt-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pomodoro */}
        <div className="maincard">
          <Pomodoro />
        </div>

        {/* Study Timer */}
        <div className="maincard">
          <StudyTimer />
        </div>
        
        {/* Noise Generator */}
        <NoiseGenerator />
      </div>
    </div>
  );
});

SessionPage.displayName = 'SessionPage';

export default SessionPage; 