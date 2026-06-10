import { Box, Container, Paper, Typography } from "@mui/material";

export default function ResumeAudit() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f4f7fb", py: 4 }}>
      <Container maxWidth="lg">
        <Paper elevation={0} sx={{ p: 4, borderRadius: 2, border: "1px solid #dde5ef" }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Resume Audit
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            This public TalentProATS page is ready for the next design pass.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
