import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Button, CircularProgress,
  Table, TableBody, TableCell, TableHead, TableRow, TablePagination,
  Avatar, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Stack, IconButton, Tooltip, Select, MenuItem, FormControl, InputLabel,
  TableContainer,
} from '@mui/material';
import {
  CheckCircleRounded, CancelRounded, InfoRounded, WarningRounded,
  AccessTimeRounded, ThumbUpRounded, ThumbDownRounded, PauseRounded,
} from '@mui/icons-material';
import { approvalApi } from '../services/api';
import { ApprovalWorkflow } from '../types';
import { formatCurrency, formatDateTime, statusColor } from '../utils';

const PRIORITY_COLOR: any = { urgent: 'error', high: 'warning', normal: 'primary', low: 'default' };

export default function ApprovalsPage() {
  const [items, setItems] = useState<ApprovalWorkflow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ApprovalWorkflow | null>(null);
  const [actionComments, setActionComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await approvalApi.getQueue({
        page: page + 1,
        limit: rowsPerPage,
        status: statusFilter || undefined,
      });
      const d = res.data.data;
      const rows = Array.isArray(d) ? d : d.workflows || [];
      setItems(rows);
      setTotal(d.total || rows.length);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchQueue(); }, [page, rowsPerPage, statusFilter]);

  const handleAction = async (action: 'approved' | 'rejected' | 'on_hold') => {
    if (!selectedItem) return;
    setActionLoading(true);
    try {
      await approvalApi.action({
        invoiceId: selectedItem.invoiceId,
        workflowId: selectedItem.id,
        action,
        comments: actionComments,
      });
      setSelectedItem(null);
      setActionComments('');
      fetchQueue();
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>Approval Queue</Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>{total} workflows total</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Filter by status</InputLabel>
            <Select value={statusFilter} label="Filter by status" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="pending_review">Pending Review</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="on_hold">On Hold</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>

      <Card>
        <TableContainer component={Box}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Invoice</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>AI Rec.</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6 }}><CircularProgress size={32} /></TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6 }}><Typography sx={{ color: '#475569' }}>No workflows found</Typography></TableCell></TableRow>
              ) : items.map((wf) => (
                <TableRow key={wf.id} hover sx={{ '&:hover': { background: 'rgba(99,102,241,0.04) !important' } }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.83rem' }}>
                      {wf.invoiceNumber || wf.invoiceId.slice(0, 8)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{wf.vendorName || '—'}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.83rem' }}>
                      {formatCurrency(Number(wf.totalAmount || 0), wf.currency || 'USD')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={wf.priority} color={PRIORITY_COLOR[wf.priority] || 'default'} size="small" sx={{ textTransform: 'capitalize', fontSize: '0.7rem' }} />
                  </TableCell>
                  <TableCell>
                    {wf.aiRecommendation ? (
                      <Chip
                        label={wf.aiRecommendation.replace('_', ' ')}
                        size="small"
                        icon={wf.aiRecommendation === 'approve' ? <ThumbUpRounded /> : wf.aiRecommendation === 'reject' ? <ThumbDownRounded /> : <InfoRounded />}
                        color={wf.aiRecommendation === 'approve' ? 'success' : wf.aiRecommendation === 'reject' ? 'error' : 'warning'}
                        sx={{ fontSize: '0.7rem' }}
                      />
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    <Chip label={wf.status.replace(/_/g, ' ')} color={statusColor(wf.status as any)} size="small" sx={{ fontSize: '0.7rem', textTransform: 'capitalize' }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#94a3b8' }}>{wf.assigneeName || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#64748b' }}>{formatDateTime(wf.createdAt)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    {(wf.status === 'pending_review' || wf.status === 'in_progress') && (
                      <Tooltip title="Review & Action">
                        <IconButton size="small" onClick={() => setSelectedItem(wf)}>
                          <AccessTimeRounded sx={{ fontSize: 18, color: '#6366f1' }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 15, 25]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setRowsPerPage(+e.target.value); setPage(0); }}
        />
      </Card>

      {/* Action Dialog */}
      <Dialog open={!!selectedItem} onClose={() => setSelectedItem(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { background: '#0f0f1e' } }}>
        {selectedItem && (
          <>
            <DialogTitle>
              <Typography variant="h6" fontWeight={700}>Review Invoice</Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                {selectedItem.invoiceNumber} • {formatCurrency(Number(selectedItem.totalAmount || 0))} • {selectedItem.vendorName}
              </Typography>
            </DialogTitle>
            <DialogContent dividers>
              {selectedItem.aiRecommendation && (
                <Box sx={{ mb: 2, p: 2, borderRadius: 1.5, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 600 }}>AI Recommendation: {selectedItem.aiRecommendation?.replace('_', ' ').toUpperCase()}</Typography>
                  {selectedItem.aiExplanation && (
                    <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5, fontSize: '0.8rem' }}>{selectedItem.aiExplanation}</Typography>
                  )}
                </Box>
              )}
              <TextField
                fullWidth multiline rows={3}
                label="Comments (optional)"
                value={actionComments}
                onChange={(e) => setActionComments(e.target.value)}
                placeholder="Add notes about your decision…"
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
              <Button onClick={() => setSelectedItem(null)} disabled={actionLoading}>Cancel</Button>
              <Button variant="outlined" color="warning" startIcon={<PauseRounded />} onClick={() => handleAction('on_hold')} disabled={actionLoading}>
                Hold
              </Button>
              <Button variant="outlined" color="error" startIcon={<CancelRounded />} onClick={() => handleAction('rejected')} disabled={actionLoading}>
                Reject
              </Button>
              <Button variant="contained" color="success" startIcon={<CheckCircleRounded />} onClick={() => handleAction('approved')} disabled={actionLoading}>
                {actionLoading ? <CircularProgress size={16} color="inherit" /> : 'Approve'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
