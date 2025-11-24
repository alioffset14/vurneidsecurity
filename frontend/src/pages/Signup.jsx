import React, { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import "./Signup.css";

// Import gambar dari assets
import COVER_IMAGE from "../assets/images/login-cover.png";

export default function Signup() {
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullname: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signUp(form);

    if (!res.ok) {
      setError(res.message);
      setLoading(false);
      return;
    }

    // Auto login jika token tidak diberikan
    if (!res.tokenProvided) {
      await signIn({ email: form.email, password: form.password });
    }

    navigate("/", { replace: true });
  };

  return (
    <div className="signup-page">
      <div
        className="signup-cover"
        style={{ backgroundImage: `url(${COVER_IMAGE})` }}
      />

      <div className="signup-card card">
        <h2>Create Account</h2>
        <p className="muted">Sign up to get started</p>

        <form onSubmit={submit} className="signup-form">
          <div className="form-group">
            <label>Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{ marginTop: 10 }}
          >
            {loading ? "Creating..." : "Create account"}
          </button>

          <p className="signup-small-text">
            Sudah punya akun? <a href="/login">Sign in</a>
          </p>
        </form>
      </div>
    </div>
  );
}
