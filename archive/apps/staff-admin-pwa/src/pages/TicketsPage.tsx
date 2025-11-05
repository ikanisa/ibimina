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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { useTickets, useTicket, useAddTicketComment, useUpdateTicketStatus } from '@/hooks/useTickets';
import { TicketStatus } from '@/types/ticket';

export const TicketsPage = () => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  const { data: listData, isLoading, error } = useTickets({ page: page + 1, pageSize });
  const { data: ticketDetail } = useTicket(selectedTicketId || '');
  const addComment = useAddTicketComment();
  const updateStatus = useUpdateTicketStatus();

  const handleOpenDialog = (ticketId: string) => {
    setSelectedTicketId(ticketId);
  };

  const handleCloseDialog = () => {
    setSelectedTicketId(null);
    setComment('');
  };

  const handleAddComment = async () => {
    if (selectedTicketId && comment.trim()) {
      try {
        await addComment.mutateAsync({ id: selectedTicketId, comment: { content: comment } });
        setComment('');
      } catch (err) {
        console.error('Failed to add comment:', err);
      }
    }
  };

  const handleStatusChange = async (status: TicketStatus) => {
    if (selectedTicketId) {
      await updateStatus.mutateAsync({ id: selectedTicketId, update: { status } });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'error';
      case 'Pending':
        return 'warning';
      case 'Closed':
        return 'success';
      default:
        return 'default';
    }
  };

  if (error) {
    return <Alert severity="error">Failed to load tickets. Please try again later.</Alert>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Tickets</Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Subject</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : (
              listData?.tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>{ticket.subject}</TableCell>
                  <TableCell>
                    <Chip label={ticket.status} color={getStatusColor(ticket.status)} size="small" />
                  </TableCell>
                  <TableCell>{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => handleOpenDialog(ticket.id)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={listData?.total || 0}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) => {
            setPageSize(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      <Dialog open={!!selectedTicketId} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {ticketDetail?.ticket.subject}
          <Box mt={1}>
            <Chip
              label={ticketDetail?.ticket.status}
              color={getStatusColor(ticketDetail?.ticket.status || '')}
              size="small"
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" paragraph>
            {ticketDetail?.ticket.description}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            Comments
          </Typography>
          <List>
            {ticketDetail?.comments.map((c) => (
              <ListItem key={c.id} alignItems="flex-start">
                <ListItemText
                  primary={c.authorName}
                  secondary={
                    <>
                      <Typography component="span" variant="body2">
                        {c.content}
                      </Typography>
                      <Typography variant="caption" display="block">
                        {new Date(c.createdAt).toLocaleString()}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Add Comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleStatusChange('Open')}>Open</Button>
          <Button onClick={() => handleStatusChange('Pending')}>Pending</Button>
          <Button onClick={() => handleStatusChange('Closed')}>Close</Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddComment}
            disabled={!comment.trim() || addComment.isPending}
          >
            {addComment.isPending ? <CircularProgress size={24} /> : 'Add Comment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
