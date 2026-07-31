import axios from "axios";

const TARGET_BASE_URL = "http://45.13.226.96:9024/api/getpp";
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
    const { num, number } = req.query;
    const phoneNumber = num || number;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameter: num (or number)",
      });
    }

    const targetUrl = `${TARGET_BASE_URL}?num=${encodeURIComponent(phoneNumber)}`;

    try {
      const remoteResponse = await axios.get(targetUrl, {
        timeout: REQUEST_TIMEOUT_MS,
      });

      return res.status(200).json(remoteResponse.data);
    } catch (fetchError) {
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
