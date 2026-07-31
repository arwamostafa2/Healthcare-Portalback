import express from "express";
import cors from "cors";
import authRoute from "./routes/auth.route";
import visitRoute from "./routes/visit.route";
import doctorRoute from "./routes/doctor.route";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoute);
app.use("/api/visits", visitRoute);
app.use("/api/doctors", doctorRoute);

export default app;


//demoflow

// Patient
//    ↓
// Login
//    ↓
// Reserve Visit
//    ↓
// Doctor
//    ↓
// Start Visit
//    ↓
// Add Medical Information
//    ↓
// Add Treatments
//    ↓
// Finish Visit
//    ↓
// Finance
//    ↓
// Search Visit
//    ↓
// See Total
