const request = require("supertest");
const express = require("express");
const { TestUser, TestKycStatus } = require("../../src/models/testModels");
const authController = require("../../src/controllers/authController");

// Create a test app with auth routes
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Mock auth middleware for testing protected routes
  const mockAuthMiddleware = (req, res, next) => {
    req.user = {
      id: "test-user-id",
      email: "test@example.com",
      role: "LP",
      walletAddress: null,
    };
    next();
  };

  // Auth routes
  app.post("/auth/register", authController.register);
  app.post("/auth/login", authController.login);
  app.get("/auth/me", mockAuthMiddleware, authController.getCurrentUser);

  return app;
};

describe("Auth Endpoints", () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe("POST /auth/register", () => {
    const validUser = {
      email: "test@example.com",
      password: "testpassword123",
      role: "LP",
      walletAddress: "0x1234567890123456789012345678901234567890",
    };

    test("should register a new user successfully", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send(validUser)
        .expect(201);

      expect(response.body.data).toHaveProperty("user");
      expect(response.body.data).toHaveProperty("token");
      expect(response.body.data.user.email).toBe(validUser.email);
      expect(response.body.data.user.role).toBe(validUser.role);
      expect(response.body.data.user).not.toHaveProperty("passwordHash");
      expect(response.body.data.token).toBeDefined();
    });

    test("should create KYC status record for new user", async () => {
      await request(app)
        .post("/auth/register")
        .send(validUser)
        .expect(201);

      const kycStatus = await TestKycStatus.findOne({
        where: { userId: TestUser.findOne({ where: { email: validUser.email } }).then(u => u?.id) }
      });
      
      expect(kycStatus).toBeDefined();
      expect(kycStatus.status).toBe("pending");
    });

    test("should return 400 for missing required fields", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({ email: "test@example.com" })
        .expect(400);

      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.message).toContain("required");
    });

    test("should return 400 for invalid role", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({
          ...validUser,
          role: "INVALID_ROLE",
        })
        .expect(400);

      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.message).toContain("GP or LP");
    });

    test("should return 400 for short password", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({
          ...validUser,
          password: "123",
        })
        .expect(400);

      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.message).toContain("8 characters");
    });

    test("should return 400 for invalid wallet address", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({
          ...validUser,
          walletAddress: "invalid-address",
        })
        .expect(400);

      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.message).toContain("wallet address");
    });

    test("should return 409 for duplicate email", async () => {
      // Register first user
      await request(app)
        .post("/auth/register")
        .send(validUser)
        .expect(201);

      // Try to register same email again
      const response = await request(app)
        .post("/auth/register")
        .send(validUser)
        .expect(409);

      expect(response.body.error.code).toBe("EMAIL_EXISTS");
      expect(response.body.error.message).toContain("already registered");
    });

    test("should register user without wallet address", async () => {
      const response = await request(app)
        .post("/auth/register")
        .send({
          email: "nowallet@example.com",
          password: "testpassword123",
          role: "GP",
        })
        .expect(201);

      expect(response.body.data.user.walletAddress).toBeNull();
    });
  });

  describe("POST /auth/login", () => {
    const testUser = {
      email: "login@example.com",
      password: "testpassword123",
      role: "LP",
    };

    beforeEach(async () => {
      // Register a user for login tests
      await request(createTestApp())
        .post("/auth/register")
        .send(testUser);
    });

    test("should login successfully with valid credentials", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body.data).toHaveProperty("token");
      expect(response.body.data).toHaveProperty("user");
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user).not.toHaveProperty("passwordHash");
    });

    test("should return 400 for missing email or password", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({ email: testUser.email })
        .expect(400);

      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(response.body.error.message).toContain("required");
    });

    test("should return 401 for invalid email", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: testUser.password,
        })
        .expect(401);

      expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    test("should return 401 for invalid password", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: testUser.email,
          password: "wrongpassword",
        })
        .expect(401);

      expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
    });
  });

  describe("GET /auth/me", () => {
    test("should return current user info", async () => {
      const response = await request(app)
        .get("/auth/me")
        .expect(200);

      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data).toHaveProperty("email");
      expect(response.body.data).toHaveProperty("role");
      expect(response.body.data).toHaveProperty("walletAddress");
      expect(response.body.data).toHaveProperty("kyc");
      expect(response.body.data.kyc).toHaveProperty("status");
      expect(response.body.data.kyc).toHaveProperty("updatedAt");
    });
  });
});
