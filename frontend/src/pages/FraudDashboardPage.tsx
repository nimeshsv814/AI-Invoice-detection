import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, Chip, CircularProgress,
  LinearProgress, Table, TableBody, TableCell, TableHead, TableRow,
  List, ListItem, ListItemText, Divider, Avatar, Stack, Alert,
} from '@mui/material';
import { SecurityRounded, WarningRounded, TrendingDownRounded } from '@mui/icons-material';
import { BarChart, LineChart } from '@mui/x-charts';
import { analyticsApi } from '../services/api';
import { formatCurrency } from '../utils';

export default function FraudDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await analyticsApi.getFraud();
        setData(res.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;

  const trends = data?.trends || [];
  const months = trends.map((t: any) => new Date(t.month).toLocaleDateString('en-US', { month: 'short' }));
  const byLevel = data?.byLevel || [];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>Fraud Detection Dashboard</Typography>
      <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>AI-powered fraud risk analysis across all invoices</Typography>

      {/* Summary Chips */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
        {[
          { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
          { label: 'High', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
          { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          { label: 'Low', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
        ].map(({ label, color, bg }) => {
          const found = byLevel.find((b: any) => b.riskLevel === label.toLowerCase());
          return (
            <Card key={label} sx={{ px: 2.5, py: 1.5, background: bg, border: `1px solid ${color}30` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningRounded sx={{ color, fontSize: 18 }} />
                <Box>
                  <Typography variant="h5" fontWeight={800} sx={{ color, lineHeight: 1 }}>
                    {found?.count || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color }}>{label} Risk</Typography>
                </Box>
              </Box>
            </Card>
          );
        })}
      </Stack>

      <Grid container spacing={2.5}>
        {/* Fraud Trends */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Fraud Risk Trends (12 Months)</Typography>
              {months.length > 0 ? (
                <BarChart
                  xAxis={[{ data: months, scaleType: 'band' }]}
                  series={[
                    { data: trends.map((t: any) => Number(t.critical || 0)), label: 'Critical', color: '#ef4444', stack: 'fraud' },
                    { data: trends.map((t: any) => Number(t.high || 0)), label: 'High', color: '#f97316', stack: 'fraud' },
                    { data: trends.map((t: any) => Number(t.medium || 0)), label: 'Medium', color: '#f59e0b', stack: 'fraud' },
                    { data: trends.map((t: any) => Number(t.low || 0)), label: 'Low', color: '#10b981', stack: 'fraud' },
                  ]}
                  height={280}
                />
              ) : (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <Typography variant="body2" sx={{ color: '#475569' }}>No fraud data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent High-Risk Alerts */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SecurityRounded sx={{ color: '#ef4444' }} />
                <Typography variant="h6" fontWeight={700}>Recent Fraud Alerts</Typography>
              </Box>
              {(data?.recentAlerts || []).length === 0 ? (
                <Alert severity="success">No recent high-risk alerts detected.</Alert>
              ) : (
                <List disablePadding>
                  {data.recentAlerts.slice(0, 7).map((alert: any, i: number) => (
                    <React.Fragment key={alert.id}>
                      <ListItem disablePadding sx={{ py: 1 }}>
                        <Box sx={{
                          width: 8, height: 8, borderRadius: '50%', flexShrink: 0, mr: 1.5,
                          background: alert.riskLevel === 'critical' ? '#ef4444' : '#f97316',
                        }} />
                        <ListItemText
                          primary={alert.invoiceNumber || alert.id.slice(0, 8)}
                          secondary={`${alert.vendor_name || '—'} • ${formatCurrency(Number(alert.total_amount || 0))}`}
                          primaryTypographyProps={{ fontSize: '0.83rem', fontWeight: 600 }}
                          secondaryTypographyProps={{ fontSize: '0.72rem', color: '#64748b' }}
                        />
                        <Chip
                          label={`${Number(alert.riskScore || 0).toFixed(0)}`}
                          size="small"
                          sx={{ fontSize: '0.7rem', fontWeight: 700, background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
                        />
                      </ListItem>
                      {i < data.recentAlerts.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* High-Risk Vendors */}
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>High-Risk Vendors</Typography>
              {(data?.highRiskVendors || []).length === 0 ? (
                <Alert severity="success">No high-risk vendors detected.</Alert>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Vendor</TableCell>
                      <TableCell align="right">Assessments</TableCell>
                      <TableCell align="right">Avg Risk Score</TableCell>
                      <TableCell align="right">Max Risk Score</TableCell>
                      <TableCell>Risk Level</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.highRiskVendors.map((v: any) => (
                      <TableRow key={v.vendorName} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 26, height: 26, fontSize: '0.65rem', background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>
                              {(v.vendorName || 'U')[0]}
                            </Avatar>
                            <Typography variant="body2" fontWeight={600}>{v.vendorName}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">{v.assessments}</TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(Number(v.avgRiskScore), 100)}
                              sx={{ width: 60, '& .MuiLinearProgress-bar': { background: '#ef4444' } }}
                            />
                            <Typography variant="body2" fontWeight={600} sx={{ color: '#ef4444' }}>
                              {Number(v.avgRiskScore).toFixed(0)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={700} sx={{ color: '#ef4444' }}>
                            {Number(v.maxRiskScore).toFixed(0)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={Number(v.avgRiskScore) >= 75 ? 'CRITICAL' : 'HIGH'}
                            color="error" size="small"
                            icon={<WarningRounded />}
                            sx={{ fontSize: '0.7rem' }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
