// server.js
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration
const CLEANUP_ENABLED = process.env.DAILY_CLEANUP !== 'false'; // Enable by default
const CLEANUP_HOUR = parseInt(process.env.CLEANUP_HOUR) || 2; // 2 AM by default

// Middleware
app.use(cors());
app.use(express.json());

// Create logs directory if it doesn't exist
const LOGS_DIR = path.join(__dirname, 'wellness_logs');

async function ensureLogsDirectory() {
  try {
    await fs.access(LOGS_DIR);
  } catch (error) {
    // Directory doesn't exist, create it
    await fs.mkdir(LOGS_DIR, { recursive: true });
    console.log('📁 Created wellness_logs directory');
  }
}

// Clean up old log files (keep only last 7 days including today)
async function cleanupOldLogs() {
  try {
    const files = await fs.readdir(LOGS_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json') && file.match(/^\d{4}-\d{2}-\d{2}\.json$/));
    
    if (jsonFiles.length === 0) {
      console.log('🧹 No log files to clean up');
      return;
    }

    // Get today's date and calculate cutoff date (7 days ago)
    const today = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(today.getDate() - 6); // Keep today + 6 previous days = 7 total
    
    const cutoffDateString = cutoffDate.toISOString().split('T')[0];
    
    let deletedCount = 0;
    let keptCount = 0;

    for (const file of jsonFiles) {
      const dateString = file.replace('.json', '');
      
      // Validate date format and compare
      if (dateString < cutoffDateString) {
        try {
          const filepath = path.join(LOGS_DIR, file);
          await fs.unlink(filepath);
          console.log(`🗑️ Deleted old log: ${file}`);
          deletedCount++;
        } catch (error) {
          console.warn(`⚠️ Failed to delete ${file}:`, error.message);
        }
      } else {
        keptCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`🧹 Cleanup completed: ${deletedCount} old files deleted, ${keptCount} files kept`);
    } else {
      console.log(`✅ All ${keptCount} log files are within the 7-day retention period`);
    }

  } catch (error) {
    console.error('❌ Error during log cleanup:', error.message);
  }
}

// Helper function to generate filename from date
function getLogFilename(date) {
  // Format: YYYY-MM-DD.json
  return `${date}.json`;
}

// Helper function to validate log data
function validateLogData(data) {
  const required = ['date', 'sunlight_minutes', 'water_liters', 'movement_minutes', 'sleep_hours'];
  const missing = required.filter(field => data[field] === undefined || data[field] === null);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }

  // Validate data types and ranges
  const validations = {
    sunlight_minutes: (val) => typeof val === 'number' && val >= 0 && val <= 1440,
    water_liters: (val) => typeof val === 'number' && val >= 0 && val <= 20,
    movement_minutes: (val) => typeof val === 'number' && val >= 0 && val <= 1440,
    sleep_hours: (val) => typeof val === 'number' && val >= 0 && val <= 24,
    mental_reset_minutes: (val) => val === undefined || (typeof val === 'number' && val >= 0 && val <= 1440),
    social: (val) => val === undefined || typeof val === 'boolean',
    mood: (val) => val === undefined || typeof val === 'string',
    nutrition: (val) => val === undefined || Array.isArray(val)
  };

  for (const [field, validator] of Object.entries(validations)) {
    if (data[field] !== undefined && !validator(data[field])) {
      throw new Error(`Invalid value for ${field}: ${data[field]}`);
    }
  }

  return true;
}

// Routes

// Save daily log
app.post('/api/logs', async (req, res) => {
  try {
    const logData = req.body;
    
    // Validate the data
    validateLogData(logData);
    
    // Add timestamp
    logData.created_at = new Date().toISOString();
    logData.updated_at = logData.created_at;
    
    const filename = getLogFilename(logData.date);
    const filepath = path.join(LOGS_DIR, filename);
    
    // Check if file already exists
    let existingData = null;
    try {
      const existingContent = await fs.readFile(filepath, 'utf8');
      existingData = JSON.parse(existingContent);
      logData.created_at = existingData.created_at; // Preserve original creation time
      logData.updated_at = new Date().toISOString(); // Update modification time
    } catch (error) {
      // File doesn't exist, which is fine for new logs
    }
    
    // Save the log data
    await fs.writeFile(filepath, JSON.stringify(logData, null, 2));
    
    console.log(`📝 Saved log for ${logData.date} to ${filename}`);
    
    res.status(200).json({
      success: true,
      message: existingData ? 'Log updated successfully' : 'Log saved successfully',
      data: logData,
      filename: filename
    });
    
  } catch (error) {
    console.error('❌ Error saving log:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get daily log
app.get('/api/logs/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const filename = getLogFilename(date);
    const filepath = path.join(LOGS_DIR, filename);
    
    const content = await fs.readFile(filepath, 'utf8');
    const logData = JSON.parse(content);
    
    res.status(200).json({
      success: true,
      data: logData
    });
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({
        success: false,
        error: 'Log not found for this date'
      });
    } else {
      console.error('❌ Error reading log:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to read log file'
      });
    }
  }
});

