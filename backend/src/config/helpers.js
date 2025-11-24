const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Helper untuk execute command dengan promise
const executeCommand = (command, options = {}) => {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject({ error: error.message, stderr });
        return;
      }
      resolve({ stdout, stderr });
    });
  });
};

// Validasi URL
const isValidUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (error) {
    return false;
  }
};

// Sanitasi input untuk mencegah command injection
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potentially dangerous characters
  return input.replace(/[;&|$`]/g, '');
};

// Format durasi waktu
const formatDuration = (seconds) => {
  if (seconds < 60) {
    return `${seconds} detik`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes} menit ${secs} detik`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours} jam ${minutes} menit`;
  }
};

// Generate random string untuk nama file
const generateRandomString = (length = 10) => {
  return Math.random().toString(36).substring(2, length + 2);
};

// Parse severity level untuk sorting
const parseSeverity = (severity) => {
  const levels = {
    'critical': 4,
    'high': 3,
    'medium': 2,
    'low': 1,
    'info': 0
  };
  return levels[severity.toLowerCase()] || 0;
};

// Export hasil scan ke file
const exportToFile = (data, format = 'json', filename = null) => {
  return new Promise((resolve, reject) => {
    try {
      const exportDir = path.join(__dirname, '../exports');
      
      // Buat directory exports jika belum ada
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      const fileExt = format === 'json' ? 'json' : 'txt';
      const finalFilename = filename || `scan-report-${Date.now()}.${fileExt}`;
      const filePath = path.join(exportDir, finalFilename);

      let content;
      if (format === 'json') {
        content = JSON.stringify(data, null, 2);
      } else {
        // Format text sederhana
        content = `Laporan Security Scan\n`;
        content += `Generated: ${new Date().toISOString()}\n\n`;
        
        if (data.vulnerabilities) {
          data.vulnerabilities.forEach((vuln, index) => {
            content += `${index + 1}. ${vuln.type} - ${vuln.severity}\n`;
            content += `   Parameter: ${vuln.parameter}\n`;
            content += `   Description: ${vuln.description}\n\n`;
          });
        }
      }

      fs.writeFile(filePath, content, (err) => {
        if (err) reject(err);
        else resolve({ filePath, filename: finalFilename });
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Helper untuk menghitung statistik vulnerabilities
const calculateVulnerabilityStats = (vulnerabilities) => {
  const stats = {
    total: vulnerabilities.length,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0
  };

  vulnerabilities.forEach(vuln => {
    const severity = vuln.severity?.toLowerCase();
    if (stats.hasOwnProperty(severity)) {
      stats[severity]++;
    }
  });

  return stats;
};

module.exports = {
  executeCommand,
  isValidUrl,
  sanitizeInput,
  formatDuration,
  generateRandomString,
  parseSeverity,
  exportToFile,
  calculateVulnerabilityStats
};