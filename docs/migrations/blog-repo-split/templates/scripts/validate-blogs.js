#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const filePath = process.argv[2] || path.join(process.cwd(), "data", "blogs.json");
const raw = fs.readFileSync(filePath, "utf8");
const data = JSON.parse(raw);

if (!Array.isArray(data)) {
  throw new Error("blogs.json must be an array");
}

const required = ["id", "title", "url", "summary", "tags", "updated_at", "status"];

for (const [index, blog] of data.entries()) {
  for (const key of required) {
    if (!(key in blog)) {
      throw new Error(`blogs.json entry ${index} is missing ${key}`);
    }
  }
  if (!Array.isArray(blog.tags)) {
    throw new Error(`blogs.json entry ${index} has invalid tags`);
  }
}

console.log("blogs.json looks valid.");
