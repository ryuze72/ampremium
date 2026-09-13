const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const BASE = "https://react.zfile.web.id";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function generateSessionId() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let sid = "zx_";

  for (let i = 0; i < 16; i++) {
    sid += chars[Math.floor(Math.random() * chars.length)];
  }

  return sid;
}

// =========================
// API: REACT
// =========================
app.post("/api/send-react", async (req, res) => {
  try {
    const { url, reactions } = req.body;

    if (!url) {
      return res.status(400).json({
        status: false,
        message: "URL WhatsApp wajib diisi"
      });
    }

    if (!Array.isArray(reactions) || reactions.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Pilih minimal 1 reaction"
      });
    }

    const SID = generateSessionId();

    // =========================
    // GET CHALLENGE
    // =========================
    const challengeResponse = await fetch(`${BASE}/api/challenge`, {
      method: "GET",
      headers: {
        "User-Agent": UA,
        "Accept": "application/json",
        "Origin": BASE,
        "Referer": `${BASE}/`,
        "X-Session-Id": SID
      }
    });

    const challengeText = await challengeResponse.text();

    let challenge;

    try {
      challenge = JSON.parse(challengeText);
    } catch {
      return res.status(502).json({
        status: false,
        message: "Response challenge bukan JSON",
        raw: challengeText
      });
    }

    const ticket = challenge.ticket;

    if (!ticket) {
      return res.status(400).json({
        status: false,
        message: "Ticket tidak ditemukan",
        challenge
      });
    }

    // =========================
    // POST REACTION
    // =========================
    const reactResponse = await fetch(`${BASE}/api/react`, {
      method: "POST",
      headers: {
        "User-Agent": UA,
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Origin": BASE,
        "Referer": `${BASE}/`,
        "X-ZX-Request": "zx-reactch",
        "X-Session-Id": SID
      },
      body: JSON.stringify({
        url,
        reactions,
        ticket
      })
    });

    const resultText = await reactResponse.text();

    let result;

    try {
      result = JSON.parse(resultText);
    } catch {
      result = {
        raw: resultText
      };
    }

    return res.status(reactResponse.status).json({
      status: reactResponse.ok,
      session: SID,
      result
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: false,
      message: error.message
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Web berjalan di http://localhost:${PORT}`);
});
