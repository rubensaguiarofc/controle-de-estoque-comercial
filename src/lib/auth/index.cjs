const { join } = require('path');
// Low and JSONFile: JSONFile constructor for Node environment comes from 'lowdb/node'
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const dataDir = join(process.cwd(), './data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const dbFile = join(dataDir, 'users.json');
const adapter = new JSONFile(dbFile);
// lowdb v7 Low expects default data as second argument in Node builds
const db = new Low(adapter, { users: [] });

async function ensureDb() {
  await db.read();
  db.data = db.data || { users: [] };
  await db.write();
}

async function createUser(email, password, name) {
  await ensureDb();
  const exists = (db.data.users).find((u) => u.email === email.toLowerCase());
  if (exists) throw new Error('User already exists');
  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: Date.now().toString(36), email: email.toLowerCase(), passwordHash, name };
  db.data.users.push(user);
  await db.write();
  return { id: user.id, email: user.email, name: user.name };
}

async function verifyUser(email, password) {
  await ensureDb();
  const user = (db.data.users).find((u) => u.email === email.toLowerCase());
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return { id: user.id, email: user.email, name: user.name };
}

const jwtSecret = process.env.AUTH_JWT_SECRET || 'dev-secret';

function signJwt(payload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
}

function verifyJwt(token) {
  try {
    return jwt.verify(token, jwtSecret);
  } catch (e) {
    return null;
  }
}

async function getUserById(id) {
  await ensureDb();
  const user = (db.data.users).find((u) => u.id === id);
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name };
}

module.exports = { createUser, verifyUser, signJwt, verifyJwt, getUserById };
