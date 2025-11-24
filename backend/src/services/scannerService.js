const sqlMapService = require('./sqlMapService');
const dalfoxService = require('./dalfoxService');
const Test = require('../models/Test');
const crypto = require('crypto');
const Report = require('../models/Report');

class ScannerService {
  getScanConfiguration(scanType = 'full-scan', scanLevel = 'medium') {
    const levelCategory = (scanLevel || 'medium').toLowerCase();
    const isAggressive = levelCategory === 'aggressive';

    const configurations = {
      'sql-basic': {
        sqlMapOptions: { level: isAggressive ? 3 : 2, risk: isAggressive ? 3 : 2, techniques: 'BEU' },
        description: 'Basic SQL Injection detection'
      },
      'sql-blind': {
        sqlMapOptions: { level: 3, risk: 2, techniques: 'B' },
        description: 'Blind SQL Injection detection'
      },
      'sql-time-based': {
        sqlMapOptions: { level: 3, risk: 2, techniques: 'T' },
        description: 'Time-based SQL Injection detection'
      },
      'xss-reflected': {
        dalfoxOptions: { scanMode: 'url', worker: isAggressive ? 20 : 10 },
        description: 'Reflected XSS detection'
      },
      'xss-stored': {
        dalfoxOptions: { scanMode: 'form', worker: 15 },
        description: 'Stored XSS detection'
      },
      'xss-dom': {
        dalfoxOptions: { scanMode: 'dom', worker: 10 },
        description: 'DOM-based XSS detection'
      },
      'full-scan': {
        sqlMapOptions: { level: 2, risk: 2, techniques: 'BEUSTQ' },
        dalfoxOptions: { scanMode: 'url-form-dom', worker: 15 },
        description: 'Comprehensive SQL Injection and XSS scan'
      }
    };

    return configurations[scanType] || configurations['full-scan'];
  }

