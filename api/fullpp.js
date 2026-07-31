import axios from "axios";

const TARGET_BASE_URL = "http://45.13.226.96:9024/api/fullpp";
const REQUEST_TIMEOUT_MS = 8000;

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req, res) {
  // Always attach CORS headers first, before anything else can fail
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
      });

      return res.status(200).json(remoteResponse.data);
    } catch (fetchError) {
      // Handles ECONNREFUSED, ECONNABORTED (timeout), DNS errors,
      // and non-2xx responses from the upstream server
      return res.status(502).json({
        success: false,
        error: "Upstream server unreachable or timed out",
        details: fetchError.message,
      });
    }
  } catch (error) {
    // Final safety net — catches any unexpected synchronous error
    setCorsHeaders(res);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      details: error.message,
    });
  }
}
