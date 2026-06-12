import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, Chip, CircularProgress,
  Select, MenuItem, FormControl, InputLabel, Stack, Divider,
  List, ListItem, ListItemText, Table, TableBody, TableCell,
  TableHead, TableRow,
} from '@mui/material';
import { BarChart, LineChart, PieChart } from '@mui/x-charts';
import { analyticsApi } from '../services/api';
import { formatCurrency } from '../utils';

export default function AnalyticsPage() {
  const [kpis, setKpis] = useState<any>(null);
  const [spend, setSpend] = useState<any>(null);
  const [period, setPeriod] = useState('12months');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [kpiRes, spendRes] = await Promise.all([
        analyticsApi.getDashboard(),
        analyticsApi.getSpend(period),
      ]);
      setKpis(kpiRes.data.data);
      setSpend(spendRes.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [period]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;

  const spendTrend = spend?.spendTrend || [];
  const weeks = spendTrend.map((s: any) => new Date(s.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  const spendVals = spendTrend.map((s: any) => Number(s.total_spend) / 1000);

  const byCategory = spend?.byCategory || [];
  const catLabels = byCategory.map((c: any) => c.category || 'Other');
  const catValues = byCategory.map((c: any) => Number(c.total_spend) / 1000);

  const byStatus = spend?.byStatus || [];

  const months = (kpis?.monthlySpend || []).map((m: any) => new Date(m.month).toLocaleDateString('en-US', { month: 'short' }));
  const monthlyVals = (kpis?.monthlySpend || []).map((m: any) => Number(m.total_spend) / 1000);
  const countVals = (kpis?.monthlySpend || []).map((m: any) => Number(m.invoice_count));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>Spend Analytics</Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>AI-powered financial insights and trends</Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Period</InputLabel>
          <Select value={period} label="Period" onChange={(e) => setPeriod(e.target.value)}>
            <MenuItem value="3months">Last 3 Months</MenuItem>
            <MenuItem value="6months">Last 6 Months</MenuItem>
            <MenuItem value="12months">Last 12 Months</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* KPI summary */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: 'Total Approved Spend', value: formatCurrency(Number(kpis?.invoiceTotals?.total_approved_spend || 0)), color: '#10b981' },
          { label: 'Pending Spend', value: formatCurrency(Number(kpis?.invoiceTotals?.total_pending_spend || 0)), color: '#f59e0b' },
          { label: 'Avg Invoice Amount', value: formatCurrency(Number(kpis?.invoiceTotals?.avg_invoice_amount || 0)), color: '#6366f1' },
          { label: 'Avg OCR Confidence', value: `${Number(kpis?.invoiceTotals?.avg_ocr_confidence || 0).toFixed(1)}%`, color: '#3b82f6' },
        ].map(({ label, value, color }) => (
          <Grid item xs={12} sm={6} md={3} key={label}>
            <Card>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.68rem' }}>
                  {label}
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ color, mt: 0.5 }}>{value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5}>
        {/* Monthly Trend */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Monthly Spend & Volume</Typography>
              {months.length > 0 ? (
                <LineChart
                  xAxis={[{ data: months, scaleType: 'point' }]}
                  series={[
                    { data: monthlyVals, label: 'Spend ($K)', color: '#6366f1', area: true },
                    { data: countVals, label: 'Invoice Count', color: '#10b981', yAxisKey: 'count' },
                  ]}
                  yAxis={[
                    { id: 'spend' },
                    { id: 'count', position: 'right' },
                  ]}
                  leftAxis="spend"
                  rightAxis="count"
                  height={280}
                />
              ) : <Box sx={{ textAlign: 'center', py: 6 }}><Typography sx={{ color: '#475569' }}>No data</Typography></Box>}
            </CardContent>
          </Card>
        </Grid>

        {/* By Status */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Invoice Status Distribution</Typography>
              <List disablePadding>
                {byStatus.map((s: any, i: number) => (
                  <React.Fragment key={s.status}>
                    <ListItem disablePadding sx={{ py: 1 }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" fontWeight={600} sx={{ color: '#94a3b8', textTransform: 'capitalize' }}>
                            {s.status?.replace(/_/g, ' ')}
                          </Typography>
                          <Typography variant="caption" fontWeight={700}>{s.count}</Typography>
                        </Box>
                        <Box sx={{ height: 4, borderRadius: 2, background: 'rgba(148,163,184,0.1)', overflow: 'hidden' }}>
                          <Box sx={{
                            height: '100%', borderRadius: 2,
                            width: `${Math.min((Number(s.count) / (kpis?.invoiceTotals?.total_invoices || 1)) * 100, 100)}%`,
                            background: s.status === 'approved' ? '#10b981' : s.status === 'rejected' ? '#ef4444' : s.status === 'fraud_suspected' ? '#f97316' : '#6366f1',
                          }} />
                        </Box>
                      </Box>
                    </ListItem>
                    {i < byStatus.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Spend by Category Bar Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Spend by Category ($K)</Typography>
              {catLabels.length > 0 ? (
                <BarChart
                  xAxis={[{ data: catLabels, scaleType: 'band' }]}
                  series={[{ data: catValues, label: 'Spend ($K)', color: '#6366f1' }]}
                  height={260}
                  layout="vertical"
                />
              ) : <Box sx={{ textAlign: 'center', py: 6 }}><Typography sx={{ color: '#475569' }}>No category data</Typography></Box>}
            </CardContent>
          </Card>
        </Grid>

        {/* Weekly spend trend */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Weekly Invoice Volume</Typography>
              {weeks.length > 0 ? (
                <LineChart
                  xAxis={[{ data: weeks, scaleType: 'point' }]}
                  series={[{
                    data: spendTrend.map((s: any) => Number(s.invoice_count)),
                    label: 'Invoices',
                    color: '#8b5cf6',
                    area: true,
                  }]}
                  height={260}
                  sx={{ '& .MuiAreaElement-root': { fill: 'rgba(139,92,246,0.1)' } }}
                />
              ) : <Box sx={{ textAlign: 'center', py: 6 }}><Typography sx={{ color: '#475569' }}>No data</Typography></Box>}
            </CardContent>
          </Card>
        </Grid>

        {/* Top Vendors by Spend table */}
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Top Vendors by Total Spend</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Vendor</TableCell>
                    <TableCell align="right">Invoices</TableCell>
                    <TableCell align="right">Total Spend</TableCell>
                    <TableCell align="right">Avg Amount</TableCell>
                    <TableCell>Fraud Risk</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(kpis?.topVendors || []).map((v: any, i: number) => (
                    <TableRow key={v.vendor_name} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} sx={{ color: '#6366f1' }}>{i + 1}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{v.vendor_name}</Typography>
                      </TableCell>
                      <TableCell align="right">{v.invoice_count}</TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={600}>{formatCurrency(Number(v.total_spend))}</Typography>
                      </TableCell>
                      <TableCell align="right">{formatCurrency(Number(v.avg_amount || 0))}</TableCell>
                      <TableCell>
                        <Chip
                          label={Number(v.max_fraud_score) >= 75 ? 'Critical' : Number(v.max_fraud_score) >= 50 ? 'High' : Number(v.max_fraud_score) >= 25 ? 'Medium' : 'Low'}
                          color={Number(v.max_fraud_score) >= 50 ? 'error' : Number(v.max_fraud_score) >= 25 ? 'warning' : 'success'}
                          size="small"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
