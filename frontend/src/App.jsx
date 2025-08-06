import React, { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import LogForm from './components/LogForm';
import FlowerScreen from './components/FlowerScreen';
import DaySummaryScreen from './components/DaySummaryScreen';
import WeekView from './components/WeekView';
import WeekSummaryScreen from './components/WeekSummaryScreen'; // Import the WeekSummaryScreen

function App() {
  const [currentScreen, setCurrentScreen] = useState('home'); // Add 'weekSummary' to possible screens
  const [logData, setLogData] = useState(null);
  const [selectedWeekLogData, setSelectedWeekLogData] = useState(null);

  const handleLogYourDay = () => {
    setCurrentScreen('logForm');
  };

  const handleTrackProgress = () => {
    setCurrentScreen('weekView');
  };

  const handleExit = () => {
    // For web applications, we can't actually close the app
    // But we can show a confirmation dialog or redirect
    if (window.confirm('Are you sure you want to exit Shichi?')) {
      // In a web browser, we can try to close the tab/window
      // This only works if the window was opened by JavaScript
      window.close();
      
      // If window.close() doesn't work (most modern browsers), 
      // we could redirect to a goodbye page or back to home
      // window.location.href = 'about:blank';
    }
  };

  const handleLogSubmit = (data) => {
    setLogData(data);
    setCurrentScreen('flower');
  };

  const handleFlowerClick = () => {
    setCurrentScreen('summary');
  };

  const handleWeekFlowerClick = (weekLogData) => {
    // When a flower is clicked from WeekView, show its data in FlowerScreen
    setSelectedWeekLogData(weekLogData);
    setLogData(weekLogData);
    setCurrentScreen('flower');
  };

  // NEW: Handle week summary navigation
  const handleWeekSummaryClick = () => {
    setCurrentScreen('weekSummary');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
    // Reset data when going back to home
    setLogData(null);
    setSelectedWeekLogData(null);
  };

  const handleBackToFlower = () => {
    setCurrentScreen('flower');
  };

  const handleBackToWeek = () => {
    setCurrentScreen('weekView');
  };

  // NEW: Handle back to week view from week summary
  const handleBackToWeekView = () => {
    setCurrentScreen('weekView');
  };

  // Render the appropriate screen based on current state
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <HomeScreen
            onLogYourDay={handleLogYourDay}
            onTrackProgress={handleTrackProgress}
            onExit={handleExit}
          />
        );
       
      case 'logForm':
        return (
          <LogForm 
            onSubmit={handleLogSubmit}
            onBack={handleBackToHome}
          />
        );
        
      case 'flower':
        return (
          <FlowerScreen 
            logData={logData}
            onBackToHome={selectedWeekLogData ? handleBackToWeek : handleBackToHome}
            onFlowerClick={handleFlowerClick}
          />
        );
        
      case 'summary':
        return (
          <DaySummaryScreen
            logData={logData}
            onBackToFlower={handleBackToFlower}
          />
        );
       
      case 'weekView':
        return (
          <WeekView
            onBackToHome={handleBackToHome}
            onFlowerClick={handleWeekFlowerClick}
            onWeekSummaryClick={handleWeekSummaryClick} // Pass the week summary handler
          />
        );
        
      // NEW: Add the week summary screen case
      case 'weekSummary':
        return (
          <WeekSummaryScreen
            onBackToWeekView={handleBackToWeekView}
          />
        );
        
      default:
        return (
          <HomeScreen
            onLogYourDay={handleLogYourDay}
            onTrackProgress={handleTrackProgress}
            onExit={handleExit}
          />
        );
    }
  };

  return (
    <div className="min-h-screen w-full">
      {renderCurrentScreen()}
    </div>
  );
}

export default App;