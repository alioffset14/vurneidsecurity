// src/services/dalfoxService.js
const { exec } = require('child_process');

class DalfoxService {
  constructor() {
    this.dalfoxPath = process.env.DALFOX_PATH || '/usr/local/bin/dalfox';
  }

  // Scan XSS
  async scanXSS(targetUrl, options = {}) {
    return new Promise((resolve) => {
      if (!targetUrl) {
        return resolve({
          vulnerabilities: [],
          rawOutput: '',
          timestamp: new Date().toISOString()
        });
      }

      // pakai JSON format biar gampang parse
      let command = `${this.dalfoxPath} url "${targetUrl}" --format json --no-spinner --no-color`;

      if (options.cookie) {
        command += ` -C "${options.cookie}"`;
      }
      if (options.header) {
        command += ` -H "${options.header}"`;
      }
      if (options.worker) {
        command += ` -w ${options.worker}`;
      }

      exec(command, { maxBuffer: 20 * 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
          console.error('Dalfox error:', error.message, stderr);
          return resolve({
            vulnerabilities: [],
            rawOutput: stdout + '\n' + stderr,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }

        const result = this.parseDalfoxOutput(stdout);
        resolve(result);
      });
    });
  }

  // Parse JSON output dari Dalfox
  parseDalfoxOutput(output = '') {
    let vulnerabilities = [];

    try {
      const parsed = JSON.parse(output);
      if (Array.isArray(parsed)) {
        vulnerabilities = parsed.map(item => ({
          type: 'XSS',
          url: item.url || '',
          parameter: item.param || 'unknown',
          severity: item.severity || 'medium',
          payload: item.payload || '',
          evidence: item.evidence || ''
        }));
      }
    } catch (e) {
      console.warn('Failed to parse Dalfox JSON, fallback ke plain parser.');
      vulnerabilities = this.fallbackParse(output);
    }

    return {
      vulnerabilities,
      rawOutput: output,
      timestamp: new Date().toISOString()
    };
  }

  // fallback parser kalau JSON gagal
  fallbackParse(output = '') {
    const vulns = [];
    const lines = output.split('\n');

    lines.forEach(line => {
      if (line.includes('[POC]') || line.includes('[VULN]')) {
        const parts = line.split(' ');
        const url = parts.find(part => part.startsWith('http'));
        const parameter = parts.find(part => part.includes('='));

        if (url) {
          vulns.push({
            type: 'XSS',
            url: url,
            parameter: parameter ? parameter.split('=')[0] : 'unknown',
            severity: 'medium',
            payload: line.includes('[POC]') ? line.split('[POC]')[1].trim() : 'N/A'
          });
        }
      }
    });

    return vulns;
  }
}

module.exports = new DalfoxService();
