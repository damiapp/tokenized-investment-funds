const { TestUser, TestKycStatus } = require("../../src/models/testModels");

describe("Database Models", () => {
  describe("User Model", () => {
    test("should create a user with valid data", async () => {
      const userData = {
        email: "test@example.com",
        passwordHash: "hashedpassword",
        role: "LP",
        walletAddress: "0x1234567890123456789012345678901234567890",
      };

      const user = await TestUser.create(userData);

      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.passwordHash).toBe(userData.passwordHash);
      expect(user.role).toBe(userData.role);
      expect(user.walletAddress).toBe(userData.walletAddress);
    });

    test("should not create user with invalid email", async () => {
      await expect(
        TestUser.create({
          email: "invalid-email",
          passwordHash: "hashedpassword",
          role: "LP",
        })
      ).rejects.toThrow();
    });

    test("should not create user with invalid role", async () => {
      await expect(
        TestUser.create({
          email: "test@example.com",
          passwordHash: "hashedpassword",
          role: "INVALID_ROLE",
        })
      ).rejects.toThrow();
    });

    test("should not create user with invalid wallet address", async () => {
      await expect(
        TestUser.create({
          email: "test@example.com",
          passwordHash: "hashedpassword",
          role: "LP",
          walletAddress: "invalid-address",
        })
      ).rejects.toThrow();
    });

    test("should create user without wallet address", async () => {
      const user = await TestUser.create({
        email: "test@example.com",
        passwordHash: "hashedpassword",
        role: "GP",
      });

      expect(user.walletAddress).toBeNull();
    });

    test("should enforce unique email constraint", async () => {
      const userData = {
        email: "duplicate@example.com",
        passwordHash: "hashedpassword",
        role: "LP",
      };

      await TestUser.create(userData);

      await expect(TestUser.create(userData)).rejects.toThrow();
    });
  });

  describe("KYC Status Model", () => {
    let testUser;

    beforeEach(async () => {
      testUser = await TestUser.create({
        email: "kyc@example.com",
        passwordHash: "hashedpassword",
        role: "LP",
      });
    });

    test("should create KYC status with valid data", async () => {
      const kycData = {
        userId: testUser.id,
        status: "pending",
        providerRef: "provider-123",
      };

      const kycStatus = await TestKycStatus.create(kycData);

      expect(kycStatus.id).toBeDefined();
      expect(kycStatus.userId).toBe(testUser.id);
      expect(kycStatus.status).toBe(kycData.status);
      expect(kycStatus.providerRef).toBe(kycData.providerRef);
      expect(kycStatus.updatedAt).toBeDefined();
    });

    test("should create KYC status with default pending status", async () => {
      const kycStatus = await TestKycStatus.create({
        userId: testUser.id,
      });

      expect(kycStatus.status).toBe("pending");
    });

    test("should not create KYC status with invalid status", async () => {
      await expect(
        TestKycStatus.create({
          userId: testUser.id,
          status: "INVALID_STATUS",
        })
      ).rejects.toThrow();
    });

    test("should not create KYC status without userId", async () => {
      await expect(
        TestKycStatus.create({
          status: "pending",
        })
      ).rejects.toThrow();
    });
  });

  describe("Model Associations", () => {
    let testUser;
    let testKycStatus;

    beforeEach(async () => {
      testUser = await TestUser.create({
        email: "assoc@example.com",
        passwordHash: "hashedpassword",
        role: "LP",
      });

      testKycStatus = await TestKycStatus.create({
        userId: testUser.id,
        status: "approved",
      });
    });

    test("should find KYC status through user association", async () => {
      const userWithKyc = await TestUser.findByPk(testUser.id, {
        include: [{ association: "kyc" }],
      });

      expect(userWithKyc.kyc).toBeDefined();
      expect(userWithKyc.kyc.status).toBe("approved");
    });

    test("should find user through KYC status association", async () => {
      const kycWithUser = await TestKycStatus.findByPk(testKycStatus.id, {
        include: [{ association: "user" }],
      });

      expect(kycWithUser.user).toBeDefined();
      expect(kycWithUser.user.email).toBe(testUser.email);
    });
  });

  describe("Model Validations", () => {
    test("should validate wallet address format", async () => {
      const validAddress = "0x1234567890123456789012345678901234567890";
      
      await expect(
        TestUser.create({
          email: `test-${Math.random()}@example.com`,
          passwordHash: "hashedpassword",
          role: "LP",
          walletAddress: validAddress,
        })
      ).resolves.toBeDefined();
    });

    test("should reject invalid wallet addresses", async () => {
      const invalidAddresses = [
        "0x123", // too short
        "1234567890123456789012345678901234567890", // missing 0x
        "0x123456789012345678901234567890123456789", // wrong length
        "0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG", // invalid hex
      ];

      for (const address of invalidAddresses) {
        await expect(
          TestUser.create({
            email: `test-${Math.random()}@example.com`,
            passwordHash: "hashedpassword",
            role: "LP",
            walletAddress: address,
          })
        ).rejects.toThrow();
      }
    });

    test("should validate email format", async () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.co.uk",
        "user+tag@example.org",
      ];

      for (const email of validEmails) {
        await expect(
          TestUser.create({
            email,
            passwordHash: "hashedpassword",
            role: "LP",
          })
        ).resolves.toBeDefined();
      }
    });

    test("should reject invalid email formats", async () => {
      const invalidEmails = [
        "invalid-email",
        "@example.com",
        "test@",
        "test.example.com",
      ];

      for (const email of invalidEmails) {
        await expect(
          TestUser.create({
            email,
            passwordHash: "hashedpassword",
            role: "LP",
          })
        ).rejects.toThrow();
      }
    });
  });
});
