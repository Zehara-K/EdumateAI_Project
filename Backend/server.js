 // server.js
const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ================= DATABASE SETUP =================
const db = new sqlite3.Database("./users.db", (err) => {
  if (err) {
    console.error("Database connection error:", err);
  } else {
    console.log("✅ Connected to SQLite database");
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullname TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      class TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error("Error creating table:", err);
    } else {
      console.log("✅ Users table ready");
    }
  });
}

// ================= REGISTER ENDPOINT =================
app.post("/api/register", (req, res) => {
  const { fullname, email, username, password, class: userClass } = req.body;

  if (!fullname || !email || !username || !password || !userClass) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  // Check if username or email already exists
  db.get(
    "SELECT * FROM users WHERE username = ? OR email = ?",
    [username, email],
    (err, row) => {
      if (err) {
        return res.status(500).json({ message: "Database error!" });
      }

      if (row) {
        if (row.username === username) {
          return res.status(400).json({ message: "Username already taken!" });
        }
        if (row.email === email) {
          return res.status(400).json({ message: "Email already registered!" });
        }
      }

      // Insert new user
      db.run(
        "INSERT INTO users (fullname, email, username, password, class) VALUES (?, ?, ?, ?, ?)",
        [fullname, email, username, password, userClass],
        function(err) {
          if (err) {
            console.error("Error inserting user:", err);
            return res.status(500).json({ message: "Registration failed!" });
          }

          res.status(201).json({
            message: "User registered successfully!",
            userId: this.lastID
          });
        }
      );
    }
  );
});

// ================= LOGIN ENDPOINT =================
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required!" });
  }

  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    (err, user) => {
      if (err) {
        return res.status(500).json({ message: "Database error!" });
      }

      if (!user) {
        return res.status(401).json({ message: "User not found!" });
      }

      // Simple password check (in production, use bcrypt)
      if (user.password !== password) {
        return res.status(401).json({ message: "Invalid password!" });
      }

      res.status(200).json({
        message: "Login successful!",
        userId: user.id,
        username: user.username,
        fullname: user.fullname
      });
    }
  );
});

// ================= VIEW ALL USERS (DEBUG) =================
app.get("/api/users", (req, res) => {
  db.all("SELECT id, fullname, email, username, class, created_at FROM users", (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Database error!" });
    }
    res.json({ users: rows });
  });
});

// ================= AI ASK ENDPOINT =================
app.post("/api/ask", async (req, res) => {
  const prompt = req.body.prompt;

  try {
    const response = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "mistral",   // change to your model name if needed
        prompt: prompt,
        stream: false
      })
    });

    const data = await response.json();
    console.log("Ollama raw response:", JSON.stringify(data, null, 2));

    // ✅ Handle both object and array responses
    let reply = "";
    if (data.response) {
      reply = data.response;
    } else if (Array.isArray(data)) {
      reply = data.map(chunk => chunk.response || "").join("");
    } else if (data.message && data.message.content) {
      reply = data.message.content;
    }

    res.json({ reply: reply || "No reply from AI." });
  } catch (err) {
    console.error("Backend error:", err);
    res.status(500).json({ reply: "❌ Failed to connect to Ollama." });
  }
});

// ================= START SERVER =================
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log("⚡ Make sure Ollama is running on port 11434");
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  db.close();
  console.log("Database closed");
  process.exit();
});
