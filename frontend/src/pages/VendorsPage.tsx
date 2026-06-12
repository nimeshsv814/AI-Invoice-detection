import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, Chip, Button,
  TextField, InputAdornment, Table, TableBody, TableCell,
  TableHead, TableRow, TablePagination, CircularProgress,
  Avatar, LinearProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, Stack, Divider, MenuItem, Select, FormControl,
  InputLabel, IconButton, Tooltip, TableContainer,
} from '@mui/material';
import {
  SearchRounded, AddRounded, VisibilityRounded, AssessmentRounded,
  CheckCircleRounded, WarningRounded, BlockRounded,
} from '@mui/icons-material';
import { vendorApi } from '../services/api';
import { Vendor } from '../types';
import { formatCurrency, formatDate, formatNumber } from '../utils';

function StatusChip({ status }: { status: string }) {
  const colorMap: any = { active: 'success', inactive: 'default', suspended: 'error', under_review: 'warning' };
  return <Chip label={status.replace('_', ' ')} color={colorMap[status] || 'default'} size="small" sx={{ textTransform: 'capitalize' }} />;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [assessLoading, setAssessLoading] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [form, setForm] = useState({
    vendorCode: '',
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    country: 'US',
    category: '',
    currency: 'USD',
    paymentTerms: 30,
  });

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await vendorApi.getAll({ page: page + 1, limit: rowsPerPage, search: search || undefined });
      const d = res.data.data;
      const rows = Array.isArray(d) ? d : d.vendors || [];
      setVendors(rows);
      setTotal(d.total || rows.length);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchVendors(); }, [page, rowsPerPage]);

  const handleAssess = async (id: string) => {
    setAssessLoading(id);
    try {
      await vendorApi.assess(id);
      fetchVendors();
    } catch (err) { console.error(err); }
    finally { setAssessLoading(null); }
  };

  const handleCreate = async () => {
    setCreateLoading(true);
    try {
      await vendorApi.create(form);
      setCreateOpen(false);
      setForm({
        vendorCode: '',
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        country: 'US',
        category: '',
        currency: 'USD',
        paymentTerms: 30,
      });
      fetchVendors();
    } catch (err) { console.error(err); }
    finally { setCreateLoading(false); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>Vendor Management</Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>{total} registered vendors</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRounded />} onClick={() => setCreateOpen(true)}>Add Vendor</Button>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2, px: 2.5 }}>
          <TextField
            placeholder="Search vendors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchVendors()}
            size="small"
            sx={{ width: 320 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchRounded sx={{ fontSize: 18, color: '#64748b' }} /></InputAdornment>,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <TableContainer component={Box}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Vendor</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Country</TableCell>
                <TableCell align="right">Total Spend</TableCell>
                <TableCell align="right">Invoices</TableCell>
                <TableCell>Risk Score</TableCell>
                <TableCell>Trust Score</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6 }}><CircularProgress size={32} /></TableCell></TableRow>
              ) : vendors.length === 0 ? (
                <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6 }}><Typography sx={{ color: '#475569' }}>No vendors found</Typography></TableCell></TableRow>
              ) : vendors.map((v) => (
                <TableRow key={v.id} hover sx={{ '&:hover': { background: 'rgba(99,102,241,0.04) !important' } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                        {v.companyName[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.83rem' }}>{v.companyName}</Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>{v.vendorCode}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={v.category || '—'} size="small" sx={{ fontSize: '0.7rem', background: 'rgba(99,102,241,0.1)', color: '#818cf8' }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#94a3b8' }}>{v.country || '—'}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.83rem' }}>{formatCurrency(Number(v.totalSpend || 0))}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontSize: '0.83rem' }}>{v.totalInvoices}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={v.riskScore}
                        sx={{
                          width: 60,
                          '& .MuiLinearProgress-bar': {
                            background: v.riskScore >= 70 ? '#ef4444' : v.riskScore >= 40 ? '#f59e0b' : '#10b981',
                          },
                        }}
                      />
                      <Typography variant="caption" fontWeight={700} sx={{ color: v.riskScore >= 70 ? '#ef4444' : v.riskScore >= 40 ? '#f59e0b' : '#10b981' }}>
                        {v.riskScore}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={v.trustScore}
                        sx={{
                          width: 60,
                          '& .MuiLinearProgress-bar': {
                            background: v.trustScore >= 70 ? '#10b981' : v.trustScore >= 40 ? '#f59e0b' : '#ef4444',
                          },
                        }}
                      />
                      <Typography variant="caption" fontWeight={700} sx={{ color: v.trustScore >= 70 ? '#10b981' : v.trustScore >= 40 ? '#f59e0b' : '#ef4444' }}>
                        {v.trustScore}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell><StatusChip status={v.status} /></TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => setSelectedVendor(v)}>
                        <VisibilityRounded sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Run Risk Assessment">
                      <IconButton size="small" onClick={() => handleAssess(v.id)} disabled={assessLoading === v.id}>
                        {assessLoading === v.id ? <CircularProgress size={14} /> : <AssessmentRounded sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </Tooltip>
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

      {/* Vendor Detail Dialog */}
      <Dialog open={!!selectedVendor} onClose={() => setSelectedVendor(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { background: '#0f0f1e' } }}>
        {selectedVendor && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 40, height: 40, fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                {selectedVendor.companyName[0]}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>{selectedVendor.companyName}</Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>{selectedVendor.vendorCode}</Typography>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                {[
                  { label: 'Email', value: selectedVendor.email },
                  { label: 'Phone', value: selectedVendor.phone },
                  { label: 'Country', value: selectedVendor.country },
                  { label: 'Category', value: selectedVendor.category },
                  { label: 'Payment Terms', value: selectedVendor.paymentTerms ? `Net ${selectedVendor.paymentTerms}` : undefined },
                  { label: 'Currency', value: selectedVendor.currency },
                  { label: 'Total Invoices', value: String(selectedVendor.totalInvoices) },
                  { label: 'Total Spend', value: formatCurrency(Number(selectedVendor.totalSpend || 0)) },
                  { label: 'Fraud Flags', value: String(selectedVendor.fraudFlags || 0) },
                  { label: 'Duplicate Flags', value: String(selectedVendor.duplicateFlags || 0) },
                ].map(({ label, value }) => (
                  <Grid item xs={6} key={label}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>{label}</Typography>
                    <Typography variant="body2" fontWeight={500}>{value || '—'}</Typography>
                  </Grid>
                ))}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setSelectedVendor(null)}>Close</Button>
              <Button variant="contained" startIcon={<AssessmentRounded />} onClick={() => { handleAssess(selectedVendor.id); setSelectedVendor(null); }}>
                Run Assessment
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { background: '#0f0f1e' } }}>
        <DialogTitle>
          <Typography variant="h6" fontWeight={700}>Add Vendor</Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Stack direction="row" spacing={2}>
              <TextField fullWidth size="small" label="Vendor Code" value={form.vendorCode} onChange={(e) => setForm((f) => ({ ...f, vendorCode: e.target.value }))} />
              <TextField fullWidth size="small" label="Company Name" value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} />
            </Stack>
            <TextField fullWidth size="small" label="Contact Name" value={form.contactName} onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))} />
            <Stack direction="row" spacing={2}>
              <TextField fullWidth size="small" label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              <TextField fullWidth size="small" label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField fullWidth size="small" label="Category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
              <TextField fullWidth size="small" label="Country" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField fullWidth size="small" label="Currency" value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} />
              <TextField fullWidth size="small" label="Payment Terms" type="number" value={form.paymentTerms} onChange={(e) => setForm((f) => ({ ...f, paymentTerms: Number(e.target.value) }))} />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)} disabled={createLoading}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={createLoading ? <CircularProgress size={16} color="inherit" /> : <AddRounded />}
            onClick={handleCreate}
            disabled={createLoading || !form.vendorCode || !form.companyName}
          >
            Create Vendor
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
