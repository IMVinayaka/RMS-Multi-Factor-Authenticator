export const CANDIDATE_SNAPSHOT_EMAIL_TEMPLATE = `
<div style="font-family: Arial, Helvetica, sans-serif; color: #071127; font-size: 14px; line-height: 1.55;">
  <p style="margin: 0 0 14px;">Hi,</p>
  @@SummaryBlock
  <table style="border-collapse: collapse; width: 100%; max-width: 680px; margin: 0 0 16px; border: 1px solid #dfe7f2;">
    <thead>
      <tr>
        <th colspan="2" style="text-align: left; padding: 10px 12px; background: #edf4ff; color: #0d5fec; border-bottom: 1px solid #dfe7f2; font-size: 14px;">Candidate Information</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="width: 34%; padding: 9px 12px; border-bottom: 1px solid #edf1f7; color: #536383; font-weight: 700;">Candidate Name</td>
        <td style="padding: 9px 12px; border-bottom: 1px solid #edf1f7;">@@CandidateName</td>
      </tr>
      <tr>
        <td style="padding: 9px 12px; border-bottom: 1px solid #edf1f7; color: #536383; font-weight: 700;">Job Title</td>
        <td style="padding: 9px 12px; border-bottom: 1px solid #edf1f7;">@@JobTitle</td>
      </tr>
      <tr>
        <td style="padding: 9px 12px; border-bottom: 1px solid #edf1f7; color: #536383; font-weight: 700;">Total Experience</td>
        <td style="padding: 9px 12px; border-bottom: 1px solid #edf1f7;">@@TotalExperience</td>
      </tr>
      <tr>
        <td style="padding: 9px 12px; color: #536383; font-weight: 700;">Location</td>
        <td style="padding: 9px 12px;">@@Location</td>
      </tr>
    </tbody>
  </table>
  @@SnapshotBlock
  <p style="margin: 0;">Regards,</p>
</div>
`.trim();
