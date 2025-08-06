import React from 'react';

function FlowerScreen({ logData, onBackToHome, onFlowerClick }) {
  // Calculate number of petals based on wellness activities completed
  const calculatePetals = () => {
    let petalCount = 0;
    
    if (!logData) return 0; // Default to 0 petals if no data
    
    // Use the pre-calculated petals from WeekView if available
    if (logData.calculatedPetals !== undefined) {
      return logData.calculatedPetals;
    }
    
    // Otherwise calculate petals (keeping consistent with WeekView logic)
    if (logData.sunlight_minutes >= 10) petalCount++;
    if (logData.water_liters > 2) petalCount++;
    if (logData.nutrition && logData.nutrition.length == 3) petalCount++; // Changed from == 3 to >= 1 to match WeekView
    if (logData.movement_minutes > 30) petalCount++;
    if (logData.sleep_hours >= 7) petalCount++;
    if (logData.social === true) petalCount++;
    if (logData.mental_reset_minutes >= 5) petalCount++;
    
    // Ensure at least 0 petals, max 7 petals
    return Math.max(0, Math.min(7, petalCount));
  };

  const petalCount = calculatePetals();
  
  // Format the date nicely
  const formatDate = (dateString) => {
    // Use the enhanced display date from WeekView if available
    if (logData?.displayDate) {
      return logData.displayDate;
    }
    
    if (!dateString) return new Date().toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Get completed activities for debugging/display
  const getCompletedActivities = () => {
    if (!logData) return [];
    
    const activities = [];
    if (logData.sunlight_minutes >= 10) activities.push(`Sunlight (${logData.sunlight_minutes} min)`);
    if (logData.water_liters >= 2) activities.push(`Water (${logData.water_liters}L)`);
    if (logData.nutrition && logData.nutrition.length >= 1) activities.push(`Nutrition (${logData.nutrition.join(', ')})`);
    if (logData.movement_minutes >= 20) activities.push(`Movement (${logData.movement_minutes} min)`);
    if (logData.sleep_hours >= 7) activities.push(`Sleep (${logData.sleep_hours}h)`);
    if (logData.social === true) activities.push('Social Connection');
    if (logData.mental_reset_minutes >= 5) activities.push(`Mental Reset (${logData.mental_reset_minutes} min)`);
    
    return activities;
  };

  // Create petals based on count
  const createPetals = () => {
    const petals = [];
    const angleStep = 360 / petalCount;
    const radius = 40; // Distance from center to petal center
    
    for (let i = 0; i < petalCount; i++) {
      const angle = (i * angleStep) * (Math.PI / 180); // Convert to radians
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      petals.push(
        <div
          key={i}
          className="absolute w-6 h-12 bg-yellow-400 rounded-full"
          style={{
            left: `calc(50% + ${x}px - 12px)`, // 12px is half the petal width
            top: `calc(50% + ${y}px - 24px)`,  // 24px is half the petal height
            transform: `rotate(${i * angleStep + 90}deg)`, // +90 to make petals point outward
            transformOrigin: 'center center'
          }}
        />
      );
    }
    return petals;
  };

  const handleFlowerClick = () => {
    if (onFlowerClick) {
      onFlowerClick();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 relative">
      {/* Back button - fixed to top right corner */}
      <div className="fixed top-4 right-4 z-20">
        <button
          onClick={onBackToHome}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors shadow-sm"
        >
          Back to Home Screen
        </button>
      </div>

      {/* Centered Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 text-center">Your Day in Bloom</h1>
      </div>

      {/* Date */}
      <div className="mb-12">
        <p className="text-lg text-gray-600">{formatDate(logData?.date)}</p>
      </div>

      {/* Flower Container */}
      <div className="flex flex-col items-center">
        {/* Clickable Flower */}
        <div
          onClick={handleFlowerClick}
          className="relative w-32 h-32 cursor-pointer hover:scale-110 transition-transform duration-300"
        >
          {/* Petals */}
          {petalCount > 0 && (
            <div className="absolute inset-0">
              {createPetals()}
            </div>
          )}
          
          {/* Center of flower */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-yellow-500 rounded-full border-2 border-yellow-600 shadow-lg z-10 relative" />
          </div>
        </div>

        {/* Instruction text */}
        <p className="text-sm text-gray-500 mt-8 italic">
          "Tap the flower to see your summary"
        </p>
      </div>

      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded text-xs text-gray-600 max-w-md">
          <p>Petals: {petalCount}</p>
          <p>Log data: {logData ? 'Available' : 'Not available'}</p>
          {logData?.calculatedPetals !== undefined && (
            <p>Using pre-calculated petals from WeekView: {logData.calculatedPetals}</p>
          )}
          {logData && (
            <div className="mt-2">
              <p>Completed activities:</p>
              <ul className="text-xs list-disc list-inside">
                {getCompletedActivities().map((activity, index) => (
                  <li key={index}>{activity}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FlowerScreen;