import nodemailer from 'nodemailer';

let transporterPromise;

// Create or reuse transporter
async function getTransporter() {
    if (!transporterPromise) {
        transporterPromise = nodemailer.createTestAccount().then((testAccount) => {
        return nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
            user: testAccount.user,
            pass: testAccount.pass,
            },
        });
        });
    }
    return transporterPromise;
}

export async function sendEmail({ to, subject, text, html }) {
    const transporter = await getTransporter();

    const info = await transporter.sendMail({
        from: '"Eventonica Alerts" <no-reply@eventonica.com>',
        to,
        subject,
        text,
        html,
    });

    console.log('📧 Email sent: %s', info.messageId);
    console.log('🔗 Preview URL: %s', nodemailer.getTestMessageUrl(info));
}
