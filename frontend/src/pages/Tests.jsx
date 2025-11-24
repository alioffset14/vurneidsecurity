import React, { useState, useEffect } from 'react';
import { testsAPI, targetsAPI } from '../services/api';
import ScanTypeSelector from '../components/ScanTypeSelector';
import TestList from '../components/TestList';

function Tests() {
  const [step, setStep] = useState('target-input');
  const [targetUrl, setTargetUrl] = useState('');
  const [scanConfig, setScanConfig] = useState(null);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [targets, setTargets] = useState([]);

  useEffect(() => {
    loadTargets();
    loadTests();
  }, []);

  const loadTargets = async () => {
    try {
      const res = await targetsAPI.getAll();
      setTargets(res.data);
    } catch (error) {
      console.error('Error loading targets:', error);
    }
  };

  const loadTests = async () => {
    try {
      const res = await testsAPI.getAll();
      setTests(res.data);
    } catch (error) {
      console.error('Error loading tests:', error);
    }
  };

  const handleTargetSubmit = (e) => {
    e.preventDefault();
    if (targetUrl.trim()) {
      setStep('scan-select');
    }
  };

  const handleScanTypeSelected = async (config) => {
    setScanConfig(config);
    setLoading(true);

    try {
      const targetRes = await targetsAPI.create({
        url: config.targetUrl,
        name: `Scan - ${new Date().toLocaleString()}`,
        type: 'web',
      });

      await testsAPI.create({
        targetId: targetRes.data._id,
        scanType: config.scanType,
        scanLevel: config.scanLevel,
        parameters: {
          url: config.targetUrl,
          method: 'GET',
        },
      });

      setStep('results');
      loadTests();
    } catch (error) {
      console.error('Error creating test:', error);
      alert('Error membuat test: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUseExistingTarget = (target) => {
    setTargetUrl(target.url);
    setStep('scan-select');
  };

  const resetScan = () => {
    setStep('target-input');
    setTargetUrl('');
    setScanConfig(null);
  };

  return (
    <div className="tests-page">
      <h1>Security Testing</h1>

      {/* Step 1: Input Target */}
      {step === 'target-input' && (
        <div className="target-selection">
          <div className="card">
            <h3>Step 1: Pilih Target</h3>

            {/* Input URL Baru */}
            <form onSubmit={handleTargetSubmit} className="new-target-form">
              <div className="form-group">
                <label>URL Target Baru:</label>
                <input
                  type="url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://example.com/page.php?id=1"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Lanjutkan ke Pemilihan Scan
              </button>
            </form>

            {/* Pilih dari Target Existing */}
            {targets.length > 0 && (
              <div className="existing-targets">
                <h4>Atau pilih dari target existing:</h4>
                <div className="table-container">
                  <table className="targets-table">
                    <thead>
                      <tr>
                        <th>Nama</th>
                        <th>URL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {targets.map((target) => (
                        <tr
                          key={target._id}
                          onClick={() => handleUseExistingTarget(target)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>{target.name}</td>
                          <td>
                            <a href={target.url} target="_blank" rel="noreferrer">
                              {target.url}
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Daftar Security Tests */}
          <div style={{ marginTop: '30px' }}>
            <TestList tests={tests} onTestUpdate={loadTests} />
          </div>
        </div>
      )}

      {/* Step 2: Pilih Scan */}
      {step === 'scan-select' && (
        <div className="card">
          <ScanTypeSelector
            targetUrl={targetUrl}
            onScanTypeSelected={handleScanTypeSelected}
          />
          <div className="scan-navigation">
            <button
              onClick={() => setStep('target-input')}
              className="btn btn-secondary"
            >
              ← Kembali ke Input URL
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Hasil Scan */}
      {step === 'results' && (
        <div>
          <div className="card scan-in-progress">
            <h3>🔄 Scan Sedang Berjalan</h3>
            <div className="scan-info">
              <p><strong>Target:</strong> {targetUrl}</p>
              <p><strong>Jenis Scan:</strong> {scanConfig?.scanType}</p>
              <p><strong>Level:</strong> {scanConfig?.scanLevel}</p>
            </div>

            <div className="progress-container">
              <div className="progress-bar">
                <div className="progress-fill indeterminate"></div>
              </div>
              <p>Memindai vulnerabilities... Harap tunggu.</p>
            </div>

            <div className="scan-actions">
              <button onClick={resetScan} className="btn btn-primary">
                🆕 Mulai Scan Baru
              </button>
              <button onClick={loadTests} className="btn btn-secondary">
                🔄 Refresh Status
              </button>
            </div>
          </div>

          <TestList tests={tests} onTestUpdate={loadTests} />
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Memproses...</p>
        </div>
      )}
    </div>
  );
}

export default Tests;
