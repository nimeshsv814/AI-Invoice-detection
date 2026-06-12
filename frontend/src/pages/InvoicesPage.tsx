import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Button, TextField,
  InputAdornment, MenuItem, Select, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, IconButton, Tooltip, CircularProgress,
  Avatar, Stack,
} from '@mui/material';
import {
  SearchRounded, FilterListRounded, VisibilityRounded,
  CloudUploadRounded, WarningRounded, CheckCircleRounded,
  RefreshRounded,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { invoiceApi } from '../services/api';
import { Invoice } from '../types';
import { formatCurrency, formatDate, statusColor, statusLabel, riskColor } from '../utils';

const STATUS_OPTIONS = [
  '', 'uploaded', 'processing', 'ocr_complete', 'pending_review',
  'approved', 'rejected', 'fraud_suspected', 'on_hold',
];

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await invoiceApi.getAll({
        page: page + 1,
        limit: rowsPerPage,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      const d = res.data.data;
      setInvoices(d.invoices || []);
      setTotal(d.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, [page, rowsPerPage, statusFilter]);

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { setPage(0); fetchInvoices(); }
  };

  return (
    <Box>
      {/* Header bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>Invoice Management</Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            {total.toLocaleString()} invoices total
          </Typography>
        </Box>
        <Button
          variant="contained" startIcon={<CloudUploadRounded />}
          onClick={() => navigate('/upload')}
        >
          Upload Invoice
        </Button>
      </Box>

      {/* Filter bar */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2, px: 2.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              placeholder="Search by invoice #, vendor…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearch}
              size="small"
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded sx={{ fontSize: 18, color: '#64748b' }} />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
                <MenuItem value="">All Statuses</MenuItem>
                {STATUS_OPTIONS.filter(Boolean).map((s) => (
                  <MenuItem key={s} value={s}>{statusLabel(s as any)}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchInvoices} disabled={loading}>
                <RefreshRounded />
              </IconButton>
            </Tooltip>
          </Stack>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Invoice #</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Fraud Risk</TableCell>
                <TableCell>OCR Confidence</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" sx={{ color: '#475569' }}>No invoices found</Typography>
                  </TableCell>
                </TableRow>
              ) : invoices.map((inv) => (
                <TableRow
                  key={inv.id}
                  hover
                  sx={{ cursor: 'pointer', '&:hover': { background: 'rgba(99,102,241,0.04) !important' } }}
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.83rem' }}>
                      {inv.invoiceNumber || `INV-${inv.id.slice(0, 6)}`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 26, height: 26, fontSize: '0.65rem', fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                        {(inv.vendorName || 'U')[0]}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontSize: '0.83rem' }}>
                        {inv.vendorName || '—'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {formatDate(inv.invoiceDate)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.83rem' }}>
                      {formatCurrency(Number(inv.totalAmount || 0), inv.currency || 'USD')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={statusLabel(inv.status)} color={statusColor(inv.status)} size="small" sx={{ fontSize: '0.7rem' }} />
                  </TableCell>
                  <TableCell>
                    {inv.fraudRiskLevel ? (
                      <Chip
                        label={inv.fraudRiskLevel.toUpperCase()}
                        color={riskColor(inv.fraudRiskLevel)}
                        size="small"
                        icon={inv.fraudRiskLevel === 'critical' || inv.fraudRiskLevel === 'high' ? <WarningRounded /> : undefined}
                        sx={{ fontSize: '0.7rem' }}
                      />
                    ) : <Typography sx={{ color: '#475569', fontSize: '0.8rem' }}>—</Typography>}
                  </TableCell>
                  <TableCell>
                    {inv.ocrConfidence != null ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 50, height: 6, borderRadius: 3, background: 'rgba(148,163,184,0.2)',
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            sx={{
                              height: '100%', borderRadius: 3,
                              width: `${inv.ocrConfidence}%`,
                              background: inv.ocrConfidence >= 80 ? '#10b981' : inv.ocrConfidence >= 60 ? '#f59e0b' : '#ef4444',
                            }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          {inv.ocrConfidence.toFixed(0)}%
                        </Typography>
                      </Box>
                    ) : <Typography sx={{ color: '#475569', fontSize: '0.8rem' }}>—</Typography>}
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="View details">
                      <IconButton size="small" onClick={() => navigate(`/invoices/${inv.id}`)}>
                        <VisibilityRounded sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 15, 25, 50]}
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
