import express from "express";
import session from "express-session";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcrypt";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: "supersecretkey",
    resave: false,
    saveUninitialized: false
}));

const db = await open({
    filename: "database.db",
    driver: sqlite3.Database
});

app.use(express.static("public"));

function requireLogin(req, res, next) {
    if (!req.session.user) return res.redirect("/login.html");
    next();
}

// REGISTER
app.post("/api/register", async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
        return res.json({ success: false, error: "All fields required" });

    const hashed = await bcrypt.hash(password, 10);

    try {
        await db.run(
            "INSERT INTO users (username, email, password, createdAt) VALUES (?, ?, ?, ?)",
            [username, email, hashed, new Date().toISOString()]
        );
        res.json({ success: true });
    } catch {
        res.json({ success: false, error: "Username or email already exists" });
    }
});

// LOGIN
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) return res.json({ success: false, error: "Invalid email or password" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.json({ success: false, error: "Invalid email or password" });

    req.session.user = { id: user.id, username: user.username, email: user.email };
    res.json({ success: true });
});

// CURRENT USER
app.get("/api/me", requireLogin, async (req, res) => {
    const user = await db.get("SELECT * FROM users WHERE id = ?", [req.session.user.id]);
    res.json(user);
});

// UPDATE PROFILE (username, bio, avatar, socials, role)
app.post("/api/update-profile", requireLogin, async (req, res) => {
    const { username, bio, avatar, steam, youtube, role } = req.body;

    await db.run(
        "UPDATE users SET username = ?, bio = ?, avatar = ?, steam = ?, youtube = ?, role = ? WHERE id = ?",
        [username, bio, avatar, steam, youtube, role, req.session.user.id]
    );

    req.session.user.username = username;
    res.json({ success: true });
});

// CHANGE PASSWORD
app.post("/api/change-password", requireLogin, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await db.get("SELECT * FROM users WHERE id = ?", [req.session.user.id]);

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.json({ success: false, error: "Current password is wrong" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.run("UPDATE users SET password = ? WHERE id = ?", [hashed, user.id]);

    res.json({ success: true });
});

// LOGOUT
app.get("/api/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login.html");
    });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));

