import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Grid, Typography, Chip, Button, LinearProgress,
  Divider, CircularProgress, Avatar, Stack, Alert, Table,
  TableBody, TableCell, TableHead, TableRow, Tooltip, IconButton,
} from '@mui/material';
import {
  ArrowBackRounded, CheckCircleRounded, CancelRounded, HourglassTopRounded,
  SecurityRounded, ContentCopyRounded, ReceiptLongRounded, ImageRounded,
  WarningRounded, InfoRounded, ThumbUpRounded, ThumbDownRounded,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { invoiceApi } from '../services/api';
import { Invoice } from '../types';
import { formatCurrency, formatDate, formatDateTime, statusColor, statusLabel, riskColor, bytesToSize } from '../utils';

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', py: 1, borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, minWidth: 160, fontSize: '0.8rem' }}>{label}</Typography>
      <Typography variant="body2" sx={{ color: '#f1f5f9', fontSize: '0.83rem', fontWeight: 500 }}>{value || '—'}</Typography>
    </Box>
  );
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await invoiceApi.getById(id!);
        setInvoice(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleAction = async (status: 'approved' | 'rejected', comments?: string) => {
    if (!invoice) return;
    setActionLoading(true);
    try {
      const res = await invoiceApi.updateStatus(invoice.id, status, comments);
      setInvoice(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
  }

  if (!invoice) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <Typography variant="h6" sx={{ color: '#64748b' }}>Invoice not found</Typography>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/invoices')}>Back to Invoices</Button>
      </Box>
    );
  }

  const fr = invoice.fraudResult;
  const dr = invoice.duplicateResult;

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/invoices')} size="small">
          <ArrowBackRounded />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={700}>{invoice.invoiceNumber || `Invoice ${invoice.id.slice(0, 8)}`}</Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Uploaded {formatDateTime(invoice.createdAt)}
          </Typography>
        </Box>
        <Chip label={statusLabel(invoice.status)} color={statusColor(invoice.status)} />
      </Box>

      <Grid container spacing={2.5}>
        {/* Left column */}
        <Grid item xs={12} md={8}>
          {/* Invoice Details */}
          <Card sx={{ mb: 2.5 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ReceiptLongRounded sx={{ color: '#6366f1' }} />
                <Typography variant="h6" fontWeight={700}>Invoice Details</Typography>
              </Box>
              <InfoRow label="Invoice Number" value={invoice.invoiceNumber} />
              <InfoRow label="Vendor Name" value={invoice.vendorName} />
              <InfoRow label="Vendor Address" value={invoice.vendorAddress} />
              <InfoRow label="PO Number" value={invoice.poNumber} />
              <InfoRow label="Invoice Date" value={formatDate(invoice.invoiceDate)} />
              <InfoRow label="Due Date" value={formatDate(invoice.dueDate)} />
              <InfoRow label="Currency" value={invoice.currency} />
              <InfoRow label="Subtotal" value={formatCurrency(Number(invoice.subtotal || 0), invoice.currency)} />
              <InfoRow label="Tax Amount" value={formatCurrency(Number(invoice.taxAmount || 0), invoice.currency)} />
              <InfoRow label="Total Amount" value={
                <Typography fontWeight={700} sx={{ color: '#6366f1', fontSize: '1rem' }}>
                  {formatCurrency(Number(invoice.totalAmount || 0), invoice.currency)}
                </Typography>
              } />
              <InfoRow label="File Name" value={invoice.fileName} />
              <InfoRow label="File Size" value={bytesToSize(invoice.fileSize)} />
            </CardContent>
          </Card>

          {/* Line Items */}
          {invoice.lineItems && invoice.lineItems.length > 0 && (
            <Card sx={{ mb: 2.5 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Line Items</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoice.lineItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.lineNumber}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell><Chip label={item.category || '—'} size="small" /></TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(Number(item.unitPrice), invoice.currency)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(Number(item.amount), invoice.currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* OCR Result */}
          {invoice.ocrResult && (
            <Card sx={{ mb: 2.5 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <ImageRounded sx={{ color: '#3b82f6' }} />
                  <Typography variant="h6" fontWeight={700}>OCR Extraction Results</Typography>
                  <Chip
                    label={`${invoice.ocrResult.confidenceScore.toFixed(1)}% confidence`}
                    size="small"
                    color={invoice.ocrResult.confidenceScore >= 80 ? 'success' : invoice.ocrResult.confidenceScore >= 60 ? 'warning' : 'error'}
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={invoice.ocrResult.confidenceScore}
                  sx={{
                    mb: 2, height: 8, borderRadius: 4,
                    backgroundColor: 'rgba(148,163,184,0.1)',
                    '& .MuiLinearProgress-bar': {
                      background: invoice.ocrResult.confidenceScore >= 80 ? '#10b981' : '#f59e0b',
                    },
                  }}
                />
                <Grid container spacing={1.5}>
                  {Object.entries(invoice.ocrResult.fieldConfidences || {}).map(([field, conf]) => (
                    <Grid item xs={6} sm={4} key={field}>
                      <Box sx={{ p: 1.25, background: 'rgba(148,163,184,0.05)', borderRadius: 1.5 }}>
                        <Typography variant="caption" sx={{ color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
                          {field.replace(/_/g, ' ')}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                          <Box sx={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(148,163,184,0.2)', overflow: 'hidden' }}>
                            <Box sx={{ height: '100%', width: `${Number(conf) * 100}%`, background: Number(conf) >= 0.8 ? '#10b981' : '#f59e0b', borderRadius: 2 }} />
                          </Box>
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem', minWidth: 30, textAlign: 'right' }}>
                            {(Number(conf) * 100).toFixed(0)}%
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Right column */}
        <Grid item xs={12} md={4}>
          {/* AI Recommendation */}
          {invoice.aiRecommendation && (
            <Card sx={{ mb: 2.5, border: '1px solid', borderColor: invoice.aiRecommendation === 'approve' ? 'rgba(16,185,129,0.3)' : invoice.aiRecommendation === 'reject' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <InfoRounded sx={{ color: '#6366f1' }} />
                  <Typography variant="h6" fontWeight={700}>AI Recommendation</Typography>
                </Box>
                <Chip
                  label={invoice.aiRecommendation === 'approve' ? 'Approve' : invoice.aiRecommendation === 'reject' ? 'Reject' : 'Manual Review'}
                  color={invoice.aiRecommendation === 'approve' ? 'success' : invoice.aiRecommendation === 'reject' ? 'error' : 'warning'}
                  icon={invoice.aiRecommendation === 'approve' ? <ThumbUpRounded /> : invoice.aiRecommendation === 'reject' ? <ThumbDownRounded /> : <WarningRounded />}
                  sx={{ mb: 1.5, fontWeight: 700 }}
                />
                {invoice.aiExplanation && (
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.6 }}>
                    {invoice.aiExplanation}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {invoice.status === 'pending_review' && (
            <Card sx={{ mb: 2.5 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Actions</Typography>
                <Stack spacing={1.5}>
                  <Button
                    fullWidth variant="contained" color="success"
                    startIcon={<CheckCircleRounded />}
                    disabled={actionLoading}
                    onClick={() => handleAction('approved')}
                  >
                    Approve Invoice
                  </Button>
                  <Button
                    fullWidth variant="outlined" color="error"
                    startIcon={<CancelRounded />}
                    disabled={actionLoading}
                    onClick={() => handleAction('rejected', 'Rejected by reviewer')}
                  >
                    Reject Invoice
                  </Button>
                  <Button fullWidth variant="outlined" startIcon={<HourglassTopRounded />} disabled={actionLoading}>
                    Put On Hold
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Fraud Score */}
          {fr && (
            <Card sx={{ mb: 2.5, border: '1px solid', borderColor: fr.riskLevel === 'critical' ? 'rgba(239,68,68,0.3)' : fr.riskLevel === 'high' ? 'rgba(249,115,22,0.3)' : 'transparent' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <SecurityRounded sx={{ color: '#ef4444' }} />
                  <Typography variant="h6" fontWeight={700}>Fraud Analysis</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography variant="h3" fontWeight={800} sx={{ color: fr.riskScore > 60 ? '#ef4444' : fr.riskScore > 30 ? '#f59e0b' : '#10b981' }}>
                    {fr.riskScore.toFixed(0)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Risk Score / 100</Typography>
                </Box>
                <Chip label={fr.riskLevel.toUpperCase()} color={riskColor(fr.riskLevel)} sx={{ mb: 1.5, width: '100%' }} />
                {fr.fraudIndicators?.length > 0 && (
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 0.75 }}>
                      Risk Indicators
                    </Typography>
                    <Stack spacing={0.5}>
                      {fr.fraudIndicators.map((ind, i) => (
                        <Box key={i} sx={{ display: 'flex', gap: 0.75, alignItems: 'flex-start' }}>
                          <WarningRounded sx={{ fontSize: 14, color: '#f59e0b', mt: 0.2, flexShrink: 0 }} />
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.73rem' }}>{ind}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {/* Duplicate Check */}
          {dr && (
            <Card sx={{ mb: 2.5, border: '1px solid', borderColor: dr.isDuplicate ? 'rgba(239,68,68,0.3)' : 'transparent' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <ContentCopyRounded sx={{ color: dr.isDuplicate ? '#ef4444' : '#10b981' }} />
                  <Typography variant="h6" fontWeight={700}>Duplicate Detection</Typography>
                </Box>
                {dr.isDuplicate ? (
                  <Alert severity="error" icon={<WarningRounded />} sx={{ mb: 1.5, borderRadius: 1.5 }}>
                    Duplicate detected! {dr.similarityPercentage?.toFixed(0)}% similarity.
                  </Alert>
                ) : (
                  <Alert severity="success" icon={<CheckCircleRounded />} sx={{ mb: 1.5, borderRadius: 1.5 }}>
                    No duplicate found
                  </Alert>
                )}
                {dr.comparedInvoiceNumber && (
                  <InfoRow label="Similar to" value={dr.comparedInvoiceNumber} />
                )}
                {dr.duplicateType && <InfoRow label="Type" value={dr.duplicateType.replace('_', ' ')} />}
                {dr.matchingFields?.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Matching fields:</Typography>
                    <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
                      {dr.matchingFields.map((f) => <Chip key={f} label={f} size="small" sx={{ fontSize: '0.65rem' }} />)}
                    </Stack>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
