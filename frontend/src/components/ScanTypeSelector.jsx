import React, { useState, useEffect } from 'react';
import './ScanTypeSelector.css';

function ScanTypeSelector({ targetUrl, onScanTypeSelected }) {
  const [recommendations, setRecommendations] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [scanLevel, setScanLevel] = useState('medium');

  const scanTypes = [
    { id: 'sql-basic', name: 'Basic SQL Injection Scan', description: 'Deteksi SQL Injection dasar dengan teknik Boolean, Error-based, dan Union', icon: '🛡️', estimatedTime: '2-5 menit' },
    { id: 'sql-blind', name: 'Blind SQL Injection Scan', description: 'Deteksi Blind SQL Injection yang tidak menampilkan error', icon: '👁️', estimatedTime: '5-10 menit' },
    { id: 'sql-time-based', name: 'Time-based SQL Injection Scan', description: 'Deteksi SQL Injection menggunakan teknik time-based', icon: '⏱️', estimatedTime: '10-15 menit' },
    { id: 'xss-reflected', name: 'Reflected XSS Scan', description: 'Deteksi Reflected XSS pada parameter URL', icon: '↩️', estimatedTime: '3-7 menit' },
    { id: 'xss-stored', name: 'Stored XSS Scan', description: 'Deteksi Stored XSS pada form input', icon: '💾', estimatedTime: '5-10 menit' },
    { id: 'xss-dom', name: 'DOM-based XSS Scan', description: 'Deteksi DOM-based XSS', icon: '🌐', estimatedTime: '7-12 menit' },
    { id: 'full-scan', name: 'Comprehensive Security Scan', description: 'Scan lengkap semua jenis SQL Injection dan XSS', icon: '🔍', estimatedTime: '15-30 menit' }
  ];

  const levels = [
    { id: 'low', name: 'Low', description: 'Scan cepat, coverage terbatas' },
    { id: 'medium', name: 'Medium', description: 'Balance antara speed dan coverage' },
    { id: 'high', name: 'High', description: 'Scan mendetail, waktu lebih lama' },
    { id: 'aggressive', name: 'Aggressive', description: 'Scan sangat mendetail, waktu lama' }
  ];

  useEffect(() => {
    if (targetUrl) {
      const recs = [];
      if (targetUrl.includes('?')) recs.push('sql-basic', 'xss-reflected');
      if (targetUrl.includes('/admin') || targetUrl.includes('/login')) recs.push('sql-blind', 'xss-stored');
      recs.push('full-scan');
      setRecommendations(recs);
      setSelectedType(recs[0]);
    }
  }, [targetUrl]);

  const handleStartScan = () => {
    if (selectedType) {
      onScanTypeSelected({ scanType: selectedType, scanLevel, targetUrl });
    }
  };

  const isRecommended = (typeId) => recommendations.includes(typeId);

  return (
    <div className="scan-type-selector">
      <h3>Pilih Jenis Security Scan</h3>
      <p className="target-url">Target: <strong>{targetUrl}</strong></p>

      {/* Pilih Level Scan */}
      <div className="form-group">
        <label>Level Scan:</label>
        <div className="level-buttons">
          {levels.map(level => (
            <button
              key={level.id}
              className={`level-btn ${scanLevel === level.id ? 'active' : ''}`}
              onClick={() => setScanLevel(level.id)}
            >
              <strong>{level.name}</strong>
              <small>{level.description}</small>
            </button>
          ))}
        </div>
      </div>

      {/* Raw Table untuk Jenis Scan */}
      <table className="scan-types-table">
        <thead>
          <tr>
            <th>Ikon</th>
            <th>Nama</th>
            <th>Deskripsi</th>
            <th>Estimasi</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {scanTypes.map(type => (
            <tr
              key={type.id}
              className={selectedType === type.id ? 'selected-row' : ''}
              onClick={() => setSelectedType(type.id)}
            >
              <td>{type.icon}</td>
              <td><strong>{type.name}</strong></td>
              <td>{type.description}</td>
              <td>{type.estimatedTime}</td>
              <td>
                {selectedType === type.id && <span className="status selected">✓ Terpilih</span>}
                {isRecommended(type.id) && <span className="status recommended">Rekomendasi</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Tombol Mulai Scan */}
      <div className="scan-actions">
        <button className="btn btn-primary" onClick={handleStartScan} disabled={!selectedType}>
          🚀 Mulai Security Scan
        </button>
      </div>
    </div>
  );
}

export default ScanTypeSelector;
