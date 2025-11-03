import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useOrders, useUpdateOrderStatus } from '@/hooks/useOrders';
import { OrderStatus } from '@/types/order';

export const OrdersPage = () => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter] = useState<string>('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data, isLoading, error } = useOrders({
    page: page + 1,
    pageSize,
    status: statusFilter || undefined,
  });
  const updateStatus = useUpdateOrderStatus();

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, orderId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrderId(orderId);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedOrderId(null);
  };

  const handleStatusChange = async (status: OrderStatus) => {
    if (selectedOrderId) {
      await updateStatus.mutateAsync({ id: selectedOrderId, update: { status } });
      handleCloseMenu();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Rejected':
        return 'error';
      case 'Shipped':
        return 'info';
      default:
        return 'default';
    }
  };

  if (error) {
    return <Alert severity="error">Failed to load orders. Please try again later.</Alert>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Orders</Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order #</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Updated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : (
              data?.orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.number}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>
                    {order.total.currency} {order.total.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Chip label={order.status} color={getStatusColor(order.status)} size="small" />
                  </TableCell>
                  <TableCell>{new Date(order.updatedAt).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      onClick={(e) => handleOpenMenu(e, order.id)}
                      disabled={order.status === 'Shipped' || order.status === 'Rejected'}
                    >
                      Change Status
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={data?.total || 0}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) => {
            setPageSize(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
        <MenuItem onClick={() => handleStatusChange('Approved')}>Approve</MenuItem>
        <MenuItem onClick={() => handleStatusChange('Rejected')}>Reject</MenuItem>
        <MenuItem onClick={() => handleStatusChange('Shipped')}>Ship</MenuItem>
      </Menu>
    </Box>
  );
};
