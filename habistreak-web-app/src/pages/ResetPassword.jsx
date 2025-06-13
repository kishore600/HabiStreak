import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      await axios.put(
        `https://habisteak.onrender.com/api/auth/resetpassword/${token}`,
        { password }
      );
      setSuccess('Password reset successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.logo}>HabiStreak</h2>
        <form onSubmit={handleReset} style={styles.form}>
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={styles.input}
          />
          <button type="submit" style={styles.button}>Reset Password</button>
          {error && <p style={styles.error}>{error}</p>}
          {success && <p style={styles.success}>{success}</p>}
        </form>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
    padding: '1.5rem'
  },
  card: {
    width: '100%',
    maxWidth: '22rem',
    backgroundColor: '#fff',
    padding: '2rem 1.25rem',
    borderRadius: '0.75rem',
    boxShadow: '0 0 10px rgba(0,0,0,0.05)',
    textAlign: 'center'
  },
  logo: {
    fontSize: '1.5rem',
    marginBottom: '1.25rem',
    fontWeight: 600,
    color: '#262626'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  input: {
    padding: '0.75rem 0.875rem',
    fontSize: '1rem',
    borderRadius: '0.5rem',
    border: '1px solid #dbdbdb',
    color:'black',
    backgroundColor: '#fafafa'
  },
  button: {
    marginTop: '0.75rem',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    border: 'none',
    backgroundColor: '#0095f6',
    color: '#fff',
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'pointer'
  },
  error: {
    marginTop: '0.75rem',
    color: '#ed4956',
    fontSize: '0.875rem'
  },
  success: {
    marginTop: '0.75rem',
    color: '#2ecc71',
    fontSize: '0.875rem'
  }
};

export default ResetPassword;
