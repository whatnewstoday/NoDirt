const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const pool = require('./config/db');
const customerRoutes = require('./routes/customerRoute');
const employeeRoutes = require('./routes/employeeRoute');
const adminRoutes = require('./routes/adminRoute');
const managerRoutes = require('./routes/managerRoute');
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
//npm run dev để chạy server
const app = express();

app.use(cors());
// Middleware xử lý form POST
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/contracts', express.static(path.join(__dirname, 'uploads', 'contracts')));

// Cấu hình session
app.use(session({
  secret: process.env.SESSION_SECRET || '2VZPgz2o5QvFNWu9xJnOLMcqgzlsDMg1',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Dùng route cho khách hàng
app.use('/api/customers', customerRoutes);

// Dùng route cho nhân viên
app.use('/api/employees', employeeRoutes);

// Dùng route cho admin
app.use('/api/admin', adminRoutes);

// Dùng route cho manager
app.use('/api/managers', managerRoutes);

// --- Swagger config ---
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Cleaning Service API",
      version: "1.0.0",
      description: "API Documentation for Home Cleaning Service",
    },
    servers: [{ url: "http://localhost:3000" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));


app.get('/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1');
    if (rows) return res.status(200).json({ db: 'up' });
    return res.status(500).json({ db: 'down' });
  } catch (e) {
    return res.status(500).json({ db: 'down', error: e.message });
  }
});

const { startCronJobs } = require('./utils/cronJobs');

// --- Start server ---
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
  startCronJobs();
});
