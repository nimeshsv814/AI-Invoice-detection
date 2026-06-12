import React, { useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, LinearProgress, Alert,
  Chip, List, ListItem, ListItemIcon, ListItemText, Divider,
  CircularProgress, Stack, alpha,
} from '@mui/material';
import {
  CloudUploadRounded, CheckCircleRounded, InsertDriveFileRounded,
  CancelRounded, WarningRounded, InfoRounded, PictureAsPdfRounded,
  ImageRounded, ReceiptRounded,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { invoiceApi } from '../services/api';
import { bytesToSize } from '../utils';

interface UploadFile {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress?: number;
  invoiceId?: string;
  error?: string;
}

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/tiff': ['.tiff', '.tif'],
};

function FileTypeIcon({ type }: { type: string }) {
  if (type.includes('pdf')) return <PictureAsPdfRounded sx={{ color: '#ef4444' }} />;
  if (type.includes('image')) return <ImageRounded sx={{ color: '#3b82f6' }} />;
  return <InsertDriveFileRounded />;
}

export default function UploadPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((accepted: File[], rejected: any[]) => {
    const newFiles = accepted.map((f) => ({ file: f, status: 'pending' as const }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    multiple: true,
    maxSize: 20 * 1024 * 1024, // 20MB
  });

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadAll = async () => {
    setUploading(true);
    const pending = files.filter((f) => f.status === 'pending');

    for (let i = 0; i < pending.length; i++) {
      const item = pending[i];
      const fileIdx = files.findIndex((f) => f.file === item.file);

      setFiles((prev) =>
        prev.map((f, idx) => idx === fileIdx ? { ...f, status: 'uploading', progress: 0 } : f)
      );

      try {
        const formData = new FormData();
        formData.append('invoice', item.file);
        const res = await invoiceApi.upload(formData);
        const invoiceId = res.data.data?.id;
        setFiles((prev) =>
          prev.map((f, idx) => idx === fileIdx ? { ...f, status: 'success', progress: 100, invoiceId } : f)
        );
      } catch (err: any) {
        setFiles((prev) =>
          prev.map((f, idx) => idx === fileIdx ? { ...f, status: 'error', error: err.response?.data?.message || 'Upload failed' } : f)
        );
      }
    }

    setUploading(false);
  };

  const successCount = files.filter((f) => f.status === 'success').length;
  const errorCount = files.filter((f) => f.status === 'error').length;
  const pendingCount = files.filter((f) => f.status === 'pending').length;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>Upload Invoices</Typography>
      <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
        Upload PDF, JPEG, PNG, or TIFF invoices. AI will automatically extract data and analyze for fraud.
      </Typography>

      {/* Dropzone */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box
            {...getRootProps()}
            sx={{
              p: 6, textAlign: 'center', cursor: 'pointer',
              border: '2px dashed',
              borderColor: isDragActive ? '#6366f1' : 'rgba(148,163,184,0.15)',
              borderRadius: '12px',
              background: isDragActive ? 'rgba(99,102,241,0.05)' : 'transparent',
              transition: 'all 0.2s ease',
              '&:hover': { borderColor: '#6366f1', background: 'rgba(99,102,241,0.03)' },
            }}
          >
            <input {...getInputProps()} />
            <Box
              sx={{
                width: 72, height: 72, borderRadius: '20px', mx: 'auto', mb: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isDragActive ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.3)',
                transition: 'all 0.2s',
              }}
            >
              <CloudUploadRounded sx={{ fontSize: 36, color: '#6366f1' }} />
            </Box>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 0.75 }}>
              {isDragActive ? 'Drop files here…' : 'Drag & drop invoices here'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
              or click to browse your files
            </Typography>
            <Stack direction="row" spacing={1} justifyContent="center">
              {['PDF', 'JPEG', 'PNG', 'TIFF'].map((ext) => (
                <Chip key={ext} label={ext} size="small" sx={{ fontSize: '0.72rem', background: 'rgba(99,102,241,0.1)', color: '#818cf8' }} />
              ))}
              <Chip label="Max 20MB" size="small" sx={{ fontSize: '0.72rem', background: 'rgba(148,163,184,0.08)', color: '#64748b' }} />
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Files ({files.length})
              </Typography>
              <Stack direction="row" spacing={1}>
                {successCount > 0 && <Chip label={`${successCount} uploaded`} color="success" size="small" />}
                {errorCount > 0 && <Chip label={`${errorCount} failed`} color="error" size="small" />}
                {pendingCount > 0 && <Chip label={`${pendingCount} pending`} color="default" size="small" />}
              </Stack>
            </Box>

            <List disablePadding>
              {files.map((item, idx) => (
                <React.Fragment key={idx}>
                  <ListItem disablePadding sx={{ py: 1.25, px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <FileTypeIcon type={item.file.type} />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.file.name}
                      secondary={bytesToSize(item.file.size)}
                      primaryTypographyProps={{ fontSize: '0.83rem', fontWeight: 600 }}
                      secondaryTypographyProps={{ fontSize: '0.72rem' }}
                      sx={{ flex: 1 }}
                    />
                    <Box sx={{ ml: 2, textAlign: 'right', minWidth: 120 }}>
                      {item.status === 'pending' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label="Pending" size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                          <Button size="small" sx={{ minWidth: 0, p: 0.5, color: '#64748b' }} onClick={() => removeFile(idx)} disabled={uploading}>
                            <CancelRounded fontSize="small" />
                          </Button>
                        </Box>
                      )}
                      {item.status === 'uploading' && (
                        <Box sx={{ width: 100 }}>
                          <LinearProgress />
                          <Typography variant="caption" sx={{ color: '#64748b' }}>Uploading…</Typography>
                        </Box>
                      )}
                      {item.status === 'success' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <CheckCircleRounded sx={{ color: '#10b981', fontSize: 18 }} />
                          <Button size="small" sx={{ fontSize: '0.72rem' }} onClick={() => navigate(`/invoices/${item.invoiceId}`)}>
                            View
                          </Button>
                        </Box>
                      )}
                      {item.status === 'error' && (
                        <Chip label={item.error || 'Failed'} color="error" size="small" icon={<WarningRounded />} sx={{ fontSize: '0.7rem' }} />
                      )}
                    </Box>
                  </ListItem>
                  {idx < files.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {pendingCount > 0 && (
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={() => setFiles([])} disabled={uploading}>
            Clear All
          </Button>
          <Button
            variant="contained" size="large"
            onClick={uploadAll} disabled={uploading}
            startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <CloudUploadRounded />}
          >
            {uploading ? 'Uploading…' : `Upload ${pendingCount} Invoice${pendingCount > 1 ? 's' : ''}`}
          </Button>
        </Box>
      )}

      {successCount > 0 && pendingCount === 0 && !uploading && (
        <Alert severity="success" sx={{ borderRadius: 2 }} action={
          <Button size="small" color="inherit" onClick={() => navigate('/invoices')}>View Invoices</Button>
        }>
          {successCount} invoice{successCount > 1 ? 's' : ''} uploaded successfully. AI processing has started.
        </Alert>
      )}

      {/* Info */}
      <Card sx={{ mt: 3, background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <InfoRounded sx={{ color: '#6366f1', fontSize: 20, mt: 0.2 }} />
            <Typography variant="subtitle2" fontWeight={600}>AI Processing Pipeline</Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.8 }}>
            After upload, each invoice automatically goes through: <strong style={{ color: '#818cf8' }}>OCR extraction</strong> →{' '}
            <strong style={{ color: '#818cf8' }}>duplicate detection</strong> →{' '}
            <strong style={{ color: '#818cf8' }}>fraud analysis</strong> →{' '}
            <strong style={{ color: '#818cf8' }}>approval routing</strong>. Results are available within seconds.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
