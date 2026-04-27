import sqlite3 from "sqlite3";
import { open } from "sqlite";

const db = await open({
    filename: "database.db",
    driver: sqlite3.Database
});

await db.exec(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    bio TEXT DEFAULT '',
    avatar TEXT DEFAULT '',
    steam TEXT DEFAULT '',
    youtube TEXT DEFAULT '',
    role TEXT DEFAULT 'Member',
    createdAt TEXT
);
`);

console.log("Users table ready.");
process.exit(0);
