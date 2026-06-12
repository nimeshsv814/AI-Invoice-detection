import React, { useEffect, useState } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Chip, CircularProgress,
  List, ListItem, ListItemText, ListItemSecondaryAction, Avatar,
  LinearProgress, Divider, IconButton, Tooltip, alpha,
} from '@mui/material';
import {
  ReceiptLongRounded, SecurityRounded, CheckCircleRounded,
  StoreRounded, TrendingUpRounded, TrendingDownRounded,
  WarningRounded, RefreshRounded, ArrowForwardRounded,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { LineChart, BarChart } from '@mui/x-charts';
import { analyticsApi } from '../services/api';
import { DashboardKPIs } from '../types';
import { formatCurrency, formatDate, statusColor, statusLabel, riskColor } from '../utils';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: number;
  color: string;
  onClick?: () => void;
}

function KPICard({ title, value, subtitle, icon, trend, color, onClick }: KPICardProps) {
  return (
    <Card
      sx={{ cursor: onClick ? 'pointer' : 'default', height: '100%' }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box
            sx={{
              width: 44, height: 44, borderRadius: '12px', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: `linear-gradient(135deg, ${color}25 0%, ${color}10 100%)`,
              border: `1px solid ${color}30`,
            }}
          >
            <Box sx={{ color, '& svg': { fontSize: 22 } }}>{icon}</Box>
          </Box>
          {trend !== undefined && (
            <Chip
              size="small"
              icon={trend >= 0 ? <TrendingUpRounded fontSize="small" /> : <TrendingDownRounded fontSize="small" />}
              label={`${Math.abs(trend)}%`}
              sx={{
                fontSize: '0.7rem', fontWeight: 700,
                background: trend >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                color: trend >= 0 ? '#10b981' : '#ef4444',
                border: 'none',
              }}
            />
          )}
        </Box>
        <Typography variant="h4" fontWeight={800} sx={{ color: '#f1f5f9', mb: 0.25, lineHeight: 1 }}>
          {value}
        </Typography>
        <Typography variant="body2" fontWeight={500} sx={{ color: '#94a3b8', mb: 0.25 }}>
          {title}
        </Typography>
        {subtitle && <Typography variant="caption" sx={{ color: '#475569' }}>{subtitle}</Typography>}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.getDashboard();
      setData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const inv = data?.invoiceTotals;
  const fraud = data?.fraudStats;
  const vendor = data?.vendorStats;
  const approval = data?.approvalStats;

  const months = data?.monthlySpend?.map((m) => new Date(m.month).toLocaleDateString('en-US', { month: 'short' })) || [];
  const spendValues = data?.monthlySpend?.map((m: any) => Number(m.totalSpend) / 1000) || [];

  return (
    <Box>
      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Invoices"
            value={Number((inv as any)?.totalInvoices || 0).toLocaleString()}
            subtitle={`${Number(inv?.pending || 0)} pending review`}
            icon={<ReceiptLongRounded />}
            color="#6366f1"
            trend={8}
            onClick={() => navigate('/invoices')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Approved Spend"
            value={formatCurrency(Number((inv as any)?.totalApprovedSpend || 0))}
            subtitle={`Avg. ${formatCurrency(Number((inv as any)?.avgInvoiceAmount || 0))} per invoice`}
            icon={<CheckCircleRounded />}
            color="#10b981"
            trend={12}
            onClick={() => navigate('/analytics')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Fraud Alerts"
            value={Number(fraud?.critical || 0) + Number(fraud?.high || 0)}
            subtitle={`Avg. risk score: ${Number((fraud as any)?.avgRiskScore || 0).toFixed(0)}/100`}
            icon={<SecurityRounded />}
            color="#ef4444"
            trend={-5}
            onClick={() => navigate('/fraud')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Active Vendors"
            value={Number(vendor?.active || 0).toLocaleString()}
            subtitle={`${Number((vendor as any)?.highRiskVendors || 0)} high-risk vendors`}
            icon={<StoreRounded />}
            color="#f59e0b"
            trend={3}
            onClick={() => navigate('/vendors')}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        {/* Monthly Spend Chart */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: 340 }}>
            <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight={700}>Monthly Spend Trend</Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Last 12 months in thousands</Typography>
                </Box>
                <Tooltip title="Refresh">
                  <IconButton size="small" onClick={fetchDashboard}>
                    <RefreshRounded sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box sx={{ flex: 1 }}>
                {months.length > 0 ? (
                  <LineChart
                    xAxis={[{ data: months, scaleType: 'point' }]}
                    series={[{
                      data: spendValues,
                      label: 'Spend ($K)',
                      color: '#6366f1',
                      area: true,
                    }]}
                    height={240}
                    sx={{
                      '& .MuiLineElement-root': { strokeWidth: 2.5 },
                      '& .MuiAreaElement-root': { fill: 'rgba(99,102,241,0.1)' },
                    }}
                  />
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="body2" sx={{ color: '#475569' }}>No spend data available</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Fraud Distribution */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 340 }}>
            <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>Fraud Risk Breakdown</Typography>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, justifyContent: 'center' }}>
                {[
                  { label: 'Critical', value: Number(fraud?.critical || 0), color: '#ef4444', pct: (fraud as any)?.totalAnalyzed ? Math.round(Number(fraud?.critical || 0) / Number((fraud as any)?.totalAnalyzed || 1) * 100) : 0 },
                  { label: 'High',     value: Number(fraud?.high || 0),     color: '#f97316', pct: (fraud as any)?.totalAnalyzed ? Math.round(Number(fraud?.high || 0) / Number((fraud as any)?.totalAnalyzed || 1) * 100) : 0 },
                  { label: 'Medium',   value: Number(fraud?.medium || 0),   color: '#f59e0b', pct: (fraud as any)?.totalAnalyzed ? Math.round(Number(fraud?.medium || 0) / Number((fraud as any)?.totalAnalyzed || 1) * 100) : 0 },
                  { label: 'Low',      value: Number(fraud?.low || 0),      color: '#10b981', pct: (fraud as any)?.totalAnalyzed ? Math.round(Number(fraud?.low || 0) / Number((fraud as any)?.totalAnalyzed || 1) * 100) : 0 },
                ].map((row) => (
                  <Box key={row.label}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" fontWeight={600} sx={{ color: '#94a3b8' }}>{row.label}</Typography>
                      <Typography variant="caption" fontWeight={700} sx={{ color: row.color }}>{row.value} ({row.pct}%)</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={row.pct}
                      sx={{ backgroundColor: `${row.color}20`, '& .MuiLinearProgress-bar': { background: row.color } }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>Recent Invoices</Typography>
                <Tooltip title="View all">
                  <IconButton size="small" onClick={() => navigate('/invoices')}>
                    <ArrowForwardRounded sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <List disablePadding>
                {(data?.recentActivity || []).slice(0, 6).map((inv, i) => (
                  <React.Fragment key={inv.id}>
                    <ListItem
                      disablePadding
                      sx={{ py: 1, cursor: 'pointer', borderRadius: 1, px: 1, '&:hover': { background: 'rgba(99,102,241,0.05)' } }}
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                    >
                      <Avatar
                        sx={{ width: 32, height: 32, mr: 1.5, fontSize: '0.7rem', fontWeight: 700,
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                      >
                        {(inv.vendorName || 'U')[0].toUpperCase()}
                      </Avatar>
                      <ListItemText
                        primary={inv.invoiceNumber || `INV-${inv.id.slice(0, 6)}`}
                        secondary={inv.vendorName || 'Unknown Vendor'}
                        primaryTypographyProps={{ fontSize: '0.83rem', fontWeight: 600 }}
                        secondaryTypographyProps={{ fontSize: '0.72rem', color: '#64748b' }}
                      />
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.83rem' }}>
                          {formatCurrency(Number(inv.totalAmount || 0))}
                        </Typography>
                        <Chip
                          label={statusLabel(inv.status)}
                          color={statusColor(inv.status)}
                          size="small"
                          sx={{ fontSize: '0.65rem', height: 18, mt: 0.25 }}
                        />
                      </Box>
                    </ListItem>
                    {i < 5 && <Divider sx={{ my: 0.25 }} />}
                  </React.Fragment>
                ))}
                {(!data?.recentActivity || data.recentActivity.length === 0) && (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body2" sx={{ color: '#475569' }}>No recent invoices</Typography>
                  </Box>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Vendors */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>Top Vendors by Spend</Typography>
                <Tooltip title="View vendors">
                  <IconButton size="small" onClick={() => navigate('/vendors')}>
                    <ArrowForwardRounded sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <List disablePadding>
                {(data?.topVendors || []).slice(0, 6).map((v: any, i) => (
                  <React.Fragment key={v.vendorName}>
                    <ListItem disablePadding sx={{ py: 1 }}>
                      <Box
                        sx={{
                          width: 24, height: 24, borderRadius: '6px', mr: 1.5,
                          background: 'rgba(99,102,241,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.7rem', fontWeight: 700, color: '#818cf8',
                        }}
                      >
                        {i + 1}
                      </Box>
                      <ListItemText
                        primary={v.vendorName}
                        secondary={`${Number(v.invoiceCount)} invoices`}
                        primaryTypographyProps={{ fontSize: '0.83rem', fontWeight: 600 }}
                        secondaryTypographyProps={{ fontSize: '0.72rem', color: '#64748b' }}
                      />
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.83rem' }}>
                          {formatCurrency(Number(v.totalSpend))}
                        </Typography>
                        {Number(v.maxFraudScore) > 50 && (
                          <Chip
                            label="High Risk" color="error" size="small"
                            icon={<WarningRounded />}
                            sx={{ fontSize: '0.65rem', height: 18, mt: 0.25 }}
                          />
                        )}
                      </Box>
                    </ListItem>
                    {i < 5 && <Divider sx={{ my: 0.25 }} />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
