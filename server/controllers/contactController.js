const ContactInquiry = require('../models/ContactInquiry');

// @desc    Submit a contact inquiry (Public)
// @route   POST /api/contact
// @access  Public
const submitContactInquiry = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, subject, and message are required fields.',
      });
    }

    // Basic sanitization
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone ? phone.trim() : '';
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    const ipAddress =
      req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || '';

    const inquiry = await ContactInquiry.create({
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      subject: trimmedSubject,
      message: trimmedMessage,
      ipAddress,
    });

    return res.status(201).json({
      success: true,
      message: 'Thanks for contacting FitCore. We’ll get back to you soon.',
      inquiryId: inquiry._id,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all contact inquiries (Admin)
// @route   GET /api/admin/contact-inquiries
// @access  Private (Admin)
const getContactInquiries = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const { status, search, startDate, endDate } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
        { subject: { $regex: term, $options: 'i' } },
        { phone: { $regex: term, $options: 'i' } },
      ];
    }

    const [inquiries, total] = await Promise.all([
      ContactInquiry.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ContactInquiry.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: inquiries,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single contact inquiry (Admin)
// @route   GET /api/admin/contact-inquiries/:id
// @access  Private (Admin)
const getContactInquiryById = async (req, res, next) => {
  try {
    const inquiry = await ContactInquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Contact inquiry not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: inquiry,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update contact inquiry status (Admin)
// @route   PATCH /api/admin/contact-inquiries/:id/status
// @access  Private (Admin)
const updateInquiryStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['new', 'in_progress', 'resolved'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value. Allowed: new, in_progress, resolved.',
      });
    }

    const inquiry = await ContactInquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Contact inquiry not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Inquiry status updated to "${status}".`,
      data: inquiry,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update admin notes for inquiry (Admin)
// @route   PATCH /api/admin/contact-inquiries/:id/notes
// @access  Private (Admin)
const updateInquiryNotes = async (req, res, next) => {
  try {
    const { adminNotes } = req.body;

    const inquiry = await ContactInquiry.findByIdAndUpdate(
      req.params.id,
      { adminNotes: adminNotes ? adminNotes.trim() : '' },
      { new: true }
    );

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Contact inquiry not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Admin notes updated successfully.',
      data: inquiry,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitContactInquiry,
  getContactInquiries,
  getContactInquiryById,
  updateInquiryStatus,
  updateInquiryNotes,
};
