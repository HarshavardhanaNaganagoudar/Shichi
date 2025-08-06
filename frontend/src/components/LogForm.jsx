import React, { useState, useEffect } from 'react';

function LogForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    date: '',
    sunlight: 20,
    water: 2.0,
    tryptophan: true,
    greens: true,
    fats: false,
    movement: '0',
    sleep: 7.5,
    social: 'true',
    mental: '0',
    mood: 'neutral'
  });

  // New state for API handling
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // API configuration
  const API_BASE_URL = 'http://localhost:3001/api';

  // Set today's date on component mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, date: today }));
  }, []);

  // Clear messages when form data changes
  useEffect(() => {
    if (error || successMessage) {
      setError(null);
      setSuccessMessage(null);
    }
  }, [formData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // API function to save log data
  const saveLogData = async (logData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save log data');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error saving log data:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    
    // Transform form data to match backend expectations
    const data = {
      date: formData.date,
      sunlight_minutes: parseInt(formData.sunlight),
      water_liters: parseFloat(formData.water),
      nutrition: [
        ...(formData.tryptophan ? ['Tryptophan'] : []),
        ...(formData.greens ? ['Greens'] : []),
        ...(formData.fats ? ['Healthy Fats'] : [])
      ],
      movement_minutes: parseInt(formData.movement),
      sleep_hours: parseFloat(formData.sleep),
      social: formData.social === 'true',
      mental_reset_minutes: parseInt(formData.mental),
      mood: formData.mood
    };

    try {
      // Save to backend
      const result = await saveLogData(data);
      
      console.log('✅', result.message);
      setSuccessMessage(result.message);
      
      // Small delay to show success message
      setTimeout(() => {
        // Call the parent's onSubmit function to navigate to flower screen
        if (onSubmit) {
          onSubmit(data);
        }
      }, 1000);
      
    } catch (error) {
      setError(`Failed to save your wellness log: ${error.message}`);
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for max date restriction
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
      {/* Header */}
      <div className="w-full max-w-3xl mb-6">
        <h1 className="text-3xl font-bold text-gray-800 text-center">Log Your Day</h1>
        <p className="text-gray-600 text-center mt-2">Track your wellness activities</p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="w-full max-w-3xl mb-4 p-4 bg-red-100 border border-red-300 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="w-full max-w-3xl mb-4 p-4 bg-green-100 border border-green-300 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-700 text-sm">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-3xl bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        
        {/* Date */}
        <label className="block mb-6">
          <span className="block mb-2 text-sm font-medium text-gray-700">📅 Date:</span>
          <input
            type="date"
            name="date"
            value={formData.date}
            max={getTodayDate()}
            onChange={handleInputChange}
            className="p-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            required
          />
        </label>

        {/* Sunlight */}
        <label className="block mb-6">
          <span className="block mb-2 text-sm font-medium text-gray-700">🌞 Sunlight (minutes):</span>
          <input
            type="range"
            name="sunlight"
            min="0"
            max="60"
            value={formData.sunlight}
            onChange={handleInputChange}
            className="w-full mt-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0</span>
            <span className="font-medium text-yellow-600">{formData.sunlight} minutes</span>
            <span>60</span>
          </div>
        </label>

        {/* Water */}
        <label className="block mb-6">
          <span className="block mb-2 text-sm font-medium text-gray-700">💧 Water Intake (liters):</span>
          <input
            type="number"
            name="water"
            step="0.1"
            min="0"
            max="10"
            value={formData.water}
            onChange={handleInputChange}
            className="p-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
          />
        </label>

        {/* Nutrition Checkboxes */}
        <div className="mb-6">
          <label className="block mb-3 text-sm font-medium text-gray-700">🍎 Nutrition:</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                name="tryptophan"
                checked={formData.tryptophan}
                onChange={handleInputChange}
                className="mr-3 w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500"
              />
              <span className="text-sm">Tryptophan</span>
            </label>
            <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                name="greens"
                checked={formData.greens}
                onChange={handleInputChange}
                className="mr-3 w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500"
              />
              <span className="text-sm">Greens</span>
            </label>
            <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                name="fats"
                checked={formData.fats}
                onChange={handleInputChange}
                className="mr-3 w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500"
              />
              <span className="text-sm">Healthy Fats</span>
            </label>
          </div>
        </div>

        {/* Movement */}
        <label className="block mb-6">
          <span className="block mb-2 text-sm font-medium text-gray-700">🏃‍♂️ Movement (minutes):</span>
          <select
            name="movement"
            value={formData.movement}
            onChange={handleInputChange}
            className="p-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
          >
            <option value="0">None</option>
            <option value="10">&lt;15 minutes</option>
            <option value="20">15–30 minutes</option>
            <option value="35">&gt;30 minutes</option>
          </select>
        </label>

        {/* Sleep */}
        <label className="block mb-6">
          <span className="block mb-2 text-sm font-medium text-gray-700">😴 Sleep Hours:</span>
          <input
            type="number"
            name="sleep"
            step="0.1"
            min="0"
            max="16"
            value={formData.sleep}
            onChange={handleInputChange}
            className="p-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
          />
        </label>

        {/* Social */}
        <label className="block mb-6">
          <span className="block mb-2 text-sm font-medium text-gray-700">👥 Social Interaction:</span>
          <select
            name="social"
            value={formData.social}
            onChange={handleInputChange}
            className="p-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>

        {/* Mental Reset */}
        <label className="block mb-6">
          <span className="block mb-2 text-sm font-medium text-gray-700">🧘 Mental Reset (minutes):</span>
          <select
            name="mental"
            value={formData.mental}
            onChange={handleInputChange}
            className="p-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
          >
            <option value="0">None</option>
            <option value="5">1–5 minutes</option>
            <option value="10">10+ minutes</option>
          </select>
        </label>

        {/* Mood */}
        <label className="block mb-8">
          <span className="block mb-2 text-sm font-medium text-gray-700">😶 Mood:</span>
          <select
            name="mood"
            value={formData.mood}
            onChange={handleInputChange}
            className="p-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
          >
            <option value="happy">😊 Happy</option>
            <option value="neutral">😐 Neutral</option>
            <option value="sad">😔 Sad</option>
          </select>
        </label>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={saving}
          className={`w-full py-4 px-6 rounded-lg font-medium text-lg transition-all duration-75 ${
            saving 
              ? 'bg-gray-400 text-black cursor-not-allowed' 
              : 'bg-yellow-500 text-black hover:bg-yellow-600 hover:shadow-lg transform hover:-translate-y-0.5'
          }`}
        >
          {saving ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving Your Day...
            </span>
          ) : (
            '🌸 View My Bloom'
          )}
        </button>

        {/* Connection Status */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 text-xs text-gray-500 text-center">
            Backend: {API_BASE_URL}
          </div>
        )}
      </form>
    </div>
  );
}

export default LogForm;