import React, { useState } from 'react';
import {
  Box, Card, TextField, Button, Typography, InputAdornment,
  Alert, CircularProgress, Divider, Link, Checkbox, FormControlLabel, alpha,
} from '@mui/material';
import { EmailRounded, LockRounded, GppMaybeRounded, VisibilityRounded, VisibilityOffRounded } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      // error is set in store
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.1) 0%, transparent 50%), #0a0a14',
      }}
    >
      {/* Animated background orbs */}
      <Box sx={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {[...Array(3)].map((_, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(99,102,241,0.08), transparent 70%)`,
              width: `${300 + i * 120}px`,
              height: `${300 + i * 120}px`,
              top: `${20 + i * 25}%`,
              left: `${10 + i * 30}%`,
              animation: `float${i} ${8 + i * 2}s ease-in-out infinite alternate`,
              '@keyframes float0': { from: { transform: 'translate(0,0)' }, to: { transform: 'translate(20px,-20px)' } },
              '@keyframes float1': { from: { transform: 'translate(0,0)' }, to: { transform: 'translate(-20px,20px)' } },
              '@keyframes float2': { from: { transform: 'translate(0,0)' }, to: { transform: 'translate(15px,15px)' } },
            }}
          />
        ))}
      </Box>

      <Box sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440, px: 2 }}>
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 64, height: 64, borderRadius: '18px', mb: 2,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              boxShadow: '0 8px 30px rgba(99,102,241,0.5)',
            }}
          >
            <GppMaybeRounded sx={{ fontSize: 32, color: '#fff' }} />
          </Box>
          <Typography variant="h4" fontWeight={800} sx={{ color: '#f1f5f9', letterSpacing: '-0.02em' }}>
            InvoiceAI
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Intelligent Invoice Processing & Fraud Detection
          </Typography>
        </Box>

        <Card
          sx={{
            p: 4,
            background: 'rgba(15,15,30,0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(99,102,241,0.2)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          }}
        >
          <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5, color: '#f1f5f9' }}>
            Welcome back
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
            Sign in to your account to continue
          </Typography>

          {error && (
            <Alert severity="error" onClose={clearError} sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth label="Email Address"
              type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              required disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailRounded sx={{ color: '#64748b', fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth label="Password"
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockRounded sx={{ color: '#64748b', fontSize: 18 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Button size="small" onClick={() => setShowPwd(!showPwd)} sx={{ minWidth: 0, p: 0.5, color: '#64748b' }}>
                      {showPwd ? <VisibilityOffRounded fontSize="small" /> : <VisibilityRounded fontSize="small" />}
                    </Button>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit" fullWidth variant="contained" size="large"
              disabled={isLoading || !email || !password}
              sx={{ py: 1.5, fontSize: '0.9rem', borderRadius: '12px', mb: 2 }}
            >
              {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
            </Button>
          </form>

          <Divider sx={{ my: 2 }}>
            <Typography variant="caption" sx={{ color: '#475569' }}>Demo Credentials</Typography>
          </Divider>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {[
              { label: 'Admin', email: 'admin@invoiceplatform.com', pwd: 'Admin@123456' },
              { label: 'Finance Manager', email: 'sarah.johnson@invoiceplatform.com', pwd: 'Finance@123456' },
              { label: 'Analyst', email: 'michael.chen@invoiceplatform.com', pwd: 'Analyst@123456' },
            ].map((cred) => (
              <Button
                key={cred.label}
                size="small" variant="outlined"
                onClick={() => { setEmail(cred.email); setPassword(cred.pwd); }}
                sx={{ fontSize: '0.72rem', borderRadius: '8px', borderColor: 'rgba(99,102,241,0.3)', color: '#818cf8' }}
              >
                {cred.label}
              </Button>
            ))}
          </Box>
        </Card>

        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 3, color: '#334155' }}>
          © 2024 InvoiceAI Platform. Enterprise Edition.
        </Typography>
      </Box>
    </Box>
  );
}
