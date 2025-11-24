import React, { useState, useEffect } from 'react';
import { targetsAPI } from '../services/api';
import TargetForm from '../components/TargetForm';
import './Targets.css';

function Targets() {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null);

  useEffect(() => {
    loadTargets();
  }, []);

  const loadTargets = async () => {
    try {
      setLoading(true);
      const res = await targetsAPI.getAll();
      setTargets(res.data);
    } catch (error) {
      console.error('Error loading targets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTarget = async (targetId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus target ini?')) {
      return;
    }

    try {
      await targetsAPI.delete(targetId);
      setTargets(targets.filter((target) => target._id !== targetId));
    } catch (error) {
      console.error('Error deleting target:', error);
      alert('Error menghapus target: ' + error.message);
    }
  };

  const handleSaveTarget = () => {
    setShowForm(false);
    setEditingTarget(null);
    loadTargets();
  };

  const handleEditTarget = (target) => {
    setEditingTarget(target);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingTarget(null);
  };

  if (loading) {
    return (
      <div className="targets-loading">
        <div className="spinner"></div>
        <p>Memuat daftar target...</p>
      </div>
    );
  }

  return (
    <div className="targets-page">
      <div className="targets-header">
        <h1>Management Target</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
          disabled={showForm}
        >
          ➕ Tambah Target
        </button>
      </div>

      {showForm && (
        <div className="target-form-modal">
          <div className="modal-content">
            <TargetForm
              target={editingTarget}
              onSave={handleSaveTarget}
              onCancel={handleCancelForm}
            />
          </div>
        </div>
      )}

      {targets.length === 0 && !showForm ? (
        <div className="empty-targets">
          <div className="empty-state">
            <h3>Belum ada target</h3>
            <p>Tambahkan target pertama Anda untuk memulai security testing.</p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              ➕ Tambah Target Pertama
            </button>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="targets-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>URL</th>
                <th>Jenis</th>
                <th>Dibuat</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {targets.map((target) => (
                <tr key={target._id}>
                  <td>{target.name}</td>
                  <td>
                    <a href={target.url} target="_blank" rel="noopener noreferrer">
                      {target.url}
                    </a>
                  </td>
                  <td>{target.type}</td>
                  <td>{new Date(target.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`target-status ${target.status}`}>
                      {target.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-secondary" onClick={() => handleEditTarget(target)}>
                        ✏️ Edit
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDeleteTarget(target._id)}>
                        🗑️ Hapus
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={() => (window.location.href = `/tests?target=${target._id}`)}
                      >
                        🔍 Test Sekarang
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {targets.length > 0 && (
        <div className="targets-footer">
          <p>Menampilkan {targets.length} target</p>
        </div>
      )}
    </div>
  );
}

export default Targets;
