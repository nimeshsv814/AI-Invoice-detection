import React from 'react';
import { Box, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar, { DRAWER_WIDTH } from './Sidebar';
import Header from './Header';

export default function AppShell() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: '#0a0a14' }}>
      <Sidebar />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header />
        <Toolbar sx={{ minHeight: '64px !important' }} />
        <Box
          component="main"
          sx={{
            flex: 1,
            p: 3,
            overflow: 'auto',
            background: 'linear-gradient(180deg, rgba(99,102,241,0.03) 0%, transparent 400px)',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
