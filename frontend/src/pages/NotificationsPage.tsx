import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, List, ListItem, ListItemText,
  Chip, Button, CircularProgress, IconButton, Tooltip, Divider,
  Avatar, Stack, Tab, Tabs, Badge,
} from '@mui/material';
import {
  NotificationsRounded, MarkEmailReadRounded, CheckCircleRounded,
  WarningRounded, InfoRounded, SecurityRounded, ReceiptRounded,
} from '@mui/icons-material';
import { notificationApi } from '../services/api';
import { Notification } from '../types';
import { formatDateTime } from '../utils';
import { useNotificationStore } from '../store';

const PRIORITY_COLOR: any = { urgent: '#ef4444', high: '#f97316', normal: '#6366f1', low: '#64748b' };
const TYPE_ICON: any = {
  fraud_alert: <SecurityRounded sx={{ fontSize: 18, color: '#ef4444' }} />,
  invoice_approved: <CheckCircleRounded sx={{ fontSize: 18, color: '#10b981' }} />,
  invoice_rejected: <WarningRounded sx={{ fontSize: 18, color: '#ef4444' }} />,
  duplicate_detected: <WarningRounded sx={{ fontSize: 18, color: '#f59e0b' }} />,
  default: <InfoRounded sx={{ fontSize: 18, color: '#6366f1' }} />,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const { setUnreadCount: setGlobalUnread } = useNotificationStore();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const isRead = tab === 1 ? 'true' : tab === 2 ? 'false' : undefined;
      const res = await notificationApi.getAll({ limit: 50, isRead });
      const d = res.data.data;
      setNotifications(d.notifications || []);
      setTotal(d.total || 0);
      setUnreadCount(d.unreadCount || 0);
      setGlobalUnread(d.unreadCount || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, [tab]);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationApi.markRead(id);
      fetchNotifications();
    } catch (err) { console.error(err); }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      fetchNotifications();
    } catch (err) { console.error(err); }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>Notifications</Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </Typography>
        </Box>
        {unreadCount > 0 && (
          <Button startIcon={<MarkEmailReadRounded />} onClick={handleMarkAllRead} variant="outlined">
            Mark All Read
          </Button>
        )}
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 2, '& .MuiTabs-indicator': { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } }}
      >
        <Tab label="All" />
        <Tab label="Read" />
        <Tab
          label={
            <Badge badgeContent={unreadCount} color="error" max={99}>
              Unread
            </Badge>
          }
        />
      </Tabs>

      <Card>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <NotificationsRounded sx={{ fontSize: 48, color: '#334155', mb: 1 }} />
            <Typography variant="body1" sx={{ color: '#475569' }}>No notifications</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {notifications.map((n, i) => (
              <React.Fragment key={n.id}>
                <ListItem
                  sx={{
                    py: 2, px: 2.5,
                    background: n.isRead ? 'transparent' : 'rgba(99,102,241,0.04)',
                    borderLeft: n.isRead ? '3px solid transparent' : `3px solid ${PRIORITY_COLOR[n.priority] || '#6366f1'}`,
                    cursor: 'pointer',
                    '&:hover': { background: 'rgba(99,102,241,0.06)' },
                    transition: 'background 0.15s',
                  }}
                >
                  <Box sx={{ mr: 2, flexShrink: 0 }}>
                    <Avatar
                      sx={{
                        width: 36, height: 36,
                        background: n.isRead ? 'rgba(148,163,184,0.1)' : 'rgba(99,102,241,0.15)',
                      }}
                    >
                      {TYPE_ICON[n.type] || TYPE_ICON.default}
                    </Avatar>
                  </Box>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                        <Typography variant="body2" fontWeight={n.isRead ? 400 : 600} sx={{ fontSize: '0.86rem' }}>
                          {n.title}
                        </Typography>
                        <Chip
                          label={n.priority}
                          size="small"
                          sx={{
                            fontSize: '0.62rem', fontWeight: 700, height: 16,
                            background: `${PRIORITY_COLOR[n.priority]}20`,
                            color: PRIORITY_COLOR[n.priority],
                            '& .MuiChip-label': { px: 0.75 },
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.8rem', mb: 0.25 }}>
                          {n.message}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.72rem' }}>
                          {formatDateTime(n.createdAt)}
                        </Typography>
                      </Box>
                    }
                  />
                  {!n.isRead && (
                    <Tooltip title="Mark as read">
                      <IconButton size="small" onClick={() => handleMarkRead(n.id)} sx={{ ml: 1 }}>
                        <CheckCircleRounded sx={{ fontSize: 18, color: '#64748b' }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </ListItem>
                {i < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Card>
    </Box>
  );
}
