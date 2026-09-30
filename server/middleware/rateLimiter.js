const rateLimit = require('express-rate-limit');

// Rate limiter for public contact submissions: 5 requests per 15 minutes per IP
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many contact inquiries from this IP, please try again after 15 minutes.',
  },
});

module.exports = {
  contactLimiter,
};
