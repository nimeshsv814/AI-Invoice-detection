import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, CircularProgress,
  Table, TableBody, TableCell, TableHead, TableRow, TablePagination,
  TextField, InputAdornment, MenuItem, Select, FormControl, InputLabel,
  Stack, Avatar, Tooltip, IconButton,
} from '@mui/material';
import { SearchRounded, RefreshRounded, InfoRounded } from '@mui/icons-material';
import { analyticsApi } from '../services/api';
import { formatDateTime } from '../utils';

const ACTION_COLOR: any = {
  create: 'success', update: 'primary', delete: 'error',
  approve: 'success', reject: 'error', login: 'info', logout: 'default',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.getAuditLogs({
        entityType: entityFilter || undefined,
        action: actionFilter || undefined,
        page: page + 1,
        limit: rowsPerPage,
      });
      const d = res.data.data;
      setLogs(d.logs || []);
      setTotal(d.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, [page, rowsPerPage, entityFilter, actionFilter]);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>Audit Logs</Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Complete trail of all system actions — {total.toLocaleString()} records
        </Typography>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2, px: 2.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Entity Type</InputLabel>
              <Select value={entityFilter} label="Entity Type" onChange={(e) => { setEntityFilter(e.target.value); setPage(0); }}>
                <MenuItem value="">All</MenuItem>
                {['invoice', 'vendor', 'user', 'approval_workflow', 'fraud_score', 'notification'].map((e) => (
                  <MenuItem key={e} value={e}>{e.replace('_', ' ')}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              placeholder="Filter by action…"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              onKeyDown={(ev) => ev.key === 'Enter' && fetchLogs()}
              size="small"
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchRounded sx={{ fontSize: 18, color: '#64748b' }} /></InputAdornment>,
              }}
            />
            <Tooltip title="Refresh">
              <IconButton onClick={fetchLogs} disabled={loading}><RefreshRounded /></IconButton>
            </Tooltip>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Entity Type</TableCell>
              <TableCell>Entity ID</TableCell>
              <TableCell>IP Address</TableCell>
              <TableCell align="right">Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><CircularProgress size={32} /></TableCell></TableRow>
            ) : logs.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><Typography sx={{ color: '#475569' }}>No audit logs found</Typography></TableCell></TableRow>
            ) : logs.map((log) => (
              <TableRow key={log.id} hover sx={{ '&:hover': { background: 'rgba(99,102,241,0.04) !important' } }}>
                <TableCell>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                    {formatDateTime(log.created_at || log.createdAt)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                    {log.user_name || log.user_id?.slice(0, 8) || '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={log.action}
                    color={ACTION_COLOR[log.action?.toLowerCase()] || 'default'}
                    size="small"
                    sx={{ fontSize: '0.68rem', textTransform: 'lowercase' }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={log.entity_type?.replace('_', ' ')}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.68rem', textTransform: 'capitalize' }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'monospace', fontSize: '0.73rem' }}>
                    {log.entity_id?.slice(0, 12)}…
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{ color: '#475569', fontFamily: 'monospace', fontSize: '0.73rem' }}>
                    {log.ip_address || '—'}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="View details">
                    <IconButton size="small" onClick={() => setSelectedLog(log)}>
                      <InfoRounded sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setRowsPerPage(+e.target.value); setPage(0); }}
        />
      </Card>
    </Box>
  );
}
