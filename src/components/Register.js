import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../config";

export default function Register() {
  const [username, setUsername] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const registerData = { username, rollNumber, password };

    fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registerData),
    })
      .then((res) => res.json())
      .then((data) => {
        setIsLoading(false);
        if (data.message === "Registration successful") {
          setSuccess(true);
          // Wait 2 seconds before redirecting
          setTimeout(() => {
            navigate("/login");
          }, 2000);
        } else {
          setError(data.message || "Registration failed");
        }
      })
      .catch((err) => {
        setIsLoading(false);
        setError("Network error. Please try again.");
        console.error("Error:", err);
      });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "20px",
          padding: "40px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
          maxWidth: "500px",
          width: "100%",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              margin: "0 auto 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 10px 20px rgba(102, 126, 234, 0.3)",
            }}
          >
            <span style={{ fontSize: "2rem", color: "white" }}>📝</span>
          </div>
          <h1
            style={{
              color: "#2c3e50",
              fontSize: "2.2rem",
              fontWeight: "bold",
              margin: "0 0 10px 0",
            }}
          >
            Student Registration
          </h1>
          <p style={{ color: "#7f8c8d", fontSize: "1rem", margin: "0" }}>
            Create your account for AI proctored exams
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                backgroundColor: "#f8d7da",
                color: "#721c24",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "20px",
                border: "1px solid #f5c6cb",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>⚠️</span>
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                backgroundColor: "#d4edda",
                color: "#155724",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "20px",
                border: "1px solid #c3e6cb",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>✅</span>
              Registration successful! Redirecting to login...
            </div>
          )}

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#2c3e50",
                fontWeight: "600",
                fontSize: "0.9rem",
              }}
            >
              👤 Full Name
            </label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={success}
              style={{
                width: "100%",
                padding: "15px",
                border: "2px solid #e9ecef",
                borderRadius: "10px",
                fontSize: "1rem",
                transition: "border-color 0.3s ease",
                boxSizing: "border-box",
                opacity: success ? 0.6 : 1,
              }}
              onFocus={(e) => (e.target.style.borderColor = "#667eea")}
              onBlur={(e) => (e.target.style.borderColor = "#e9ecef")}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#2c3e50",
                fontWeight: "600",
                fontSize: "0.9rem",
              }}
            >
              🆔 Roll Number
            </label>
            <input
              type="text"
              placeholder="Enter your roll number"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              required
              disabled={success}
              style={{
                width: "100%",
                padding: "15px",
                border: "2px solid #e9ecef",
                borderRadius: "10px",
                fontSize: "1rem",
                transition: "border-color 0.3s ease",
                boxSizing: "border-box",
                opacity: success ? 0.6 : 1,
              }}
              onFocus={(e) => (e.target.style.borderColor = "#667eea")}
              onBlur={(e) => (e.target.style.borderColor = "#e9ecef")}
            />
          </div>

          <div style={{ marginBottom: "30px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#2c3e50",
                fontWeight: "600",
                fontSize: "0.9rem",
              }}
            >
              🔒 Password
            </label>
            <input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={success}
              style={{
                width: "100%",
                padding: "15px",
                border: "2px solid #e9ecef",
                borderRadius: "10px",
                fontSize: "1rem",
                transition: "border-color 0.3s ease",
                boxSizing: "border-box",
                opacity: success ? 0.6 : 1,
              }}
              onFocus={(e) => (e.target.style.borderColor = "#667eea")}
              onBlur={(e) => (e.target.style.borderColor = "#e9ecef")}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || success}
            style={{
              width: "100%",
              padding: "15px",
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "1.1rem",
              fontWeight: "bold",
              cursor: isLoading || success ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 5px 15px rgba(102, 126, 234, 0.3)",
              opacity: isLoading || success ? 0.7 : 1,
            }}
          >
            {isLoading ? "🔄 Registering..." : success ? "✅ Success!" : "Register"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button
            onClick={() => navigate("/login")}
            disabled={success}
            style={{
              background: "none",
              color: "#667eea",
              border: "none",
              fontWeight: "bold",
              cursor: success ? "not-allowed" : "pointer",
              fontSize: "1rem",
              textDecoration: "underline",
              opacity: success ? 0.5 : 1,
            }}
          >
            Already have an account? Login here
          </button>
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: "20px",
            paddingTop: "20px",
            borderTop: "1px solid #e9ecef",
          }}
        >
          <p style={{ color: "#7f8c8d", fontSize: "0.9rem", margin: "0" }}>
            🔐 Secure registration for online exams
          </p>
        </div>
      </div>
    </div>
  );
}