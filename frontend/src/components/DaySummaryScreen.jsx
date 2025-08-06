import React, { useState, useEffect } from 'react';

function DaySummaryScreen({ logData, onBackToFlower }) {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format the date nicely
  const formatDate = (dateString) => {
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

  // Build the comprehensive prompt based on your Python implementation
  const buildPrompt = (data) => {
    const nutritionList = data?.nutrition && Array.isArray(data.nutrition) ? data.nutrition : [];
    const nutritionString = nutritionList.length > 0 ? nutritionList.join(", ") : "None logged";
    
    return `You are a kind and observant wellness assistant. The user has logged their daily well-being activities for ${data?.date || new Date().toISOString().split('T')[0]}. Your job is to:
1. Highlight 2–3 things they did well.
2. Gently mention anything important they might have missed or done less of (especially sleep, sunlight, hydration, or mental reset).
3. If any of the following nutrition items are missing — Tryptophan, Greens, Healthy Fats — raise a gentle concern and mention about them without fail. If all three are present, simply acknowledge it positively.
4. Offer one small, encouraging tip for tomorrow to improve on things they might have missed or done less.

Here's the log:
- Sunlight: ${data?.sunlight_minutes || 0} minutes
- Water Intake: ${data?.water_liters || 0} liters
- Nutrition: ${nutritionString}
- Movement: ${data?.movement_minutes || 0} minutes
- Sleep: ${data?.sleep_hours || 0} hours
- Social Interaction: ${data?.social ? "Yes" : "No"}
- Mental Reset: ${data?.mental_reset_minutes || 0} minutes
- Mood: ${data?.mood || "Not specified"}

Respond in a warm and friendly tone.`;
  };

  // Generate summary using your local Ollama/Gemma API (matching your Python implementation)
  const generateSummary = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const prompt = buildPrompt(logData);

      // Call your local Ollama API with the exact same configuration as your Python code
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gemma3n:e4b', // Matching your Python model name
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
      console.error('Error generating summary:', error);
      setError('Unable to connect to the wellness assistant. Please ensure Ollama is running with the gemma3n:e4b model.');
    } finally {
      setIsLoading(false);
    }
  };

  // Retry function
  const handleRetry = () => {
    generateSummary();
  };

  useEffect(() => {
    generateSummary();
  }, [logData]);

  // Parse and format the summary for better display
  const formatSummary = (summaryText) => {
    if (!summaryText) return [];
    
    // Split by double newlines first, then single newlines for paragraphs
    const paragraphs = summaryText
      .split(/\n\s*\n/)
      .filter(p => p.trim())
      .map(p => p.trim());
    
    // If no double newlines, split by single newlines and group into paragraphs
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 md:p-8 relative">
      {/* Back button - top right corner */}
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-10">
        <button
          onClick={onBackToFlower}
          className="px-3 py-2 md:px-4 md:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm md:text-base shadow-sm"
        >
          Back to Flower
        </button>
      </div>

      {/* Centered Header with proper top margin to avoid overlap */}
      <div className="mb-6 md:mb-8 mt-16 md:mt-20">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 text-center">Daily Wellness Summary</h1>
      </div>

      {/* Date */}
      <div className="mb-6 md:mb-8">
        <p className="text-lg md:text-xl text-gray-600 font-medium">{formatDate(logData?.date)}</p>
      </div>

      {/* Summary Content */}
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 px-8">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-yellow-500 mb-6"></div>
              <div className="absolute inset-0 rounded-full bg-yellow-50 opacity-20"></div>
            </div>
            <p className="text-gray-600 text-center">
              Your wellness assistant is analyzing your day...
            </p>
            <p className="text-gray-400 text-sm mt-2">
              This may take a few moments
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-16 px-8">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Connection Issue</h3>
            <p className="text-red-600 mb-6 max-w-md mx-auto">{error}</p>
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors font-medium inline-flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
          </div>
        ) : (
          <div className="p-6 md:p-8">
            {/* Wellness Summary Icon */}
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl">🌼</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Your Wellness Insights</h2>
                <p className="text-gray-500 text-sm">Personalized feedback from your wellness assistant</p>
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

            {/* Wellness Stats Quick View */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">Today's Activities</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{logData?.sunlight_minutes || 0}</div>
                  <div className="text-xs text-gray-500">Minutes Sunlight</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{logData?.water_liters || 0}L</div>
                  <div className="text-xs text-gray-500">Water Intake</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{logData?.movement_minutes || 0}</div>
                  <div className="text-xs text-gray-500">Minutes Movement</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{logData?.sleep_hours || 0}h</div>
                  <div className="text-xs text-gray-500">Sleep</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Button - Centered */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-yellow-500 text-black rounded-full hover:bg-yellow-600 transition-colors shadow-sm font-medium"
        >
          Generate New Summary
        </button>
      </div>

      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs text-gray-600 max-w-4xl w-full">
          <details>
            <summary className="cursor-pointer font-semibold">Debug Information</summary>
            <div className="mt-2 space-y-1">
              <p>Model: gemma3n:e4b</p>
              <p>Log data available: {logData ? 'Yes' : 'No'}</p>
              <p>Summary length: {summary.length} characters</p>
              <p>Nutrition items: {logData?.nutrition?.length || 0}</p>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

export default DaySummaryScreen;