import nodemailer from "nodemailer";

let configOptions = {
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false, 
    tls: {
        rejectUnauthorized: true,
        minVersion: "TLSv1.2",
    },
};

const sendMail = async ({to, subject, text, html}) => {
    try {
        const transporter = nodemailer.createTransport({
            ...configOptions,
            auth: {
                user: "**********",
                pass: "**********",
            },
            debug: true
        });

        const info = await transporter.sendMail({
            from: `Eventopia 📧 <"workmy179@gmail.com">`,
            to,
            subject,
            text,
            html,
        });

        if (info.messageId) {
            console.log("Message sent successfully:", info.messageId);
            return "Message sent successfully";
        } else {
            return "Something went wrong with mailer";
        }
    } catch (error) {
        console.error("Error sending email:", error.message);
        throw error; 
    }
};

export default sendMail;
