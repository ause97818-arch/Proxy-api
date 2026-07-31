// api/fullpp.js
import axios from "axios";

const TARGET_BASE_URL = "http://45.13.226.96:9024/api/fullpp";
const REQUEST_TIMEOUT_MS = 8000;

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { img, number, num } = req.query;
    const phoneNumber = number || num;

    if (!img) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameter: img",
      });
    }

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameter: number (or num)",
      });
    }

    const targetUrl = `${TARGET_BASE_URL}?img=${encodeURIComponent(img)}&number=${encodeURIComponent(phoneNumber)}`;

    try {
      const remoteResponse = await axios.get(targetUrl, {
        timeout: REQUEST_TIMEOUT_MS,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json, text/plain, */*",
        },
        validateStatus: () => true,
      });

      return res.status(200).json({
        success: true,
        upstreamStatus: remoteResponse.status,
        data: remoteResponse.data,
      });
    } catch (fetchError) {
      // Only hit for actual network-level failures now
      // (validateStatus prevents non-2xx from throwing)
      return res.status(502).json({
        success: false,
        error: "Upstream server unreachable or timed out",
        details: fetchError.message,
      });
    }
  } catch (error) {
    setCorsHeaders(res);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      details: error.message,
    });
  }
}
