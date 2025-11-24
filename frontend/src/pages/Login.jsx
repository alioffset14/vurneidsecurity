import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import "./Login.css";

// Import gambar dari assets
import COVER_IMAGE from "../assets/images/login-cover.png";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn(form);

    setLoading(false);
    if (res?.ok) {
      navigate(from, { replace: true });
    } else {
      setError(res?.message || "Invalid credentials.");
    }
  };

  return (
    <div className="login-page">
      <div
        className="login-cover"
        style={{ backgroundImage: `url(${COVER_IMAGE})` }}
      />

      <div className="login-card card">
        <h2>Sign in</h2>
        <p className="muted">Sign in to your account to continue</p>

        <form onSubmit={submit} className="login-form">
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
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <button
              type="button"
              className="btn"
              onClick={() =>
                setForm({ email: "demo@example.com", password: "demo" })
              }
            >
              Demo
            </button>
          </div>

          <p className="login-small-text">
            Belum punya akun? <Link to="/signup">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
