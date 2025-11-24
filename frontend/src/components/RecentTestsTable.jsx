import React from "react";
import "./RecentTestsTable.css";

function RecentTestsTable({ tests }) {
  if (!tests || tests.length === 0) {
    return <p>Tidak ada test terbaru</p>;
  }

  const formatDate = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Jakarta" });
    } catch {
      return String(iso);
    }
  };

  return (
    <div className="table-container">
      <h3>Recent Tests</h3>
      <table className="recent-tests-table">
        <thead>
          <tr>
            <th>Nama</th>
            <th>Type</th>
            <th>Level</th>
            <th>Status</th>
            <th>Started</th>
            <th>Vulns</th>
          </tr>
        </thead>
        <tbody>
          {tests.map((test, i) => (
            <tr key={i}>
              <td>{test.targetId?.name || `Scan - ${formatDate(test.startedAt)}`}</td>
              <td>{test.scanType}</td>
              <td>{test.scanLevel}</td>
              <td>
                <span className={`status-badge status-${test.status}`}>
                  {test.status}
                </span>
              </td>
              <td>{formatDate(test.startedAt)}</td>
              <td>{test.results?.vulnerabilities?.length || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RecentTestsTable;
