import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Box, Chip, Divider, Avatar, alpha,
} from '@mui/material';
import {
  DashboardRounded, ReceiptLongRounded, CloudUploadRounded,
  SecurityRounded, StoreRounded, CheckCircleRounded,
  BarChartRounded, NotificationsRounded, PeopleRounded,
  HistoryRounded, GppMaybeRounded,
} from '@mui/icons-material';
import { useAuthStore, useNotificationStore } from '../../store';
import { getInitials } from '../../utils';

const DRAWER_WIDTH = 258;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles?: string[];
  badge?: number;
}

const navItems: NavItem[] = [
  { label: 'Dashboard',         path: '/dashboard',        icon: <DashboardRounded /> },
  { label: 'Upload Invoice',    path: '/upload',           icon: <CloudUploadRounded /> },
  { label: 'Invoices',          path: '/invoices',         icon: <ReceiptLongRounded /> },
  { label: 'Fraud Detection',   path: '/fraud',            icon: <SecurityRounded /> },
  { label: 'Vendors',           path: '/vendors',          icon: <StoreRounded />,      roles: ['admin','vendor_manager','finance_manager'] },
  { label: 'Approval Queue',    path: '/approvals',        icon: <CheckCircleRounded />, roles: ['admin','finance_manager','finance_analyst'] },
  { label: 'Analytics',         path: '/analytics',        icon: <BarChartRounded /> },
  { label: 'Notifications',     path: '/notifications',    icon: <NotificationsRounded /> },
  { label: 'User Management',   path: '/users',            icon: <PeopleRounded />,     roles: ['admin'] },
  { label: 'Audit Logs',        path: '/audit',            icon: <HistoryRounded />,    roles: ['admin','auditor'] },
];

export default function Sidebar() {
  const { user } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const location = useLocation();

  const allowedItems = navItems.filter((item) =>
    !item.roles || !user?.roleName || item.roles.includes(user.roleName)
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
      }}
    >
      {/* Logo */}
      <Box sx={{ px: 2.5, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 38, height: 38, borderRadius: '10px', display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            boxShadow: '0 4px 15px rgba(99,102,241,0.4)',
          }}
        >
          <GppMaybeRounded sx={{ color: '#fff', fontSize: 20 }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2, color: '#f1f5f9' }}>
            InvoiceAI
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
            Intelligent Platform
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Navigation */}
      <List sx={{ px: 1.5, py: 1, flex: 1, overflow: 'auto' }}>
        {allowedItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const badge = item.path === '/notifications' ? unreadCount : 0;

          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={NavLink}
                to={item.path}
                sx={{
                  borderRadius: '10px',
                  py: 1,
                  px: 1.5,
                  transition: 'all 0.15s ease',
                  color: isActive ? '#f1f5f9' : '#64748b',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.15) 100%)'
                    : 'transparent',
                  borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent',
                  '&:hover': {
                    background: 'rgba(99,102,241,0.1)',
                    color: '#f1f5f9',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: isActive ? '#6366f1' : 'inherit',
                    '& svg': { fontSize: 20 },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: isActive ? 600 : 400 }}
                />
                {badge > 0 && (
                  <Chip
                    label={badge > 99 ? '99+' : badge}
                    size="small"
                    sx={{
                      height: 18, fontSize: '0.65rem', fontWeight: 700,
                      background: '#ef4444', color: '#fff',
                      '& .MuiChip-label': { px: 0.75 },
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />

      {/* User info */}
      {user && (
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 34, height: 34, fontSize: '0.8rem', fontWeight: 700,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            }}
          >
            {getInitials(user.firstName, user.lastName)}
          </Avatar>
          <Box sx={{ overflow: 'hidden', flex: 1 }}>
            <Typography variant="body2" fontWeight={600} noWrap sx={{ color: '#f1f5f9', fontSize: '0.82rem' }}>
              {user.firstName} {user.lastName}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem', textTransform: 'capitalize' }}>
              {user.roleName?.replace('_', ' ')}
            </Typography>
          </Box>
        </Box>
      )}
    </Drawer>
  );
}

export { DRAWER_WIDTH };
