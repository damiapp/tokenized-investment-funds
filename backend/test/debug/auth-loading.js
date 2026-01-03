// Test loading auth routes separately
console.log('Loading auth routes...');

try {
  const authRoutes = require("../src/routes/auth");
  console.log('✅ Auth routes loaded successfully');
  console.log('Auth routes:', authRoutes);
} catch (error) {
  console.error('❌ Error loading auth routes:', error.message);
  console.error('Full error:', error);
}

// Test loading auth controller
try {
  const authController = require("../src/controllers/authController");
  console.log('✅ Auth controller loaded successfully');
} catch (error) {
  console.error('❌ Error loading auth controller:', error.message);
  console.error('Full error:', error);
}

// Test loading auth middleware
try {
  const authMiddleware = require("../src/middleware/auth");
  console.log('✅ Auth middleware loaded successfully');
} catch (error) {
  console.error('❌ Error loading auth middleware:', error.message);
  console.error('Full error:', error);
}