  _makeCorrelationId() {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    return `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
  }

  _normalizeServiceResult(raw) {
    if (!raw || typeof raw !== 'object') {
      return { vulnerabilities: [], meta: {}, raw: null };
    }
    const vulnerabilities = Array.isArray(raw.vulnerabilities) ? raw.vulnerabilities : [];
    const meta = raw.meta && typeof raw.meta === 'object' ? raw.meta : {};
    return { vulnerabilities, meta, raw };
  }

  // wrap promise with timeout -> returns { result, timedOut, error }
  async _withTimeout(promise, ms) {
    if (typeof ms !== 'number' || ms <= 0) {
      try {
        const r = await promise;
        return { result: r, timedOut: false, error: null };
      } catch (err) {
        return { result: null, timedOut: false, error: err };
      }
    }

    let timer;
    try {
      const wrapped = await Promise.race([
        promise
          .then(r => ({ result: r, timedOut: false, error: null }))
          .catch(e => ({ result: null, timedOut: false, error: e })),
        new Promise(resolve => {
          timer = setTimeout(() => resolve({ result: null, timedOut: true, error: null }), ms);
        })
      ]);
      return wrapped;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  /**
   * runTest
   * customParams:
   *   - runMode: 'parallel' | 'sequential'
   *   - maxScanMs: timeout per-service in ms
   */
  async runTest(testId, targetUrl, scanType = 'full-scan', scanLevel = 'medium', customParams = {}) {
    const startTime = Date.now();
    const correlationId = this._makeCorrelationId();
    const runMode = (customParams.runMode || 'parallel').toLowerCase();
    const maxScanMs = typeof customParams.maxScanMs === 'number' ? customParams.maxScanMs : 10 * 60 * 1000; // 10 min

    if (!targetUrl || typeof targetUrl !== 'string') {
      return { success: false, error: 'Invalid targetUrl' };
    }

    try {
      await Test.findByIdAndUpdate(testId, { status: 'running', startedAt: new Date(), scanLevel, correlationId }, { new: true });
    } catch (err) {
      console.error(`[${correlationId}] Gagal update test jadi running:`, err);
    }

    const config = this.getScanConfiguration(scanType, scanLevel);
    let results = {
      sqlInjection: { vulnerabilities: [], meta: {}, raw: null },
      xss: { vulnerabilities: [], meta: {}, raw: null }
    };

    console.log(`[${correlationId}] Memulai scan: ${scanType} (level: ${scanLevel}) mode: ${runMode}`);

    try {
      const shouldRunSQL = scanType.includes('sql') || scanType === 'full-scan';
      const shouldRunXSS = scanType.includes('xss') || scanType === 'full-scan';

      const callSql = () => sqlMapService.scanSQLInjection(targetUrl, config.sqlMapOptions || {}, customParams);
      const callXss = () => dalfoxService.scanXSS(targetUrl, config.dalfoxOptions || {}, customParams);

      if (shouldRunSQL && shouldRunXSS) {
        if (runMode === 'parallel') {
          console.log(`[${correlationId}] Menjalankan SQL & XSS secara paralel...`);
          const [sqlRes, xssRes] = await Promise.all([
            this._withTimeout(callSql(), maxScanMs),
            this._withTimeout(callXss(), maxScanMs)
          ]);

          // SQL
          if (sqlRes.timedOut) {
            console.warn(`[${correlationId}] sqlMapService timed out after ${maxScanMs}ms`);
            results.sqlInjection = { vulnerabilities: [], meta: { timedOut: true }, raw: null };
          } else if (sqlRes.error) {
            console.error(`[${correlationId}] sqlMapService error:`, sqlRes.error);
            results.sqlInjection = this._normalizeServiceResult(null);
          } else {
            results.sqlInjection = this._normalizeServiceResult(sqlRes.result);
          }

          // XSS
          if (xssRes.timedOut) {
            console.warn(`[${correlationId}] dalfoxService timed out after ${maxScanMs}ms`);
            results.xss = { vulnerabilities: [], meta: { timedOut: true }, raw: null };
          } else if (xssRes.error) {
            console.error(`[${correlationId}] dalfoxService error:`, xssRes.error);
            results.xss = this._normalizeServiceResult(null);
          } else {
            results.xss = this._normalizeServiceResult(xssRes.result);
          }
        } else {
          // sequential
          console.log(`[${correlationId}] Menjalankan SQL lalu XSS secara sequential...`);
          const sqlRes = await this._withTimeout(callSql(), maxScanMs);
          if (sqlRes.timedOut) {
            console.warn(`[${correlationId}] sqlMapService timed out after ${maxScanMs}ms`);
            results.sqlInjection = { vulnerabilities: [], meta: { timedOut: true }, raw: null };
          } else if (sqlRes.error) {
            console.error(`[${correlationId}] sqlMapService error (sequential):`, sqlRes.error);
            results.sqlInjection = this._normalizeServiceResult(null);
          } else {
            results.sqlInjection = this._normalizeServiceResult(sqlRes.result);
          }

          const xssRes = await this._withTimeout(callXss(), maxScanMs);
          if (xssRes.timedOut) {
            console.warn(`[${correlationId}] dalfoxService timed out after ${maxScanMs}ms`);
            results.xss = { vulnerabilities: [], meta: { timedOut: true }, raw: null };
          } else if (xssRes.error) {
            console.error(`[${correlationId}] dalfoxService error (sequential):`, xssRes.error);
            results.xss = this._normalizeServiceResult(null);
          } else {
            results.xss = this._normalizeServiceResult(xssRes.result);
          }
        }
      } else if (shouldRunSQL) {
        console.log(`[${correlationId}] Menjalankan SQL Injection scan...`);
        const sqlRes = await this._withTimeout(callSql(), maxScanMs);
        if (sqlRes.timedOut) {
          console.warn(`[${correlationId}] sqlMapService timed out after ${maxScanMs}ms`);
          results.sqlInjection = { vulnerabilities: [], meta: { timedOut: true }, raw: null };
        } else if (sqlRes.error) {
          console.error(`[${correlationId}] sqlMapService error:`, sqlRes.error);
          results.sqlInjection = this._normalizeServiceResult(null);
        } else {
          results.sqlInjection = this._normalizeServiceResult(sqlRes.result);
        }
      } else if (shouldRunXSS) {
        console.log(`[${correlationId}] Menjalankan XSS scan...`);
        const xssRes = await this._withTimeout(callXss(), maxScanMs);
        if (xssRes.timedOut) {
          console.warn(`[${correlationId}] dalfoxService timed out after ${maxScanMs}ms`);
          results.xss = { vulnerabilities: [], meta: { timedOut: true }, raw: null };
        } else if (xssRes.error) {
          console.error(`[${correlationId}] dalfoxService error:`, xssRes.error);
          results.xss = this._normalizeServiceResult(null);
        } else {
          results.xss = this._normalizeServiceResult(xssRes.result);
        }
      } else {
        console.log(`[${correlationId}] Tidak ada scan yang dijalankan untuk scanType: ${scanType}`);
      }

      const endTime = Date.now();
      const scanDuration = Math.round((endTime - startTime) / 1000);

      const allVulnerabilities = [
        ...(results.sqlInjection?.vulnerabilities || []),
        ...(results.xss?.vulnerabilities || [])
      ];

      // Update Test -> completed
      try {
        await Test.findByIdAndUpdate(testId, {
          status: 'completed',
          results: { ...results, vulnerabilities: allVulnerabilities },
          scanDuration,
          completedAt: new Date(),
          correlationId
        });
      } catch (err) {
        console.error(`[${correlationId}] Gagal update hasil test ke DB:`, err);
      }

      // Optional: create automatic report (light). Uncomment if you want auto reports.
      try {
        const testDoc = await Test.findById(testId).populate('targetId').lean();
        if (testDoc) {
          const newReport = new Report({
            testId: testDoc._id,
            targetId: testDoc.targetId?._id || null,
            summary: `Ditemukan ${allVulnerabilities.length} vulnerabilities`,
            vulnerabilities: allVulnerabilities,
            meta: { correlationId, scanType, scanLevel, scanDuration }
          });
          await newReport.save();
          console.log(`[${correlationId}] Report otomatis dibuat: ${newReport._id}`);
        }
      } catch (err) {
        // tidak fatal — cuma log
        console.error(`[${correlationId}] Gagal membuat report otomatis:`, err);
      }

      console.log(`[${correlationId}] Scan selesai dalam ${scanDuration} detik. Ditemukan ${allVulnerabilities.length} vulnerabilities.`);

      return {
        success: true,
        results,
        scanDuration,
        vulnerabilitiesCount: allVulnerabilities.length,
        correlationId
      };
    } catch (error) {
      console.error(`[${correlationId}] Error selama scan:`, error);

      try {
        await Test.findByIdAndUpdate(testId, {
          status: 'failed',
          completedAt: new Date(),
          correlationId,
          lastError: String(error).slice(0, 1000)
        });
      } catch (err) {
        console.error(`[${correlationId}] Gagal update status failed ke DB:`, err);
      }

      return { success: false, error: String(error), scanType, correlationId };
    }
  }

  async getScanRecommendations(targetUrl) {
    const recommendations = [];
    if (typeof targetUrl !== 'string' || !targetUrl) return recommendations;

    if (targetUrl.includes('?')) {
      recommendations.push({ type: 'sql-basic', name: 'Basic SQL Injection Scan', description: 'Cocok untuk URL dengan parameter GET', priority: 'high' });
      recommendations.push({ type: 'xss-reflected', name: 'Reflected XSS Scan', description: 'Deteksi XSS pada parameter URL', priority: 'high' });
    }

    recommendations.push({ type: 'full-scan', name: 'Comprehensive Security Scan', description: 'Scan lengkap SQL Injection dan semua jenis XSS', priority: 'medium' });
    return recommendations;
  }
}

module.exports = new ScannerService();
