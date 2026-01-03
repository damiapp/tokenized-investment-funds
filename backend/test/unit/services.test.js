const { hashPassword, comparePassword } = require("../../src/services/password");

describe("Password Service", () => {
  describe("hashPassword", () => {
    test("should hash a password successfully", async () => {
      const password = "testpassword123";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are typically 60 chars
    });

    test("should generate different hashes for the same password", async () => {
      const password = "testpassword123";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    test("should handle empty password", async () => {
      const password = "";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
    });
  });

  describe("comparePassword", () => {
    test("should verify correct password", async () => {
      const password = "testpassword123";
      const hash = await hashPassword(password);

      const isValid = await comparePassword(password, hash);
      expect(isValid).toBe(true);
    });

    test("should reject incorrect password", async () => {
      const password = "testpassword123";
      const wrongPassword = "wrongpassword";
      const hash = await hashPassword(password);

      const isValid = await comparePassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    test("should reject empty password", async () => {
      const password = "testpassword123";
      const hash = await hashPassword(password);

      const isValid = await comparePassword("", hash);
      expect(isValid).toBe(false);
    });

    test("should handle comparison with invalid hash", async () => {
      const password = "testpassword123";
      const invalidHash = "invalid-hash";

      const isValid = await comparePassword(password, invalidHash);
      expect(isValid).toBe(false);
    });
  });

  describe("Integration Tests", () => {
    test("should work together for authentication flow", async () => {
      const originalPassword = "testpassword123";
      
      // Hash the password (like during registration)
      const hash = await hashPassword(originalPassword);
      
      // Verify the password (like during login)
      const isValid = await comparePassword(originalPassword, hash);
      
      expect(isValid).toBe(true);
    });

    test("should handle multiple password verifications", async () => {
      const passwords = [
        "password123",
        "mypassword",
        "complexP@ssw0rd!",
        "12345678",
        "abcdefgh",
      ];

      for (const password of passwords) {
        const hash = await hashPassword(password);
        const isValid = await comparePassword(password, hash);
        expect(isValid).toBe(true);
        
        const isInvalid = await comparePassword(password + "wrong", hash);
        expect(isInvalid).toBe(false);
      }
    });
  });
});
