// Debug script to test API calls from frontend
const API_BASE_URL = "http://localhost:3001";

async function testLogin() {
  console.log("Testing login API call...");
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "testpassword123"
      })
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", [...response.headers.entries()]);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Error response:", errorData);
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log("Success! Response:", data);
    return data;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
}

// Test the function
testLogin();
