import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 1️⃣ MongoDB connection
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/aureon_tours", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// 2️⃣ Schemas
const BookingSchema = new mongoose.Schema({
  name: String,
  email: String,
  people: Number,
  pkgTitle: String,
  totalGBP: Number,
  createdAt: { type: Date, default: Date.now },
});

const ContactSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  topic: String,
  createdAt: { type: Date, default: Date.now },
});

const Booking = mongoose.model("Booking", BookingSchema);
const Contact = mongoose.model("Contact", ContactSchema);

// 3️⃣ Email transporter (Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 4️⃣ Booking endpoint
app.post("/api/bookings", async (req, res) => {
  try {
    const booking = await Booking.create(req.body);

    // Send email to admin
    await transporter.sendMail({
      from: `"AUREON Le Vane Group" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `New Tour Booking: ${booking.pkgTitle}`,
      text: `New booking from ${booking.name} (${booking.email})
Tour: ${booking.pkgTitle}
People: ${booking.people}
Total: £${booking.totalGBP}`,
    });

    // Send confirmation email to client
    await transporter.sendMail({
      from: `"AUREON Le Vane Group" <${process.env.EMAIL_USER}>`,
      to: booking.email,
      subject: `Booking Confirmation - ${booking.pkgTitle}`,
      text: `Hi ${booking.name},

Thank you for booking the ${booking.pkgTitle} with AUREON Le Vane Group.
We’ll contact you soon to finalize your arrangements.

Kind regards,
AUREON Le Vane Group`,
    });

    res.json({ success: true, booking });
  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).json({ success: false });
  }
});

// 5️⃣ Contact endpoint
app.post("/api/contact", async (req, res) => {
  try {
    const contact = await Contact.create(req.body);

    await transporter.sendMail({
      from: `"AUREON Le Vane Group" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `New Contact Message (${contact.topic})`,
      text: `From: ${contact.name} (${contact.email})
Topic: ${contact.topic}
Message:
${contact.message}`,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Contact error:", err);
    res.status(500).json({ success: false });
  }
});

// 6️⃣ Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// ✅ Booking Route
app.post("/api/book", async (req, res) => {
  const { name, email, phone, packageType, numPeople, date, includeArmenia, total } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // your Gmail or business email
        pass: process.env.EMAIL_PASS, // app password
      },
    });

    await transporter.sendMail({
      from: `"Aureon Group" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_RECEIVER || process.env.EMAIL_USER, // send to your inbox
      subject: `New Booking Request: ${packageType}`,
      html: `
        <h2>New Booking Received</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Package:</strong> ${packageType}</p>
        <p><strong>Number of People:</strong> ${numPeople}</p>
        <p><strong>Start Date:</strong> ${date}</p>
        <p><strong>Include Armenia Add-On:</strong> ${includeArmenia ? "Yes" : "No"}</p>
        <p><strong>Total Price:</strong> £${total}</p>
      `,
    });

    res.json({ success: true, message: "Booking email sent successfully" });
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({ success: false, error: "Failed to send email" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
