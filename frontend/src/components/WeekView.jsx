import React, { useState, useEffect } from 'react';

function WeekView({ onBackToHome, onFlowerClick, onWeekSummaryClick }) {
  const [weekData, setWeekData] = useState([]);
  const [weekRange, setWeekRange] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadWeekData();
  }, []);

  const loadWeekData = async () => {
    try {
      setLoading(true);
      const weekDays = getCurrentWeekDays();
      const weekLogs = [];

      for (const day of weekDays) {
        let logData = null;
        
        try {
          const filename = `${day.dateString}.json`;
          console.log(`Trying to load: ${filename}`);
          
          // Method 1: Try local API endpoint (recommended)
          try {
            const response = await fetch(`http://localhost:3001/api/wellness-logs/${day.dateString}`);
            if (response.ok) {
              logData = await response.json();
              console.log(`Successfully loaded via API ${filename}:`, logData);
            } else {
              console.log(`API returned ${response.status} for ${day.dateString}`);
            }
          } catch (apiError) {
            console.log(`API not available for ${day.dateString}:`, apiError.message);
          }
          
          // Method 2: Try serving files statically from public folder
          if (!logData) {
            try {
              const response = await fetch(`/wellness_logs/${filename}`);
              if (response.ok) {
                logData = await response.json();
                console.log(`Successfully loaded via static ${filename}:`, logData);
              }
            } catch (staticError) {
              console.log(`Static file not found: ${filename}`, staticError.message);
            }
          }
          
        } catch (error) {
          console.log(`Could not load data for ${day.dateString}:`, error.message);
        }

        const petalCount = calculatePetals(logData);
        console.log(`${day.dateString}: ${petalCount} petals`, logData ? 'with data' : 'no data');

        weekLogs.push({
          ...day,
          logData,
          petalCount
        });
      }

      setWeekData(weekLogs);
      setWeekRange(getWeekRangeString(weekDays));
      console.log('Final week data:', weekLogs);
    } catch (err) {
      setError('Failed to load week data');
      console.error('Error loading week data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentWeekDays = () => {
    const today = new Date();
    const weekDays = [];
    
    // Create array of today + past 6 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      weekDays.push({
        dayName: i === 0 ? 'Today' : `${i} day${i > 1 ? 's' : ''} ago`,
        date: new Date(date),
        dateString: date.toISOString().split('T')[0], // YYYY-MM-DD format
        isToday: i === 0
      });
    }
    
    return weekDays;
  };

  const getWeekRangeString = (weekDays) => {
    if (weekDays.length === 0) return '';
    
    const startDate = weekDays[0].date;
    const endDate = weekDays[6].date;
    
    const formatOptions = { month: 'long', day: 'numeric' };
    const startStr = startDate.toLocaleDateString('en-US', formatOptions);
    const endStr = endDate.toLocaleDateString('en-US', formatOptions);
    
    return `${startStr} – ${endStr}`;
  };

  const calculatePetals = (logData) => {
    if (!logData) return 0;
    
    let petalCount = 0;
    
    // Calculate petals based on your wellness criteria
    if (logData.sunlight_minutes >= 10) petalCount++;
    if (logData.water_liters > 2) petalCount++;
    if (logData.nutrition && logData.nutrition.length == 3) petalCount++;
    if (logData.movement_minutes >= 30) petalCount++;
    if (logData.sleep_hours >= 7) petalCount++;
    if (logData.social === true) petalCount++;
    if (logData.mental_reset_minutes >= 5) petalCount++;
    
    return Math.max(0, Math.min(7, petalCount));
  };

  const createPetals = (petalCount) => {
    if (petalCount === 0) return [];
    
    const petals = [];
    const angleStep = 360 / petalCount;
    const radius = 15;
    
    for (let i = 0; i < petalCount; i++) {
      const angle = (i * angleStep) * (Math.PI / 180);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      petals.push(
        <div
          key={i}
          className="absolute w-2 h-4 bg-yellow-400 rounded-full"
          style={{
            left: `calc(50% + ${x}px - 4px)`,
            top: `calc(50% + ${y}px - 8px)`,
            transform: `rotate(${i * angleStep + 90}deg)`,
            transformOrigin: 'center center'
          }}
        />
      );
    }
    return petals;
  };

  const handleFlowerClick = (dayData) => {
    if (onFlowerClick && dayData.logData) {
      // Pass the complete day data including date and calculated petals
      const enhancedLogData = {
        ...dayData.logData,
        calculatedPetals: dayData.petalCount,
        displayDate: dayData.date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      };
      onFlowerClick(enhancedLogData);
    }
  };

  const handleWeekSummary = () => {
    // Navigate to WeekSummaryScreen instead of showing alert
    if (onWeekSummaryClick) {
      onWeekSummaryClick();
    }
  };

  const refreshWeekData = () => {
    loadWeekData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600 mb-4">Loading week data...</div>
          <div className="text-sm text-gray-500">Reading wellness logs from local files</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-lg text-red-600 mb-4">{error}</div>
        <div className="text-sm text-gray-500 mb-6">
          Make sure your backend server is running on localhost:3001 or copy your wellness log files to the public/wellness_logs folder
        </div>
        <div className="flex gap-4">
          <button
            onClick={refreshWeekData}
            className="px-4 py-2 bg-blue-500 text-black rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={onBackToHome}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Home Screen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 relative">
      {/* Back button */}
      <div className="absolute top-8 right-8">
        <button
          onClick={onBackToHome}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors shadow-sm"
        >
          Back to Home Screen
        </button>
      </div>

      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Week View</h1>
        <h2 className="text-2xl font-light text-gray-700 mb-4">Your Week in Wellness</h2>
        <p className="text-lg text-gray-600">{weekRange}</p>
      </div>

      {/* Week Grid */}
      <div className="flex flex-wrap justify-center gap-8 mb-12 max-w-4xl">
        {weekData.map((dayData, index) => (
          <div key={index} className="flex flex-col items-center">
            {/* Day Name */}
            <div className={`text-lg font-medium mb-4 ${dayData.isToday ? 'text-blue-600 font-bold' : 'text-gray-700'}`}>
              {dayData.dayName}
            </div>
            
            {/* Flower */}
            <div
              onClick={() => handleFlowerClick(dayData)}
              className={`relative w-16 h-16 ${dayData.logData ? 'cursor-pointer hover:scale-110' : ''} transition-transform duration-300`}
              title={dayData.logData ? `${dayData.petalCount} activities completed - Click to view details` : 'No data for this day'}
            >
              {/* Petals */}
              {dayData.petalCount > 0 && (
                <div className="absolute inset-0">
                  {createPetals(dayData.petalCount)}
                </div>
              )}
              
              {/* Center of flower */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`w-6 h-6 rounded-full border shadow-sm z-10 ${
                  dayData.logData 
                    ? 'bg-yellow-500 border-yellow-600' 
                    : 'bg-gray-300 border-gray-400'
                }`} />
              </div>
            </div>
            
            {/* Date and petal count */}
            <div className="text-center mt-2">
              <div className="text-xs text-gray-500">
                {dayData.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              {dayData.logData && (
                <div className="text-xs text-gray-600 font-medium">
                  {dayData.petalCount} activities
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Instruction text */}
      <p className="text-sm text-gray-500 mb-8 italic text-center">
        "Tap the flower to see your summary for that day"
      </p>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleWeekSummary}
          className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors shadow-sm"
        >
          Week Summary
        </button>
        
        <button
          onClick={refreshWeekData}
          className="px-6 py-3 bg-blue-500 text-gray-700 rounded-full hover:bg-blue-600 transition-colors shadow-sm"
        >
          Refresh Data
        </button>
      </div>

      {/* Debug info */}
      <div className="mt-8 p-4 bg-gray-100 rounded text-xs text-gray-600 max-w-md">
        <p>Week data loaded: {weekData.length} days</p>
        <p>Days with logs: {weekData.filter(day => day.logData).length}</p>
        <p>Total petals: {weekData.reduce((sum, day) => sum + day.petalCount, 0)}</p>
        <div className="mt-2">
          <p>File loading methods attempted:</p>
          <ul className="list-disc list-inside text-xs">
            <li>Local API (localhost:3001)</li>
            <li>Static file serving (/public/wellness_logs/)</li>
          </ul>
        </div>
        <div className="mt-2">
          <p>Daily breakdown:</p>
          <div className="text-xs">
            {weekData.map(day => (
              <div key={day.dateString}>
                {day.dateString}: {day.logData ? `✅ ${day.petalCount} petals` : '❌ no data'}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeekView;