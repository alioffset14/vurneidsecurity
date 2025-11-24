import React, { useState, useEffect } from 'react';
import { testsAPI } from '../services/api';
import TestDetailsTable from './TestDetailsTable'; // ✅ import table view

function TestList({ tests: initialTests, onTestUpdate }) {
  const [tests, setTests] = useState(initialTests || []);
  const [loading, setLoading] = useState(!initialTests);
  const [selectedTest, setSelectedTest] = useState(null);

  useEffect(() => {
    if (!initialTests) {
      loadTests();
    } else {
      setTests(initialTests);
    }
  }, [initialTests]);

  const loadTests = async () => {
    try {
      setLoading(true);
      const res = await testsAPI.getAll();
      setTests(res.data);
    } catch (error) {
      console.error('Error loading tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTest = async (testId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus test ini?')) return;

    try {
      await testsAPI.delete(testId);
      setTests(tests.filter(test => test._id !== testId));
      onTestUpdate?.();
    } catch (error) {
      console.error('Error deleting test:', error);
      alert('Error menghapus test: ' + error.message);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'running': return '🔄';
      case 'failed': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  const getSeveritySummary = (vulnerabilities) => {
    if (!vulnerabilities || vulnerabilities.length === 0) {
      return 'No vulnerabilities';
    }

    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    vulnerabilities.forEach(vuln => {
      if (counts.hasOwnProperty(vuln.severity)) {
        counts[vuln.severity]++;
      }
    });

    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([severity, count]) => `${count} ${severity}`)
      .join(', ');
  };

  if (loading) {
    return (
      <div className="test-list-loading">
        <div className="spinner"></div>
        <p>Memuat daftar test...</p>
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <div className="empty-tests">
        <div className="empty-state">
          <h3>Belum ada test security</h3>
          <p>Jalankan security scan pertama Anda untuk mulai mendeteksi vulnerabilities.</p>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.href = '/tests'}
          >
            🚀 Jalankan Scan Pertama
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="test-list">
      <div className="test-list-header">
        <h3>Daftar Security Tests</h3>
        <button 
          className="btn btn-secondary"
          onClick={loadTests}
        >
          🔄 Refresh
        </button>
      </div>

      <div className="tests-grid">
        {tests.map(test => (
          <div key={test._id} className="test-card">
            <div className="test-card-header">
              <div className="test-title">
                <h4>{test.targetId?.name || 'Unknown Target'}</h4>
                <span className="test-type">{test.scanType}</span>
              </div>
              <div className="test-actions">
                <button 
                  className="btn-icon"
                  onClick={() => setSelectedTest(selectedTest?._id === test._id ? null : test)}
                  title="Detail"
                >
                  🔍
                </button>
                <button 
                  className="btn-icon"
                  onClick={() => handleDeleteTest(test._id)}
                  title="Hapus"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="test-info">
              <div className="test-status">
                <span className={`status-badge status-${test.status}`}>
                  {getStatusIcon(test.status)} {test.status}
                </span>
              </div>
              
              <div className="test-meta">
                <span>Level: {test.scanLevel}</span>
                <span>Started: {new Date(test.startedAt).toLocaleString()}</span>
                {test.scanDuration && (
                  <span>Duration: {test.scanDuration}s</span>
                )}
              </div>
            </div>

            {test.results && (
              <div className="test-results">
                <div className="vulnerability-summary">
                  {getSeveritySummary(test.results.vulnerabilities)}
                </div>
              </div>
            )}

            {/* ✅ Detail pakai tabel, bukan JSON */}
            {selectedTest?._id === test._id && (
              <div className="test-details">
                <TestDetailsTable test={test} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="test-list-footer">
        <p>Menampilkan {tests.length} tests</p>
      </div>
    </div>
  );
}

export default TestList;
