
import React, { useState, useEffect } from 'react';

function WeekSummaryScreen({ onBackToWeekView }) {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weekData, setWeekData] = useState([]);
  const [weekRange, setWeekRange] = useState('');

  // Get current week days (same logic as WeekView)
  const getCurrentWeekDays = () => {
    const today = new Date();
    const weekDays = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      weekDays.push({
        dayName: i === 0 ? 'Today' : `${i} day${i > 1 ? 's' : ''} ago`,
        date: new Date(date),
        dateString: date.toISOString().split('T')[0],
        isToday: i === 0
      });
    }
    
    return weekDays;
  };

  // Load week data from backend
  const loadWeekData = async () => {
    try {
      const weekDays = getCurrentWeekDays();
      const weekLogs = [];

      for (const day of weekDays) {
        let logData = null;
        
        try {
          const filename = `${day.dateString}.json`;
          
          // Try local API endpoint first
          try {
            const response = await fetch(`http://localhost:3001/api/wellness-logs/${day.dateString}`);
            if (response.ok) {
              logData = await response.json();
            }
          } catch (apiError) {
            console.log(`API not available for ${day.dateString}`);
          }
          
          // Fallback to static file serving
          if (!logData) {
            try {
              const response = await fetch(`/wellness_logs/${filename}`);
              if (response.ok) {
                logData = await response.json();
              }
            } catch (staticError) {
              console.log(`Static file not found: ${filename}`);
            }
          }
          
        } catch (error) {
          console.log(`Could not load data for ${day.dateString}:`, error.message);
        }

        weekLogs.push({
          ...day,
          logData
        });
      }

      setWeekData(weekLogs);
      
      // Set week range
      const startDate = weekDays[0].date;
      const endDate = weekDays[6].date;
      const formatOptions = { month: 'long', day: 'numeric' };
      const startStr = startDate.toLocaleDateString('en-US', formatOptions);
      const endStr = endDate.toLocaleDateString('en-US', formatOptions);
      setWeekRange(`${startStr} – ${endStr}`);
      
      return weekLogs;
    } catch (err) {
      console.error('Error loading week data:', err);
      throw err;
    }
  };

  // Build comprehensive week analysis prompt
  const buildWeekPrompt = (weekLogs) => {
    const daysWithLogs = weekLogs.filter(day => day.logData);
    const totalDays = daysWithLogs.length;
    
    if (totalDays === 0) {
      return `You are a kind and encouraging wellness assistant. The user hasn't logged any wellness data this week yet. Please provide a gentle, motivating message about starting their wellness journey and the benefits of consistent daily logging. Keep it warm and supportive, focusing on the positive impact of beginning to track their wellness activities.`;
    }

    // Calculate weekly totals and averages
    const weeklyStats = daysWithLogs.reduce((acc, day) => {
      const data = day.logData;
      return {
        totalSunlight: acc.totalSunlight + (data.sunlight_minutes || 0),
        totalWater: acc.totalWater + (data.water_liters || 0),
        totalMovement: acc.totalMovement + (data.movement_minutes || 0),
        totalSleep: acc.totalSleep + (data.sleep_hours || 0),
        totalMentalReset: acc.totalMentalReset + (data.mental_reset_minutes || 0),
        socialDays: acc.socialDays + (data.social ? 1 : 0),
        nutritionEntries: acc.nutritionEntries + (data.nutrition ? data.nutrition.length : 0),
        allNutrition: acc.allNutrition.concat(data.nutrition || [])
      };
    }, {
      totalSunlight: 0,
      totalWater: 0,
      totalMovement: 0,
      totalSleep: 0,
      totalMentalReset: 0,
      socialDays: 0,
      nutritionEntries: 0,
      allNutrition: []
    });

    // Check for nutrition consistency
    const uniqueNutrition = [...new Set(weeklyStats.allNutrition)];
    const hasTryptophan = uniqueNutrition.some(item => item.toLowerCase().includes('tryptophan'));
    const hasGreens = uniqueNutrition.some(item => item.toLowerCase().includes('greens'));
    const hasHealthyFats = uniqueNutrition.some(item => item.toLowerCase().includes('healthy fats'));

    // Daily breakdown
    const dailyBreakdown = daysWithLogs.map(day => {
      const data = day.logData;
      const nutrition = data.nutrition && data.nutrition.length > 0 ? data.nutrition.join(', ') : 'None';
      return `${day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}: 
        Sunlight: ${data.sunlight_minutes || 0}min, Water: ${data.water_liters || 0}L, 
        Movement: ${data.movement_minutes || 0}min, Sleep: ${data.sleep_hours || 0}h, 
        Social: ${data.social ? 'Yes' : 'No'}, Mental Reset: ${data.mental_reset_minutes || 0}min, 
        Nutrition: ${nutrition}, Mood: ${data.mood || 'Not specified'}`;
    }).join('\n');

    return `You are a comprehensive wellness coach analyzing a full week of wellness data. The user has logged ${totalDays} out of 7 days this week (${weekRange}). 

Your analysis should include:
1. **Weekly Consistency**: Comment on their logging consistency and overall patterns
2. **Strengths**: Highlight 3-4 areas where they excelled this week (high averages, consistent habits, etc.)
3. **Areas for Growth**: Gently identify 2-3 areas that could use improvement based on recommended minimums
4. **Nutrition Analysis**: Special attention to Tryptophan, Greens, and Healthy Fats presence throughout the week
5. **Holistic Insights**: Look for connections between sleep, mood, movement, and other factors
6. **Next Week Goals**: Provide 2-3 specific, achievable goals for the coming week

Weekly Summary:
- Days logged: ${totalDays}/7
- Average sunlight: ${(weeklyStats.totalSunlight / totalDays).toFixed(1)} minutes/day
- Average water: ${(weeklyStats.totalWater / totalDays).toFixed(1)} liters/day  
- Average movement: ${(weeklyStats.totalMovement / totalDays).toFixed(1)} minutes/day
- Average sleep: ${(weeklyStats.totalSleep / totalDays).toFixed(1)} hours/day
- Average mental reset: ${(weeklyStats.totalMentalReset / totalDays).toFixed(1)} minutes/day
- Social connection: ${weeklyStats.socialDays}/${totalDays} days
- Nutrition variety: ${uniqueNutrition.length} unique items
- Key nutrition present: Tryptophan: ${hasTryptophan ? 'Yes' : 'Missing'}, Greens: ${hasGreens ? 'Yes' : 'Missing'}, Healthy Fats: ${hasHealthyFats ? 'Yes' : 'Missing'}

Daily Breakdown:
${dailyBreakdown}

Recommended minimums for reference: Sunlight 10min, Water 2L, Movement 20min, Sleep 7h, Mental Reset 5min.

Respond in a warm, encouraging, and insightful tone. Make it feel like a thoughtful coach who really understands their week.`;
  };

  // Generate summary using local Ollama/Gemma API
  const generateWeekSummary = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load week data first
      const weekLogs = await loadWeekData();
      const prompt = buildWeekPrompt(weekLogs);

      // Call local Ollama API
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gemma3n:e4b',
          prompt: prompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const summaryText = data.response?.trim() || '';
      
      if (!summaryText) {
        throw new Error('Empty response from LLM');
      }
      
      setSummary(summaryText);
      
    } catch (error) {
      console.error('Error generating week summary:', error);
      setError('Unable to connect to the wellness assistant. Please ensure Ollama is running with the gemma3n:e4b model.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    generateWeekSummary();
  };

  useEffect(() => {
    generateWeekSummary();
  }, []);

  // Format summary for better display
  const formatSummary = (summaryText) => {
    if (!summaryText) return [];
    
    // Split by double newlines first, then single newlines for paragraphs
    const paragraphs = summaryText
      .split(/\n\s*\n/)
      .filter(p => p.trim())
      .map(p => p.trim());
    
    // If no double newlines, split by single newlines and group
    if (paragraphs.length === 1) {
      const sentences = summaryText.split(/\.\s+/).filter(s => s.trim());
      const groupedSentences = [];
      
      for (let i = 0; i < sentences.length; i += 2) {
        const group = sentences.slice(i, i + 2).join('. ');
        if (group.trim()) {
          groupedSentences.push(group + (group.endsWith('.') ? '' : '.'));
        }
      }
      
      return groupedSentences.length > 0 ? groupedSentences : [summaryText];
    }
    
    return paragraphs;
  };

  const formattedSummary = formatSummary(summary);

  // Calculate quick stats for display
  const daysWithLogs = weekData.filter(day => day.logData).length;
  const totalActivities = weekData.reduce((sum, day) => {
    if (!day.logData) return sum;
    let count = 0;
    if (day.logData.sunlight_minutes >= 10) count++;
    if (day.logData.water_liters >= 2) count++;
    if (day.logData.nutrition && day.logData.nutrition.length >= 1) count++;
    if (day.logData.movement_minutes >= 20) count++;
    if (day.logData.sleep_hours >= 7) count++;
    if (day.logData.social === true) count++;
    if (day.logData.mental_reset_minutes >= 5) count++;
    return sum + count;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 md:p-8 relative">
      {/* Back button */}
      <div className="fixed top-4 right-4 z-20">
        <button
          onClick={onBackToWeekView}
          className="px-3 py-2 md:px-4 md:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm md:text-base shadow-sm"
        >
          Back to Week View
        </button>
      </div>

      {/* Header */}
      <div className="mb-6 md:mb-8 mt-16 md:mt-20 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Weekly Wellness Summary</h1>
        <p className="text-lg md:text-xl text-gray-600 font-medium">{weekRange}</p>
      </div>

      {/* Summary Content */}
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 px-8">
            <div className="relative mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-500"></div>
              <div className="absolute inset-0 rounded-full bg-blue-50 opacity-20"></div>
            </div>
            <p className="text-gray-600 text-center text-lg">
              Analyzing your week in wellness...
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Generating comprehensive insights from your daily logs
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-20 px-8">
            <div className="mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Connection Issue</h3>
            <p className="text-red-600 mb-8 max-w-lg mx-auto">{error}</p>
            <button
              onClick={handleRetry}
              className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium inline-flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
          </div>
        ) : (
          <div className="p-6 md:p-10">
            {/* Header with icon */}
            <div className="flex items-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mr-5">
                <span className="text-3xl">📊</span>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">Your Week in Review</h2>
                <p className="text-gray-500">Comprehensive wellness insights from your weekly data</p>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-600">{daysWithLogs}</div>
                  <div className="text-sm text-gray-600">Days Logged</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600">{totalActivities}</div>
                  <div className="text-sm text-gray-600">Total Activities</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">{daysWithLogs > 0 ? (totalActivities / daysWithLogs).toFixed(1) : 0}</div>
                  <div className="text-sm text-gray-600">Avg per Day</div>
                </div>
              </div>
            </div>

            {/* Summary Text */}
            <div className="prose prose-lg max-w-none">
              {formattedSummary.map((paragraph, index) => (
                <p key={index} className="text-gray-700 leading-relaxed mb-6 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex gap-4 justify-center">
        <button
          onClick={handleRetry}
          className="px-6 py-3 bg-blue-500 text-gray-700 rounded-full hover:bg-blue-600 transition-colors shadow-sm font-medium"
        >
          Generate New Summary
        </button>
        <button
          onClick={() => window.print()}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors shadow-sm font-medium"
        >
          Print Summary
        </button>
      </div>

      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs text-gray-600 max-w-5xl w-full">
          <details>
            <summary className="cursor-pointer font-semibold">Debug Information</summary>
            <div className="mt-2 space-y-1">
              <p>Model: gemma3n:e4b</p>
              <p>Week data loaded: {weekData.length} days</p>
              <p>Days with logs: {daysWithLogs}</p>
              <p>Summary length: {summary.length} characters</p>
              <p>Total activities: {totalActivities}</p>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

export default WeekSummaryScreen;