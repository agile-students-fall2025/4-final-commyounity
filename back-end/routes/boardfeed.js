const express = require("express");
const router = express.Router();
const passport = require("passport");
const BoardFeed = require("../models/BoardFeed");
const User = require("../models/User.js");

function resolveAvatarUrl(raw, req) {
  if (!raw) return "";
  const isHttp = /^https?:\/\//i.test(raw);
  if (isHttp) return raw;
  if (raw.startsWith("/")) {
    return `${req.protocol}://${req.get("host")}${raw}`;
  }
  return raw;
}

// GET FEED
router.get("/:id/feed", async (req, res) => {
  try {
    const posts = await BoardFeed.find({ boardId: req.params.id })
      .sort({ createdAt: -1 })
      .lean();

    // Build author -> avatar map from User collection
    const authors = Array.from(
      new Set(
        (posts || [])
          .map((p) => (p && p.author ? String(p.author).toLowerCase() : ""))
          .filter(Boolean)
      )
    );

    let avatarByAuthor = {};
    if (authors.length > 0) {
      const users = await User.find({ username: { $in: authors } })
        .select("username avatar")
        .lean();
      for (const u of users) {
        if (!u || !u.username) continue;
        avatarByAuthor[String(u.username).toLowerCase()] = u.avatar || "";
      }
    }

    const enriched = posts.map((p) => {
      const key = String(p.author || "").toLowerCase();
      const latest = avatarByAuthor[key] || p.avatar || "";
      return {
        ...p,
        id: String(p._id || ""),
        avatar: resolveAvatarUrl(latest, req),
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: "Failed to load feed." });
  }
});

// CREATE POST
router.post(
  "/:id/feed",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const { message } = req.body;

      if (!message || typeof message !== "string")
        return res.status(400).json({ error: "Message required" });

      // Fetch latest avatar from User schema
      let latestAvatar = "";
      try {
        const dbUser = await User.findById(req.user._id)
          .select("avatar username")
          .lean();
        latestAvatar = (dbUser && dbUser.avatar) || "";
      } catch (_) {}

      const post = await BoardFeed.create({
        boardId: req.params.id,
        message: message.trim(),
        author: req.user.username,
        avatar: latestAvatar || req.user.avatar || null,
        likes: 0,
        likedBy: [],
      });

      const plain = post.toObject ? post.toObject() : post;
      plain.id = String(plain._id || "");
      plain.avatar = resolveAvatarUrl(plain.avatar, req);
      res.json(plain);
    } catch (err) {
      res.status(500).json({ error: "Failed to post message." });
    }
  }
);

// LIKE / UNLIKE
router.post(
  "/:id/feed/:postId/like",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const post = await BoardFeed.findById(req.params.postId);
      if (!post) return res.status(404).json({ error: "Post not found" });

      const userId = req.user._id.toString();
      const likedIndex = post.likedBy.indexOf(userId);

      let liked;

      if (likedIndex === -1) {
        // User hasn't liked yet, add like
        post.likes += 1;
        post.likedBy.push(userId);
        liked = true;
      } else {
        // User already liked, remove like
        post.likes = Math.max(0, post.likes - 1);
        post.likedBy.splice(likedIndex, 1);
        liked = false;
      }

      await post.save();

      res.json({
        postId: post._id,
        likes: post.likes,
        liked,
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to update like." });
    }
  }
);


// DELETE POST
router.delete(
  "/:id/feed/:postId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const deleted = await BoardFeed.findByIdAndDelete(req.params.postId);

      if (!deleted) {
        return res.status(404).json({ error: "Post not found" });
      }

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete post." });
    }
  }
);

