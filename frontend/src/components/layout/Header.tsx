import React from 'react';
import {
  AppBar, Toolbar, Typography, IconButton, Badge, Avatar, Box,
  Tooltip, InputBase, Breadcrumbs, Link, alpha,
} from '@mui/material';
import {
  NotificationsRounded, LogoutRounded, SearchRounded, LightbulbRounded,
  NavigateNextRounded,
} from '@mui/icons-material';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../../store';
import { getInitials } from '../../utils';
import { DRAWER_WIDTH } from './Sidebar';

const PATH_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  upload: 'Upload Invoice',
  invoices: 'Invoice Management',
  fraud: 'Fraud Detection',
  vendors: 'Vendor Management',
  approvals: 'Approval Queue',
  analytics: 'Analytics',
  notifications: 'Notifications',
  users: 'User Management',
  audit: 'Audit Logs',
};

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();

  const segments = location.pathname.split('/').filter(Boolean);
  const pageTitle = PATH_LABELS[segments[0]] || 'InvoiceAI';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <AppBar
      position="fixed"
      sx={{ left: DRAWER_WIDTH, width: `calc(100% - ${DRAWER_WIDTH}px)`, zIndex: 1200 }}
    >
      <Toolbar sx={{ minHeight: '64px !important', px: 3 }}>
        {/* Breadcrumb / Page title */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700} sx={{ color: '#f1f5f9', lineHeight: 1 }}>
            {pageTitle}
          </Typography>
          <Breadcrumbs
            separator={<NavigateNextRounded sx={{ fontSize: 14 }} />}
            sx={{ '& .MuiBreadcrumbs-separator': { color: '#475569' }, mt: 0.25 }}
          >
            <Link component={RouterLink} to="/dashboard" underline="hover" sx={{ fontSize: '0.7rem', color: '#64748b' }}>
              Home
            </Link>
            {segments.map((seg, i) => (
              <Typography key={i} sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                {PATH_LABELS[seg] || seg}
              </Typography>
            ))}
          </Breadcrumbs>
        </Box>

        {/* Search bar */}
        <Box
          sx={{
            display: 'flex', alignItems: 'center', gap: 1,
            px: 1.5, py: 0.5, borderRadius: '10px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(148,163,184,0.1)',
            mr: 2,
            '&:focus-within': { borderColor: 'rgba(99,102,241,0.5)', background: 'rgba(99,102,241,0.06)' },
            transition: 'all 0.2s',
          }}
        >
          <SearchRounded sx={{ color: '#64748b', fontSize: 18 }} />
          <InputBase
            placeholder="Search invoices, vendors…"
            sx={{ color: '#f1f5f9', fontSize: '0.83rem', width: 200 }}
          />
        </Box>

        {/* AI insight pill */}
        <Tooltip title="AI Insights active">
          <Box
            sx={{
              display: 'flex', alignItems: 'center', gap: 0.75, mr: 2,
              px: 1.5, py: 0.5, borderRadius: '20px',
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.3)',
            }}
          >
            <LightbulbRounded sx={{ color: '#818cf8', fontSize: 14 }} />
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#818cf8' }}>AI Active</Typography>
          </Box>
        </Tooltip>

        {/* Notifications */}
        <Tooltip title="Notifications">
          <IconButton size="small" sx={{ mr: 1 }} onClick={() => navigate('/notifications')}>
            <Badge badgeContent={unreadCount} color="error" max={99}>
              <NotificationsRounded sx={{ color: '#94a3b8', fontSize: 22 }} />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* User avatar + logout */}
        <Tooltip title={`${user?.firstName} ${user?.lastName} — ${user?.roleName?.replace('_', ' ')}`}>
          <Avatar
            sx={{
              width: 34, height: 34, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              mr: 1,
            }}
          >
            {getInitials(user?.firstName, user?.lastName)}
          </Avatar>
        </Tooltip>

        <Tooltip title="Logout">
          <IconButton size="small" onClick={handleLogout}>
            <LogoutRounded sx={{ color: '#64748b', fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}
