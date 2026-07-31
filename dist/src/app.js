"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const visit_route_1 = __importDefault(require("./routes/visit.route"));
const doctor_route_1 = __importDefault(require("./routes/doctor.route"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
app.use("/api/auth", auth_route_1.default);
app.use("/api/visits", visit_route_1.default);
app.use("/api/doctors", doctor_route_1.default);
exports.default = app;
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
