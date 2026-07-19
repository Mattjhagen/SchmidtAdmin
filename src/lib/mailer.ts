// Schmidt Construction - Mock Email Dispatcher
// Location: src/lib/mailer.ts

export const mailer = {
  /**
   * Simulates sending a client-facing proposal portal link.
   * Prints the message details to the terminal/console logs.
   */
  async sendProposalEmail(params: {
    toEmail: string;
    clientName: string;
    proposalNumber: string;
    projectTitle: string;
    shareToken: string;
  }): Promise<{ success: boolean; message: string }> {
    const portalUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/portal/${params.shareToken}`
      : `http://localhost:3000/portal/${params.shareToken}`;

    const emailSubject = `Schmidt Construction Proposal Estimate - ${params.projectTitle} (${params.proposalNumber})`;
    
    const emailBody = `
========================================================================
[EMAIL OUTBOX SIMULATOR]
To: ${params.clientName} <${params.toEmail}>
Subject: ${emailSubject}
------------------------------------------------------------------------
Dear ${params.clientName},

Thank you for the opportunity to estimate your project: "${params.projectTitle}". 

Schmidt Construction is proud to offer 50+ years of local Omaha area 
expertise, personal family service, and premium craftsmanship.

We have uploaded your custom detailed project estimate to our secure 
client portal. You can view the line item cost breakdown, select optional 
add-ons, and authorize the contract with a secure digital signature here:

${portalUrl}

If you have any questions or would like to request revisions, please leave
a comment directly in the portal feedback panel.

Sincerely,

John Schmidt
Owner, Schmidt Construction
office@schmidtconstruction.com
========================================================================
    `;

    // Print the email to the console for developers/estimators to inspect
    console.log(emailBody);

    // Simulate async network latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      success: true,
      message: `Simulated email dispatched successfully to ${params.toEmail}`
    };
  }
};
