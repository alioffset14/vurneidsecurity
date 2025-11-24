// src/components/TestDetailsTable.js
import React from 'react';
import './TestDetailsTable.css';

function TestDetailsTable({ test }) {
  if (!test) return <div>No test data</div>;

  const formatDate = (iso) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleString('en-GB', { timeZone: 'Asia/Jakarta' });
    } catch {
      return String(iso);
    }
  };

  const safe = (v, fallback = '—') => {
    if (v === null || v === undefined || v === '') return fallback;
    return v;
  };

  const allVulns =
    (test.results && Array.isArray(test.results.vulnerabilities) && test.results.vulnerabilities) ||
    (Array.isArray(test.vulnerabilities) && test.vulnerabilities) ||
    [];

  const severityClass = (sev = '') => {
    const s = (sev || 'unknown').toLowerCase();
    if (s === 'critical') return 'severity-critical';
    if (s === 'high') return 'severity-high';
    if (s === 'medium') return 'severity-medium';
    if (s === 'low') return 'severity-low';
    return 'severity-unknown';
  };

  return (
    <div className="test-details-table">
      <h3>Detail Test</h3>

      {/* Info Table */}
      <div className="table-container">
        <table className="info-table">
          <thead>
            <tr>
              <th colSpan="2">Test Info</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Test ID</strong></td>
              <td>{safe(test._id)}</td>
            </tr>
            <tr>
              <td><strong>Target</strong></td>
              <td>
                {safe(test.targetId?.name)} —{" "}
                <a href={test.targetId?.url || '#'} target="_blank" rel="noreferrer">
                  {safe(test.targetId?.url)}
                </a>
              </td>
            </tr>
            <tr>
              <td><strong>Scan Type</strong></td>
              <td>{safe(test.scanType)}</td>
            </tr>
            <tr>
              <td><strong>Scan Level</strong></td>
              <td>{safe(test.scanLevel)}</td>
            </tr>
            <tr>
              <td><strong>Parameters</strong></td>
              <td>
                {test.parameters ? (
                  <table className="nested-table">
                    <tbody>
                      {Object.entries(test.parameters).map(([k, v], i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 'bold' }}>{k}</td>
                          <td>{String(v)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : '—'}
              </td>
            </tr>
            <tr>
              <td><strong>Status</strong></td>
              <td>{safe(test.status)}</td>
            </tr>
            <tr>
              <td><strong>Scan Duration</strong></td>
              <td>{safe(test.scanDuration, 0)} detik</td>
            </tr>
            <tr>
              <td><strong>Created At (Generated)</strong></td>
              <td>{formatDate(test.createdAt)}</td>
            </tr>
            <tr>
              <td><strong>Started At</strong></td>
              <td>{formatDate(test.startedAt)}</td>
            </tr>
            <tr>
              <td><strong>Completed At</strong></td>
              <td>{formatDate(test.completedAt)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Vulnerabilities Table */}
      <div className="table-container" style={{ marginTop: 20 }}>
        <table className="vulnerabilities-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Severity</th>
              <th>Type</th>
              <th>Description</th>
              <th>Parameter</th>
              <th>Technique</th>
              <th>Payload</th>
              <th>Evidence</th>
              <th>URL</th>
            </tr>
          </thead>
          <tbody>
            {allVulns.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center' }}>No vulnerabilities found</td>
              </tr>
            ) : (
              allVulns.map((v, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>
                    <span className={`severity-badge ${severityClass(v.severity)}`}>
                      {String((v.severity || 'unknown')).toUpperCase()}
                    </span>
                  </td>
                  <td>{safe(v.type)}</td>
                  <td style={{ whiteSpace: 'pre-wrap' }}>{safe(v.description || v.msg || '')}</td>
                  <td>{safe(v.parameter || v.param || v.p || (v.parameter === 0 ? 0 : 'unknown'))}</td>
                  <td>{safe(v.technique || v.method || '')}</td>
                  <td><code>{safe(v.payload || v.poc || '')}</code></td>
                  <td style={{ whiteSpace: 'pre-wrap' }}>{safe(v.evidence || v.verify || v.proof || '')}</td>
                  <td>{safe(v.url || test.targetId?.url || '')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TestDetailsTable;
