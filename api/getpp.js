// api/getpp.js
const {
  setCorsHeaders,
  handlePreflight,
  resolveAlias,
  fetchWithRetry,
  sendUpstreamError
} = require('../lib/apiHandler');

const TARGET_BASE_URL = 'http://45.13.226.96:9024/api/getpp';

module.exports = async (req, res) => {
  if (handlePreflight(req, res)) return;
  setCorsHeaders(res);

  try {
    const num = resolveAlias(req.query, 'num', 'number');

    if (!num) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: "num" is required.'
      });
    }

    const upstreamResponse = await fetchWithRetry(TARGET_BASE_URL, { num });
    return res.status(200).json(upstreamResponse.data);

  } catch (error) {
    return sendUpstreamError(res, error);
  }
};
