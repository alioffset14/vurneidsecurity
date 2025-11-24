import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../services/api';
import ReportViewer from '../components/ReportViewer';
import './Reports.css';

function Reports() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await reportsAPI.getAll();
      setReports(res.data);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (testId) => {
    try {
      setGenerating(true);
      const res = await reportsAPI.generate({ testId });
      setReports(prev => [res.data, ...prev]);
      setSelectedReport(res.data._id);
      alert('Laporan berhasil dibuat!');
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error membuat laporan: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus laporan ini?')) {
      return;
    }

    try {
      await reportsAPI.delete(reportId);
      setReports(reports.filter(report => report._id !== reportId));
      if (selectedReport === reportId) {
        setSelectedReport(null);
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Error menghapus laporan: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="reports-loading">
        <div className="spinner"></div>
        <p>Memuat laporan...</p>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <h1>Security Reports</h1>
      
      <div className="reports-layout">
        {/* Reports List */}
        <div className="reports-sidebar">
          <div className="sidebar-header">
            <h3>Daftar Laporan</h3>
            <button 
              className="btn btn-secondary"
              onClick={loadReports}
            >
              🔄 Refresh
            </button>
          </div>

          {reports.length === 0 ? (
            <div className="empty-reports">
              <p>Belum ada laporan</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Tanggal</th>
                    <th>Jumlah Vulnerabilities</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report, index) => (
                    <tr
                      key={report._id}
                      className={selectedReport === report._id ? 'selected' : ''}
                      onClick={() => setSelectedReport(report._id)}
                    >
                      <td>{index + 1}</td>
                      <td>
                        {report.createdAt
                          ? new Date(report.createdAt).toLocaleString("en-GB", { timeZone: "Asia/Jakarta" })
                          : '-'}
                      </td>
                      <td>{(report.vulnerabilities || []).length}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteReport(report._id);
                          }}
                        >
                          🗑️ Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Report Viewer */}
        <div className="report-content">
          {selectedReport ? (
            <ReportViewer reportId={selectedReport} />
          ) : (
            <div className="no-report-selected">
              <h3>Pilih Laporan</h3>
              <p>Pilih laporan dari daftar untuk melihat detail</p>
              {reports.length === 0 && (
                <div className="get-started">
                  <p>Mulai dengan menjalankan security test terlebih dahulu</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => window.location.href = '/tests'}
                  >
                    🚀 Jalankan Security Test
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;