// NEW ENDPOINT: Get wellness log for WeekView component
// This endpoint returns the raw log data that WeekView expects
app.get('/api/wellness-logs/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const filename = getLogFilename(date);
    const filepath = path.join(LOGS_DIR, filename);
    
    const content = await fs.readFile(filepath, 'utf8');
    const logData = JSON.parse(content);
    
    // Return the raw log data (not wrapped in success/data structure)
    // This matches what WeekView component expects
    res.status(200).json(logData);
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({
        error: 'Log not found for this date'
      });
    } else {
      console.error('❌ Error reading wellness log:', error.message);
      res.status(500).json({
        error: 'Failed to read log file'
      });
    }
  }
});

// Get all logs (for progress tracking)
app.get('/api/logs', async (req, res) => {
  try {
    const files = await fs.readdir(LOGS_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const logs = [];
    for (const file of jsonFiles) {
      try {
        const filepath = path.join(LOGS_DIR, file);
        const content = await fs.readFile(filepath, 'utf8');
        const logData = JSON.parse(content);
        logs.push(logData);
      } catch (error) {
        console.warn(`⚠️ Skipping corrupted file: ${file}`);
      }
    }
    
    // Sort by date (newest first)
    logs.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.status(200).json({
      success: true,
      data: logs,
      count: logs.length
    });
    
  } catch (error) {
    console.error('❌ Error reading logs directory:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to read logs directory'
    });
  }
});

// Delete a specific log
app.delete('/api/logs/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const filename = getLogFilename(date);
    const filepath = path.join(LOGS_DIR, filename);
    
    await fs.unlink(filepath);
    
    console.log(`🗑️ Deleted log for ${date}`);
    
    res.status(200).json({
      success: true,
      message: 'Log deleted successfully'
    });
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({
        success: false,
        error: 'Log not found for this date'
      });
    } else {
      console.error('❌ Error deleting log:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to delete log file'
      });
    }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Shichi backend is running',
    timestamp: new Date().toISOString()
  });
});

// Schedule daily cleanup (optional)
function scheduleDailyCleanup() {
  if (!CLEANUP_ENABLED) {
    console.log('📅 Daily cleanup is disabled');
    return;
  }

  const scheduleNextCleanup = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(CLEANUP_HOUR, 0, 0, 0);
    
    const timeUntilCleanup = tomorrow.getTime() - now.getTime();
    
    console.log(`📅 Next daily cleanup scheduled for: ${tomorrow.toLocaleString()}`);
    
    setTimeout(async () => {
      console.log('🧹 Running scheduled daily cleanup...');
      await cleanupOldLogs();
      scheduleNextCleanup(); // Schedule the next cleanup
    }, timeUntilCleanup);
  };

  scheduleNextCleanup();
}

// Start server
async function startServer() {
  try {
    await ensureLogsDirectory();
    
    // Clean up old logs on startup
    console.log('🧹 Running log cleanup on startup...');
    await cleanupOldLogs();
    
    // Schedule daily cleanup
    scheduleDailyCleanup();
    
    app.listen(PORT, () => {
      console.log(`🌸 Shichi backend running on http://localhost:${PORT}`);
      console.log(`📁 Logs will be saved to: ${LOGS_DIR}`);
      console.log(`🔄 Retention policy: Keep logs for 7 days (today + 6 previous days)`);
      console.log(`📅 Daily cleanup: ${CLEANUP_ENABLED ? `Enabled (${CLEANUP_HOUR}:00 AM)` : 'Disabled'}`);
      console.log(`📊 WeekView endpoint available at: /api/wellness-logs/:date`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();