import React from 'react';

function HomeScreen({ onLogYourDay, onTrackProgress, onExit }) {
  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col relative">
      {/* Exit Button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={onExit}
          className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
        >
          Exit
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full flex flex-col items-center justify-center px-8">
        {/* Cat Image */}
        <div className="mb-8">
          <img 
            src="/images/cat-meditation.png" 
            alt="Meditating cat" 
            className="w-40 h-40 md:w-48 md:h-48 object-contain"
          />
        </div>

        {/* App Title */}
        <h1 className="text-6xl md:text-7xl font-thin text-gray-800 mb-16 tracking-wide text-center">
          Shichi
        </h1>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
          <button
            onClick={onLogYourDay}
            className="px-8 py-3 bg-white text-gray-700 border border-gray-300 rounded-full hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 shadow-sm font-medium min-w-[160px] text-center"
          >
            Log Your Day
          </button>
          
          <button
            onClick={onTrackProgress}
            className="px-8 py-3 bg-white text-gray-700 border border-gray-300 rounded-full hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 shadow-sm font-medium min-w-[160px] text-center"
          >
            Track Your Progress
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomeScreen;