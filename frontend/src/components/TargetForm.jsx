import React, { useState, useEffect } from 'react';
import { targetsAPI } from '../services/api';

function TargetForm({ target, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    type: 'web'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (target) {
      setFormData({
        name: target.name || '',
        url: target.url || '',
        description: target.description || '',
        type: target.type || 'web'
      });
    }
  }, [target]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama target diperlukan';
    }

    if (!formData.url.trim()) {
      newErrors.url = 'URL target diperlukan';
    } else if (!isValidUrl(formData.url)) {
      newErrors.url = 'URL tidak valid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (target) {
        // Update existing target
        await targetsAPI.update(target._id, formData);
      } else {
        // Create new target
        await targetsAPI.create(formData);
      }
      
      onSave?.();
    } catch (error) {
      console.error('Error saving target:', error);
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="target-form">
      <h3>{target ? 'Edit Target' : 'Tambah Target Baru'}</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Nama Target *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Contoh: Website Produksi"
            className={errors.name ? 'error' : ''}
          />
          {errors.name && <span className="error-text">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="url">URL Target *</label>
          <input
            type="url"
            id="url"
            name="url"
            value={formData.url}
            onChange={handleChange}
            placeholder="https://example.com"
            className={errors.url ? 'error' : ''}
          />
          {errors.url && <span className="error-text">{errors.url}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="type">Jenis Target</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
          >
            <option value="web">Web Application</option>
            <option value="api">API</option>
            <option value="mobile">Mobile Backend</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="description">Deskripsi</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Deskripsi target testing..."
            rows="3"
          />
        </div>

        {errors.submit && (
          <div className="error-message">
            {errors.submit}
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={loading}
          >
            Batal
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Menyimpan...' : (target ? 'Update' : 'Simpan')}
          </button>
        </div>
      </form>

      <div className="form-tips">
        <h4>Tips:</h4>
        <ul>
          <li>Pastikan URL target dapat diakses dari server</li>
          <li>Untuk testing API, gunakan endpoint lengkap dengan protocol</li>
          <li>Gunakan deskripsi yang jelas untuk identifikasi</li>
        </ul>
      </div>
    </div>
  );
}

export default TargetForm;