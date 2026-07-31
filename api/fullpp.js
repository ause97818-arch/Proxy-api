// api/fullpp.js
const {
  setCorsHeaders,
  handlePreflight,
  resolveAlias,
  fetchWithRetry,
  sendUpstreamError
} = require('../lib/apiHandler');

const TARGET_BASE_URL = 'http://45.13.226.96:9024/api/fullpp';

module.exports = async (req, res) => {
  if (handlePreflight(req, res)) return;
  setCorsHeaders(res);

  try {
    const img = resolveAlias(req.query, 'img');
    const number = resolveAlias(req.query, 'num', 'number');

    if (!img || !number) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter(s). Both "img" and "num" (or "number") are required.'
      });
    }

    const upstreamResponse = await fetchWithRetry(TARGET_BASE_URL, { img, number });
    return res.status(200).json(upstreamResponse.data);

  } catch (error) {
    return sendUpstreamError(res, error);
  }
};
