import React, { useState, useEffect } from 'react';
import './ReportViewer.css';
import { reportsAPI } from '../services/api';

function ReportViewer({ reportId }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const res = await reportsAPI.getById(reportId);
      setReport(res.data || null);
    } catch (error) {
      console.error('Error loading report:', error);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    if (format === 'pdf') {
      window.open(`/api/reports/${reportId}/export/pdf`, '_blank');
      return;
    }
    if (format === 'json') {
      if (!report) return;
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const getSeverityClass = (severity) => {
    if (!severity || typeof severity !== 'string') return 'severity-unknown';
    return `severity-${severity.toLowerCase()}`;
  };

  const renderDate = (isoOrStr, formattedStr) => {
    if (formattedStr) return formattedStr;
    if (!isoOrStr) return '—';
    try {
      const d = new Date(isoOrStr);
      return d.toLocaleString('en-GB', { timeZone: 'Asia/Jakarta' });
    } catch {
      return String(isoOrStr);
    }
  };

  if (loading) {
    return (
      <div className="report-loading">
        <div className="spinner"></div>
        <p>Memuat laporan...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="report-error">
        <p>Laporan tidak ditemukan</p>
      </div>
    );
  }

  // fallback data
  const details = Array.isArray(report.details)
    ? report.details
    : Array.isArray(report.vulnerabilities)
    ? report.vulnerabilities
    : [];
  const summary = report.summary || {
    totalVulnerabilities: details.length,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  return (
    <div className="report-viewer">
      <div className="report-header">
        <div className="report-title">
          <h2>{report.title || 'Security Report'}</h2>
          <p>
            Generated: {renderDate(report.generatedAt, report.generatedAtStr)}
            {report.scanStartedAt || report.scanStartedAtStr ? (
              <span>
                {' '}
                — Scan started: {renderDate(report.scanStartedAt, report.scanStartedAtStr)}
              </span>
            ) : null}
          </p>
        </div>
        <div className="report-actions">
          <button
            className="btn btn-secondary"
            onClick={() => handleExport('pdf')}
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : '📄 Export PDF'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => handleExport('json')}
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : '📊 Export JSON'}
          </button>
        </div>
      </div>

      {/* Summary Table */}
      <div className="table-container">
        <table className="summary-table">
          <thead>
            <tr>
              <th>Total</th>
              <th>Critical</th>
              <th>High</th>
              <th>Medium</th>
              <th>Low</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{summary.totalVulnerabilities}</td>
              <td>{summary.critical}</td>
              <td>{summary.high}</td>
              <td>{summary.medium}</td>
              <td>{summary.low}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tabs */}
      <div className="report-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'vulnerabilities' ? 'active' : ''}`}
          onClick={() => setActiveTab('vulnerabilities')}
        >
          Vulnerabilities ({details.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          Recommendations
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <h3>Executive Summary</h3>
            <p>
              Security scan dilakukan pada {renderDate(report.generatedAt, report.generatedAtStr)}. 
              Ditemukan {summary.totalVulnerabilities} vulnerabilities dengan
              {summary.critical > 0 && ` ${summary.critical} critical,`}
              {summary.high > 0 && ` ${summary.high} high,`}
              {summary.medium > 0 && ` ${summary.medium} medium,`}
              {summary.low > 0 && ` ${summary.low} low severity vulnerabilities.`}
            </p>

            <div className="risk-assessment">
              <h4>Risk Assessment</h4>
              {summary.critical > 0 ? (
                <div className="risk-level high-risk">🔴 HIGH RISK - Immediate action required</div>
              ) : summary.high > 0 ? (
                <div className="risk-level medium-risk">🟡 MEDIUM RISK - Action recommended</div>
              ) : (
                <div className="risk-level low-risk">🟢 LOW RISK - Monitor regularly</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'vulnerabilities' && (
          <div className="vulnerabilities-tab">
            <div className="table-container">
              {details.length === 0 ? (
                <p>Tidak ada vulnerabilities ditemukan.</p>
              ) : (
                <table className="vulnerabilities-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Severity</th>
                      <th>Type</th>
                      <th>Parameter</th>
                      <th>Payload</th>
                      <th>URL</th>
                      <th>Evidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.map((vuln, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>
                          <span className={`severity-badge ${getSeverityClass(vuln.severity)}`}>
                            {String(vuln.severity || 'unknown').toUpperCase()}
                          </span>
                        </td>
                        <td>{vuln.type || 'Unknown'}</td>
                        <td>{vuln.parameter || 'unknown'}</td>
                        <td><code>{vuln.payload || '-'}</code></td>
                        <td>{vuln.url || '-'}</td>
                        <td>{vuln.evidence || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="recommendations-tab">
            <h3>Security Recommendations</h3>
            <ul className="recommendations-list">
              {(report.recommendations || []).map((rec, index) => (
                <li key={index} className="recommendation-item">
                  <span className="rec-number">{index + 1}.</span>
                  <span className="rec-text">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportViewer;
