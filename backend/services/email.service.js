const axios = require('axios');

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || 'your-mailgun-api-key';
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || 'your-mailgun-domain';
const MAILGUN_URL = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@lexartlabs.com';
const FROM_NAME = process.env.FROM_NAME || 'Lexart Labs';

const EmailService = {
  /**
   * Send candidate matches to partners
   * @param {Object} matchData - Object containing partner-candidate matches
   * @returns {Promise} - Promise with the result of the email sending
   */
  sendPartnerMatches: async function(matchData) {
    if (!matchData || Object.keys(matchData).length === 0) {
      return { error: "No match data provided" };
    }

    const results = [];
    const errors = [];

    // Process each partner match
    for (const partnerId in matchData) {
      const partnerData = matchData[partnerId];
      const { partnerEmail, matchingCandidates } = partnerData;

      if (!partnerEmail || !matchingCandidates || matchingCandidates.length === 0) {
        errors.push(`Invalid data for partner ID ${partnerId}`);
        continue;
      }

      try {
        // Create email content
        const subject = `Developers Available To Start This Week, Lexart Team [${partnerData.membershipLevel}]`;
        const html = this.generateMatchEmailHtml(matchingCandidates, partnerData);

        // Send email via Mailgun
        const emailData = {
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: partnerEmail,
          subject: subject,
          html: html
        };

        const response = await this.sendEmail(emailData);
        results.push({
          partnerId,
          email: partnerEmail,
          status: 'sent',
          messageId: response.id
        });
      } catch (error) {
        console.error(`Error sending email to partner ${partnerId}:`, error);
        errors.push({
          partnerId,
          email: partnerEmail,
          error: error.message || 'Unknown error'
        });
      }
    }

    return {
      success: results.length > 0,
      sent: results,
      errors: errors.length > 0 ? errors : null
    };
  },

  /**
   * Generate HTML content for the match email
   * @param {Array} candidates - Array of matching candidates
   * @returns {String} - HTML content for the email
   */
  generateMatchEmailHtml: function(candidates, partnerData) {
    let candidateRows = '';

    // Determine header color based on membership level
    let headerColor = '#4a86e8'; // Default blue for Basic

    if (partnerData.membershipLevel === 'Startup') {
      headerColor = '#4CAF50'; // Green for Startup
    } else if (partnerData.membershipLevel === 'Platinum') {
      headerColor = '#9E9E9E'; // Grey for Platinum
    } else if (partnerData.membershipLevel === 'Enterprise Black') {
      headerColor = '#000000'; // Black for Enterprise Black
    }

    candidates.forEach(candidate => {
      candidateRows += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${candidate.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${candidate.position}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">$${candidate.price}/hour</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">
            ${candidate.cv ? `<a href="${candidate.cv}" target="_blank">View Blind CV</a>` : 'Not available'}
          </td>
        </tr>
      `;
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Matching Developers Available</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${headerColor}; color: white; padding: 10px 20px; }
          .content { padding: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th { background-color: #f2f2f2; text-align: left; padding: 10px; }
          .footer { margin-top: 30px; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Matching Developers Available</h2>
          </div>
          <div class="content">
            <p>Hello <b>${partnerData.partnerName}</b>,</p>
            <p>We have found developers that match your requirements. Please review the details below:</p>

            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Position</th>
                  <th>Price</th>
                  <th>CV</th>
                </tr>
              </thead>
              <tbody>
                ${candidateRows}
              </tbody>
            </table>

            <p>*If you are interested in any of these candidates, please contact us for interview.</p>
						<small>(*) These candidates has availability only for this and next week, if you are interested in, please contact us to book an interview as soon as possible.</small>
						<hr>
            ${partnerData.membershipLevel === 'Enterprise Black' ? 
              `<p>Thank you for choosing <b>Lexart</b> as your development Partner. You already has the maximum level of our membership and we are proud to shape the future together.</p>` : 
              `<p>Thank you for choosing <b>Lexart</b> as your development Partner. Your membership level is <b>${partnerData.membershipLevel}</b> to know how to upgrade your membership for more benefits please contact us.</p>`
            }
            <p>Best regards,<br>Lexart Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  /**
   * Send email using Mailgun API
   * @param {Object} emailData - Email data (from, to, subject, html)
   * @returns {Promise} - Promise with the result of the API call
   */
  sendEmail: async function(emailData) {
    try {
      const auth = {
        username: 'api',
        password: MAILGUN_API_KEY
      };

      const formData = new URLSearchParams();
      Object.keys(emailData).forEach(key => {
        formData.append(key, emailData[key]);
      });

      const response = await axios.post(MAILGUN_URL, formData, { auth });
      return response.data;
    } catch (error) {
      console.error('Error sending email via Mailgun:', error);
      throw error;
    }
  }
};

module.exports = EmailService;
