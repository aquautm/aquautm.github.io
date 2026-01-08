const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendMail = async ({ to, subject, html }) => {
  try {
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: to,
      subject: subject,
      html: html,
    });
    console.log("Email sent successfully:", data);
    return data;
  } catch (error) {
    console.error("Email failed to send:", error);
    throw error;
  }
};

module.exports = { sendMail };

//re_eYftCgJF_ERpoCpZURHicxGrni4jvw6W3