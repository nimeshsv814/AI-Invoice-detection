import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Button, CircularProgress,
  Table, TableBody, TableCell, TableHead, TableRow, Avatar,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, FormControl, InputLabel, Stack,
} from '@mui/material';
import { AddRounded, EditRounded, BlockRounded, CheckCircleRounded, PersonRounded } from '@mui/icons-material';
import { authApi } from '../services/api';
import { User } from '../types';
import { formatDateTime, getInitials } from '../utils';

const ROLE_COLOR: any = { admin: 'error', finance_manager: 'warning', finance_analyst: 'primary', vendor_manager: 'info', auditor: 'secondary' };

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    roleName: '',
    department: '',
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await authApi.getUsers();
      const data = res.data.data;
      setUsers(Array.isArray(data) ? data : data?.users || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (id: string) => {
    setDeleteLoading(id);
    try {
      await authApi.deleteUser(id);
      fetchUsers();
    } catch (err) { console.error(err); }
    finally { setDeleteLoading(null); }
  };

  const handleCreate = async () => {
    setCreateLoading(true);
    try {
      await authApi.register(form);
      setDialogOpen(false);
      setForm({ firstName: '', lastName: '', email: '', password: '', roleName: '', department: '' });
      fetchUsers();
    } catch (err) { console.error(err); }
    finally { setCreateLoading(false); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>User Management</Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>{users.length} registered users</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRounded />} onClick={() => setDialogOpen(true)}>
          Add User
        </Button>
      </Box>

      <Card>
        <TableContainer component={Box}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><CircularProgress size={32} /></TableCell></TableRow>
              ) : users.map((user) => (
                <TableRow key={user.id} hover sx={{ '&:hover': { background: 'rgba(99,102,241,0.04) !important' } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <Avatar
                        sx={{
                          width: 32, height: 32, fontSize: '0.75rem', fontWeight: 700,
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        }}
                      >
                        {getInitials(user.firstName, user.lastName)}
                      </Avatar>
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.83rem' }}>
                        {user.firstName} {user.lastName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#94a3b8' }}>{user.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.roleName?.replace('_', ' ')}
                      color={ROLE_COLOR[user.roleName] || 'default'}
                      size="small"
                      sx={{ textTransform: 'capitalize', fontSize: '0.7rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#94a3b8' }}>{user.department || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.isActive ? 'Active' : 'Inactive'}
                      color={user.isActive ? 'success' : 'default'}
                      size="small"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Edit">
                      <IconButton size="small"><EditRounded sx={{ fontSize: 16 }} /></IconButton>
                    </Tooltip>
                    <Tooltip title={user.isActive ? 'Deactivate' : 'Activate'}>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(user.id)}
                        disabled={deleteLoading === user.id}
                      >
                        {deleteLoading === user.id ? (
                          <CircularProgress size={14} />
                        ) : user.isActive ? (
                          <BlockRounded sx={{ fontSize: 16, color: '#ef4444' }} />
                        ) : (
                          <CheckCircleRounded sx={{ fontSize: 16, color: '#10b981' }} />
                        )}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { background: '#0f0f1e' } }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PersonRounded sx={{ color: '#6366f1' }} />
            <Typography variant="h6" fontWeight={700}>Add New User</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Stack direction="row" spacing={2}>
              <TextField fullWidth label="First Name" size="small" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
              <TextField fullWidth label="Last Name" size="small" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
            </Stack>
            <TextField fullWidth label="Email Address" type="email" size="small" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            <TextField fullWidth label="Password" type="password" size="small" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
            <FormControl fullWidth size="small">
              <InputLabel>Role</InputLabel>
              <Select label="Role" value={form.roleName} onChange={(e) => setForm((f) => ({ ...f, roleName: e.target.value }))}>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="finance_manager">Finance Manager</MenuItem>
                <MenuItem value="finance_analyst">Finance Analyst</MenuItem>
                <MenuItem value="vendor_manager">Vendor Manager</MenuItem>
                <MenuItem value="auditor">Auditor</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth label="Department" size="small" value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={createLoading ? <CircularProgress size={16} color="inherit" /> : <AddRounded />}
            onClick={handleCreate}
            disabled={createLoading || !form.firstName || !form.lastName || !form.email || !form.password || !form.roleName}
          >
            Create User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function TableContainer({ component: Component, children }: any) {
  return <Component sx={{ overflowX: 'auto' }}>{children}</Component>;
}
