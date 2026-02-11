require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { sequelize } = require("./models");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

const authRoutes = require("./routes/auth");
const kycRoutes = require("./routes/kyc");
const fundRoutes = require("./routes/funds");
const investmentRoutes = require("./routes/investments");
const healthRoutes = require("./routes/health");
const transactionRoutes = require("./routes/transactions");

app.use("/auth", authRoutes);
app.use("/kyc", kycRoutes);
app.use("/funds", fundRoutes);
app.use("/investments", investmentRoutes);
app.use("/health", healthRoutes);
app.use("/transactions", transactionRoutes);


app.use((req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
});

app.use((err, _req, res, _next) => {
  const message = err instanceof Error ? err.message : "Unexpected error";
  res.status(500).json({ error: { code: "INTERNAL", message } });
});

const port = Number(process.env.PORT || 3001);

const contractService = require("./services/contractService");
const eventListener = require("./services/eventListener");

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully.");

    await sequelize.sync({ alter: true });
    console.log("Database models synchronized.");

    contractService.initialize().catch((err) => {
      console.warn("Contract service initialization failed:", err.message);
    });

    setTimeout(() => {
      eventListener.initialize().catch((err) => {
        console.warn("Event listener initialization failed:", err.message);
      });
    }, 2000); // Wait 2 seconds for contract service to initialize

    app.listen(port, () => {
      process.stdout.write(`Backend listening on http://localhost:${port}\n`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