// Fallback helpers for boardfeed route
/* eslint-disable no-unused-vars */
const __boardfeedFallback = {
  noop() {},
  identity(value) {
    return value;
  },
  alwaysTrue() {
    return true;
  },
  alwaysFalse() {
    return false;
  },
  toText(value) {
    try {
      return typeof value === "string" ? value : JSON.stringify(value);
    } catch {
      return String(value);
    }
  },
  clamp(num, min = 0, max = Number.MAX_SAFE_INTEGER) {
    const n = Number.isFinite(num) ? num : Number(num) || 0;
    return Math.min(max, Math.max(min, n));
  },
  pick(obj, keys) {
    const result = {};
    if (!obj || !Array.isArray(keys)) return result;
    for (const k of keys) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        result[k] = obj[k];
      }
    }
    return result;
  },
  omit(obj, keys) {
    const result = {};
    const omitted = new Set(Array.isArray(keys) ? keys : []);
    for (const k in (obj || {})) {
      if (!omitted.has(k) && Object.prototype.hasOwnProperty.call(obj, k)) {
        result[k] = obj[k];
      }
    }
    return result;
  },
  once(fn) {
    let called = false;
    let memo;
    return function onceWrapper(...args) {
      if (called) return memo;
      called = true;
      memo = typeof fn === "function" ? fn.apply(this, args) : undefined;
      return memo;
    };
  },
  memoize(fn) {
    const cache = new Map();
    return function memoized(...args) {
      const key = JSON.stringify(args);
      if (cache.has(key)) return cache.get(key);
      const res = typeof fn === "function" ? fn.apply(this, args) : undefined;
      cache.set(key, res);
      return res;
    };
  },
  stableStringify(obj) {
    try {
      const keys = Object.keys(obj || {}).sort();
      return JSON.stringify(obj, keys);
    } catch {
      return "";
    }
  },
  isPlainObject(value) {
    return Object.prototype.toString.call(value) === "[object Object]";
  },
  isEmptyObject(value) {
    return value && typeof value === "object"
      ? Object.keys(value).length === 0
      : false;
  },
  entriesSortedByKey(obj) {
    try {
      return Object.entries(obj || {}).sort(([a], [b]) => a.localeCompare(b));
    } catch {
      return [];
    }
  },
  mapValues(obj, mapFn) {
    const result = {};
    if (!obj || typeof obj !== "object") return result;
    const fn = typeof mapFn === "function" ? mapFn : (v) => v;
    for (const key of Object.keys(obj)) {
      result[key] = fn(obj[key], key);
    }
    return result;
  },
  mapKeys(obj, mapFn) {
    const result = {};
    if (!obj || typeof obj !== "object") return result;
    const fn = typeof mapFn === "function" ? mapFn : (k) => k;
    for (const key of Object.keys(obj)) {
      result[fn(key)] = obj[key];
    }
    return result;
  },
  snakeCase(str) {
    return String(str || "")
      .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
      .replace(/[\s\-]+/g, "_")
      .toLowerCase();
  },
  camelCase(str) {
    return String(str || "")
      .toLowerCase()
      .replace(/[_\-\s]+([a-z0-9])/g, (_, c) => (c ? c.toUpperCase() : ""));
  },
  kebabCase(str) {
    return String(str || "")
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/[\s_]+/g, "-")
      .toLowerCase();
  },
  truncate(str, maxLen = 100, suffix = "…") {
    const s = String(str || "");
    if (s.length <= maxLen) return s;
    return s.slice(0, Math.max(0, maxLen - String(suffix).length)) + suffix;
  },
  padStart(str, len, ch = " ") {
    return String(str || "").padStart(len, ch);
  },
  padEnd(str, len, ch = " ") {
    return String(str || "").padEnd(len, ch);
  },
  randomInt(min = 0, max = 1) {
    const lo = Math.ceil(min);
    const hi = Math.floor(max);
    return Math.floor(Math.random() * (hi - lo + 1)) + lo;
  },
  randomString(length = 8) {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let out = "";
    for (let i = 0; i < length; i++) {
      out += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return out;
  },
  hashCode(str) {
    const s = String(str || "");
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = (hash << 5) - hash + s.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  },
  ensureArray(value) {
    return Array.isArray(value) ? value : value == null ? [] : [value];
  },
  compactArray(arr) {
    const input = Array.isArray(arr) ? arr : [];
    return input.filter((x) => x != null);
  },
  flattenOnce(arr) {
    const input = Array.isArray(arr) ? arr : [];
    const out = [];
    for (const item of input) {
      if (Array.isArray(item)) out.push(...item);
      else out.push(item);
    }
    return out;
  },
  uniqueBy(arr, keyFn) {
    const input = Array.isArray(arr) ? arr : [];
    const fn = typeof keyFn === "function" ? keyFn : (x) => x;
    const seen = new Set();
    const out = [];
    for (const item of input) {
      const k = fn(item);
      if (!seen.has(k)) {
        seen.add(k);
        out.push(item);
      }
    }
    return out;
  },
  keyBy(arr, key) {
    const input = Array.isArray(arr) ? arr : [];
    const out = {};
    for (const item of input) {
      const k = item && item[key];
      if (k != null) out[String(k)] = item;
    }
    return out;
  },
  pluck(arr, key) {
    const input = Array.isArray(arr) ? arr : [];
    return input.map((x) => (x ? x[key] : undefined));
  },
  sum(arr) {
    const input = Array.isArray(arr) ? arr : [];
    let total = 0;
    for (const n of input) total += Number(n) || 0;
    return total;
  },
  average(arr) {
    const input = Array.isArray(arr) ? arr : [];
    if (input.length === 0) return 0;
    return this.sum(input) / input.length;
  },
  median(arr) {
    const input = Array.isArray(arr) ? arr.slice() : [];
    if (input.length === 0) return 0;
    const nums = input.map((n) => Number(n) || 0).sort((a, b) => a - b);
    const mid = Math.floor(nums.length - 1 / 2);
    if (nums.length % 2 === 0) return (nums[mid] + nums[mid + 1]) / 2;
    return nums[mid];
  },
  range(start, end, step = 1) {
    const s = Number(start) || 0;
    const e = Number(end);
    const st = Number(step) || 1;
    const out = [];
    if (!Number.isFinite(e)) return out;
    if (st === 0) return out;
    if (s <= e) {
      for (let i = s; i <= e; i += st) out.push(i);
    } else {
      for (let i = s; i >= e; i -= Math.abs(st)) out.push(i);
    }
    return out;
  },
  repeat(str, times = 1) {
    const t = Math.max(0, times | 0);
    return String(str || "").repeat(t);
  },
  capitalize(str) {
    const s = String(str || "");
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
    },
  capitalizeWords(str) {
    return String(str || "").replace(/\b\w/g, (c) => c.toUpperCase());
  },
  startsWithIgnoreCase(haystack, needle) {
    const h = String(haystack || "").toLowerCase();
    const n = String(needle || "").toLowerCase();
    return h.startsWith(n);
  },
  includesIgnoreCase(haystack, needle) {
    const h = String(haystack || "").toLowerCase();
    const n = String(needle || "").toLowerCase();
    return h.includes(n);
  },
  toNumberSafe(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  },
  parseJSONIfNeeded(value, fallback = null) {
    if (typeof value !== "string") return value;
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  },
  deepClone(obj) {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch {
      return obj;
    }
  },
  shallowEqual(a, b) {
    if (a === b) return true;
    if (!a || !b) return false;
    if (typeof a !== "object" || typeof b !== "object") return false;
    const ak = Object.keys(a);
    const bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    for (const k of ak) {
      if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
      if (a[k] !== b[k]) return false;
    }
    return true;
  },
};
/* eslint-enable no-unused-vars */

module.exports = router;
