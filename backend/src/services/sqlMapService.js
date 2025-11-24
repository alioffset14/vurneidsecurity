const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class SQLMapService {
  constructor() {
    /**
     * SQLMAP_PATH environment variable handling:
     * - If SQLMAP_PATH contains a path to an executable (e.g. "sqlmap"), we run it directly.
     * - If SQLMAP_PATH points to a .py script (e.g. "/opt/sqlmap/sqlmap.py"), we run "python3 <script>".
     * - Fallback: python3 /opt/sqlmap/sqlmap.py
     */
    this.rawSqlmapPath = process.env.SQLMAP_PATH || ''; // could be empty
    this.pythonBin = process.env.SQLPYTHON || 'python3';
    this.defaultScript = '/opt/sqlmap/sqlmap.py';
    this.maxRawLength = 2000; // max chars to store for rawOutput
  }

  _buildCommandAndArgs() {
    // Determine if rawSqlmapPath is an executable or a .py script
    if (!this.rawSqlmapPath) {
      return { cmd: this.pythonBin, args: [this.defaultScript] };
    }
    const trimmed = this.rawSqlmapPath.trim();
    if (trimmed.endsWith('.py')) {
      return { cmd: this.pythonBin, args: [trimmed] };
    }
    // If contains a space (e.g. "python3 /opt/sqlmap/sqlmap.py"), split
    const parts = trimmed.split(/\s+/);
    if (parts.length > 1) {
      const cmd = parts[0];
      const args = parts.slice(1);
      return { cmd, args };
    }
    // Otherwise it's a single executable (e.g. "sqlmap")
    return { cmd: trimmed, args: [] };
  }

  // Utility to safely push option if present
  _pushOption(args, name, value, isFlag = false) {
    if (value === undefined || value === null || value === '') return;
    if (isFlag) {
      args.push(`--${name}`);
      return;
    }
    // If value contains spaces or quotes, we still push as single arg; spawn handles it
    args.push(`--${name}`);
    args.push(String(value));
  }

  // Scan SQL Injection
  async scanSQLInjection(targetUrl, options = {}) {
    if (!targetUrl || typeof targetUrl !== 'string') {
      throw new Error('Invalid targetUrl');
    }

    const { cmd, args: baseArgs } = this._buildCommandAndArgs();
    // build args array (baseArgs + sqlmap args)
    const args = [...baseArgs];

    // required
    args.push('-u');
    args.push(targetUrl);
    args.push('--batch');

    // level / risk default (allow override via options)
    const level = options.level !== undefined ? options.level : 1;
    const risk = options.risk !== undefined ? options.risk : 1;
    args.push('--level');
    args.push(String(level));
    args.push('--risk');
    args.push(String(risk));

    // techniques (if provided)
    if (options.techniques) {
      args.push('--technique');
      args.push(String(options.techniques));
    }

    // method, data, cookie (each as separate args)
    if (options.method) {
      args.push('--method');
      args.push(String(options.method));
    }
    if (options.data) {
      args.push('--data');
      args.push(String(options.data));
    }
    if (options.cookie) {
      args.push('--cookie');
      args.push(String(options.cookie));
    }

    // extra raw args from caller (array)
    if (Array.isArray(options.extraArgs)) {
      args.push(...options.extraArgs.map(String));
    }

    // Optionally request JSON dump output to output-dir (caller may set this)
    if (options.dumpJson === true) {
      // sqlmap expects --output-dir <dir> and --dump-format JSON in some setups; include if requested
      args.push('--output-dir');
      args.push(String(options.outputDir || '/tmp/sqlmap'));
      args.push('--dump-format');
      args.push('JSON');
    }

    // timeout in ms (default 5 minutes)
    const timeoutMs = typeof options.timeoutMs === 'number' ? options.timeoutMs : 300000;

    console.log('SQLMap spawn command:', cmd, args.join(' '));

    return new Promise((resolve) => {
      const child = spawn(cmd, args, { shell: false });

      let stdout = '';
      let stderr = '';
      let finished = false;

      // manual timeout
      const timer = setTimeout(() => {
        if (!finished) {
          finished = true;
          child.kill('SIGKILL');
        }
      }, timeoutMs);

      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        finished = true;
        const combined = stdout + '\n' + stderr;
        const parsed = this.parseSQLMapOutput(combined);
        // include processError for debugging
        parsed.processError = String(err);
        resolve(parsed);
      });

      child.on('close', (code, signal) => {
        clearTimeout(timer);
        finished = true;
        const combined = stdout + '\n' + stderr;
        const parsed = this.parseSQLMapOutput(combined);
        parsed.exitCode = code;
        parsed.signal = signal;
        resolve(parsed);
      });
    });
  }

  // Parse output SQLMap: try JSON first, otherwise fallback to regex scanning
  parseSQLMapOutput(output) {
    const vulnerabilities = [];
    const combined = typeof output === 'string' ? output : String(output || '');
    const trimmedRaw = combined.slice(0, this.maxRawLength);

    // 1) Try to find a JSON blob in output and parse it
    const firstBrace = combined.indexOf('{');
    const lastBrace = combined.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const possibleJson = combined.slice(firstBrace, lastBrace + 1);
      try {
        const parsedJson = JSON.parse(possibleJson);
        // Attempt to extract vulnerabilities if structure present
        // sqlmap JSON structure can vary; we try common patterns defensively
        if (parsedJson && typeof parsedJson === 'object') {
          // e.g., parsedJson may have 'vulnerabilities' or 'alerts' or 'injection' fields
          const candidates = [];
          if (Array.isArray(parsedJson.vulnerabilities)) candidates.push(...parsedJson.vulnerabilities);
          if (Array.isArray(parsedJson.alerts)) candidates.push(...parsedJson.alerts);
          // If there's an 'injection' object
          if (parsedJson.injection && typeof parsedJson.injection === 'object') {
            candidates.push(parsedJson.injection);
          }

          // Normalize candidate entries into our vulnerability shape
          candidates.forEach((c) => {
            // try to find parameter / payload / type
            const param = c.parameter || c.param || c.name || c.key || 'unknown';
            const rawType = c.type || c.vuln_type || c.technique || 'SQL Injection';
            vulnerabilities.push({
              type: 'SQL Injection',
              parameter: param,
              technique: rawType,
              severity: c.severity || 'high',
              description: c.description || c.detail || JSON.stringify(c).slice(0, 200)
            });
          });

          // If we found anything via JSON, return early
          if (vulnerabilities.length > 0) {
            return {
              vulnerabilities,
              rawOutput: trimmedRaw,
              parsedJsonSummary: Object.keys(parsedJson).slice(0, 10),
              timestamp: new Date().toISOString()
            };
          }
        }
      } catch (e) {
        // JSON parse failed — fallthrough to text parsing
      }
    }

    // 2) Fallback: text-based parsing with tolerant regex
    const lines = combined.split(/\r?\n/);
    const injectableRegex = /(?:(\w+)\s+)?parameter\s+'([^']+)'\s+(?:is|appears to be|seems to be|was|looks)\s*(injectable|vulnerable|vulnerability|vulnerable\.)?/i;
    const altInjectRegex = /Parameter\s+'([^']+)'\s+is\s+(?:vulnerable|injectable)/i;
    const heuristicRegex = /heuristic/i;

    lines.forEach((line) => {
      const l = line.trim();
      if (!l) return;

      let m = injectableRegex.exec(l);
      if (!m) m = altInjectRegex.exec(l);

      if (m) {
        // m[1] maybe technique, m[2] param
        const technique = m[1] || 'unknown';
        const parameter = m[2] || 'unknown';
        vulnerabilities.push({
          type: 'SQL Injection',
          parameter,
          technique,
          severity: 'high',
          description: `${technique} SQL Injection detected in parameter ${parameter}`
        });
        return;
      }

      if (heuristicRegex.test(l)) {
        vulnerabilities.push({
          type: 'SQL Injection',
          parameter: 'unknown',
          technique: 'heuristic',
          severity: 'medium',
          description: 'Heuristic detection of possible SQL Injection'
        });
      }
    });

    return {
      vulnerabilities,
      rawOutput: trimmedRaw,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new SQLMapService();
