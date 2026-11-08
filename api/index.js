/**
 * Vercel serverless entry — re-exports the Express app built to server/dist.
 * Locally keep using `npm run dev:server` (app.listen). Do not call listen here.
 */
module.exports = require("../server/dist/app").default;
