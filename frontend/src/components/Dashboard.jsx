import React, { useState, useEffect } from 'react';
import { testsAPI, targetsAPI, reportsAPI } from '../services/api';
import RecentTestsTable from "./RecentTestsTable";
import "./Dashboard.css";

function Dashboard() {
  const [stats, setStats] = useState({
    totalTargets: 0,
    totalTests: 0,
    totalReports: 0,
    vulnerabilities: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    }
  });
  const [recentTests, setRecentTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [targetsRes, testsRes, reportsRes] = await Promise.all([
        targetsAPI.getAll(),
        testsAPI.getAll(),
        reportsAPI.getAll()
      ]);

      // Hitung statistik vulnerabilities
      const allVulnerabilities = testsRes.data.flatMap(test => 
        test.results?.vulnerabilities || []
      );

      const vulnerabilityStats = {
        critical: allVulnerabilities.filter(v => v.severity === 'critical').length,
        high: allVulnerabilities.filter(v => v.severity === 'high').length,
        medium: allVulnerabilities.filter(v => v.severity === 'medium').length,
        low: allVulnerabilities.filter(v => v.severity === 'low').length
      };

      setStats({
        totalTargets: targetsRes.data.length,
        totalTests: testsRes.data.length,
        totalReports: reportsRes.data.length,
        vulnerabilities: vulnerabilityStats
      });

      // Ambil 5 test terbaru, urutkan by startedAt desc
      const sortedTests = testsRes.data.sort(
        (a, b) => new Date(b.startedAt) - new Date(a.startedAt)
      );
      setRecentTests(sortedTests.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityClass = (severity) => {
    return `severity-${severity.toLowerCase()}`;
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Memuat dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Security Dashboard</h1>
        <p>Overview aktivitas penetration testing</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-info">
            <h3>{stats.totalTargets}</h3>
            <p>Total Targets</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔍</div>
          <div className="stat-info">
            <h3>{stats.totalTests}</h3>
            <p>Total Tests</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>{stats.totalReports}</h3>
            <p>Total Reports</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <h3>{Object.values(stats.vulnerabilities).reduce((a, b) => a + b, 0)}</h3>
            <p>Total Vulnerabilities</p>
          </div>
        </div>
      </div>

      {/* Vulnerability Breakdown */}
      <div className="vulnerability-stats">
        <h3>Vulnerability Breakdown</h3>
        <div className="severity-bars">
          {Object.entries(stats.vulnerabilities).map(([severity, count]) => (
            <div key={severity} className="severity-bar">
              <div className="severity-label">
                <span className={`severity-dot ${getSeverityClass(severity)}`}></span>
                {severity.toUpperCase()}
              </div>
              <div className="bar-container">
                <div 
                  className={`bar-fill ${getSeverityClass(severity)}`}
                  style={{ width: `${(count / Math.max(1, Object.values(stats.vulnerabilities).reduce((a, b) => a + b, 0))) * 100}%` }}
                ></div>
              </div>
              <span className="severity-count">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Tests as Table */}
      <div className="recent-tests">
        {recentTests.length === 0 ? (
          <div className="empty-state">
            <p>Belum ada test yang dijalankan</p>
          </div>
        ) : (
          <RecentTestsTable tests={recentTests} />
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button className="action-btn" onClick={() => window.location.href = '/targets'}>
            ➕ Tambah Target Baru
          </button>
          <button className="action-btn" onClick={() => window.location.href = '/tests'}>
            🔍 Jalankan Security Scan
          </button>
          <button className="action-btn" onClick={() => window.location.href = '/reports'}>
            📊 Lihat Laporan
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
