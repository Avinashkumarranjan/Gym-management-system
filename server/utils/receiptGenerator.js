const PDFDocument = require('pdfkit');

/**
 * Generate a clean, branded FitCore Payment Receipt as a PDF buffer/stream
 * @param {Object} payment - Populated Payment document with member and membershipPlan
 * @param {Object} res - Express response object to stream directly to, or returns stream
 */
const generateReceiptPDF = (payment, res) => {
  const doc = new PDFDocument({
    margin: 45,
    size: 'A4',
  });

  // Pipe to response
  doc.pipe(res);

  const memberName = payment.member?.name || 'Valued Member';
  const memberEmail = payment.member?.email || 'N/A';
  const memberPhone = payment.member?.phone || 'N/A';
  const planName = payment.membershipPlan?.name || 'Standard Membership';
  const duration = payment.membershipPlan?.durationMonths
    ? `${payment.membershipPlan.durationMonths} ${payment.membershipPlan.durationMonths === 1 ? 'Month' : 'Months'}`
    : 'N/A';

  const startDateStr = payment.membershipStartDate
    ? new Date(payment.membershipStartDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Immediate';

  const endDateStr = payment.membershipEndDate
    ? new Date(payment.membershipEndDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  const paidDateStr = payment.paidAt
    ? new Date(payment.paidAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('en-IN');

  const amountStr = `INR ${Number(payment.amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  // Primary brand colors
  const primaryOrange = '#ea580c';
  const darkNavy = '#0f172a';
  const slateGray = '#64748b';
  const lightBg = '#f8fafc';
  const borderColor = '#e2e8f0';

  // --- HEADER SECTION ---
  doc.rect(0, 0, doc.page.width, 10).fill(primaryOrange);

  doc.fontSize(24).font('Helvetica-Bold').fillColor(darkNavy).text('FITCORE', 45, 35);
  doc.fontSize(9).font('Helvetica').fillColor(primaryOrange).text('PREMIUM GYM & FITNESS CLUB', 45, 62);

  // Receipt Label & Receipt Number (Right aligned)
  doc.fontSize(16).font('Helvetica-Bold').fillColor(darkNavy).text('PAYMENT RECEIPT', 300, 35, { align: 'right' });
  doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryOrange).text(payment.receiptNumber || 'N/A', 300, 56, { align: 'right' });
  doc.fontSize(8).font('Helvetica').fillColor(slateGray).text(`Date: ${paidDateStr}`, 300, 70, { align: 'right' });

  // Divider
  doc.moveTo(45, 95).lineTo(doc.page.width - 45, 95).strokeColor(borderColor).stroke();

  // --- TWO COLUMN INFO: Member Details & Transaction Details ---
  const infoTop = 110;

  // Member Information (Left Box)
  doc.roundedRect(45, infoTop, 245, 90, 8).fillAndStroke(lightBg, borderColor);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(primaryOrange).text('MEMBER DETAILS', 55, infoTop + 10);
  doc.fontSize(11).font('Helvetica-Bold').fillColor(darkNavy).text(memberName, 55, infoTop + 26);
  doc.fontSize(9).font('Helvetica').fillColor(slateGray).text(`Email: ${memberEmail}`, 55, infoTop + 44);
  doc.fontSize(9).font('Helvetica').fillColor(slateGray).text(`Phone: ${memberPhone}`, 55, infoTop + 58);
  doc.fontSize(8).font('Helvetica-Oblique').fillColor(slateGray).text(`Athlete ID: ${payment.member?._id || 'N/A'}`, 55, infoTop + 72);

  // Transaction Details (Right Box)
  doc.roundedRect(305, infoTop, 245, 90, 8).fillAndStroke(lightBg, borderColor);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(primaryOrange).text('TRANSACTION REFERENCE', 315, infoTop + 10);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(darkNavy).text(payment.transactionReference || 'N/A', 315, infoTop + 26);
  doc.fontSize(9).font('Helvetica').fillColor(slateGray).text(`Payment Method: ${(payment.paymentMethod || 'Online').toUpperCase()}`, 315, infoTop + 44);
  doc.fontSize(9).font('Helvetica').fillColor(slateGray).text(`Payment Gateway: ${(payment.provider || 'Razorpay').toUpperCase()}`, 315, infoTop + 58);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(payment.status === 'paid' ? '#16a34a' : '#dc2626').text(`Status: ${(payment.status || 'PAID').toUpperCase()}`, 315, infoTop + 72);

  // --- SUBSCRIPTION DETAILS TABLE ---
  const tableTop = 220;
  doc.rect(45, tableTop, doc.page.width - 90, 24).fill(darkNavy);
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff').text('MEMBERSHIP PLAN', 55, tableTop + 7);
  doc.text('DURATION', 230, tableTop + 7);
  doc.text('ACTIVE VALIDITY', 320, tableTop + 7);
  doc.text('AMOUNT', doc.page.width - 130, tableTop + 7, { align: 'right', width: 75 });

  // Table Row
  const rowTop = tableTop + 24;
  doc.rect(45, rowTop, doc.page.width - 90, 48).fillAndStroke('#ffffff', borderColor);

  doc.fontSize(10).font('Helvetica-Bold').fillColor(darkNavy).text(planName, 55, rowTop + 12);
  doc.fontSize(8).font('Helvetica').fillColor(slateGray).text(payment.membershipPlan?.description || 'Gym Floor & Facilities Access', 55, rowTop + 26, { width: 165 });

  doc.fontSize(9).font('Helvetica').fillColor(darkNavy).text(duration, 230, rowTop + 16);

  doc.fontSize(9).font('Helvetica-Bold').fillColor(darkNavy).text(`${startDateStr} to`, 320, rowTop + 10);
  doc.fontSize(9).font('Helvetica').fillColor(slateGray).text(endDateStr, 320, rowTop + 24);

  doc.fontSize(11).font('Helvetica-Bold').fillColor(darkNavy).text(amountStr, doc.page.width - 130, rowTop + 16, { align: 'right', width: 75 });

  // --- TOTAL SUMMARY SECTION ---
  const summaryTop = rowTop + 65;
  doc.roundedRect(doc.page.width - 240, summaryTop, 195, 70, 6).fillAndStroke(lightBg, borderColor);

  doc.fontSize(9).font('Helvetica').fillColor(slateGray).text('Subtotal:', doc.page.width - 225, summaryTop + 12);
  doc.fontSize(9).font('Helvetica').fillColor(darkNavy).text(amountStr, doc.page.width - 130, summaryTop + 12, { align: 'right', width: 75 });

  doc.fontSize(9).font('Helvetica').fillColor(slateGray).text('Taxes & Charges:', doc.page.width - 225, summaryTop + 28);
  doc.fontSize(9).font('Helvetica').fillColor(darkNavy).text('INR 0.00', doc.page.width - 130, summaryTop + 28, { align: 'right', width: 75 });

  doc.moveTo(doc.page.width - 225, summaryTop + 44).lineTo(doc.page.width - 55, summaryTop + 44).strokeColor(borderColor).stroke();

  doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryOrange).text('Total Paid:', doc.page.width - 225, summaryTop + 50);
  doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryOrange).text(amountStr, doc.page.width - 130, summaryTop + 50, { align: 'right', width: 75 });

  // --- PLAN BENEFITS / NOTES ---
  const notesTop = summaryTop + 85;
  if (payment.membershipPlan?.benefits && payment.membershipPlan.benefits.length > 0) {
    doc.fontSize(9).font('Helvetica-Bold').fillColor(darkNavy).text('Included Membership Privileges:', 45, notesTop);
    let benefitY = notesTop + 16;
    payment.membershipPlan.benefits.slice(0, 5).forEach((b) => {
      doc.fontSize(8).font('Helvetica').fillColor(slateGray).text(`•  ${b}`, 55, benefitY);
      benefitY += 14;
    });
  }

  // --- FOOTER SECTION ---
  const footerTop = doc.page.height - 100;
  doc.moveTo(45, footerTop).lineTo(doc.page.width - 45, footerTop).strokeColor(borderColor).stroke();

  doc.fontSize(8).font('Helvetica-Bold').fillColor(darkNavy).text('Terms & Conditions:', 45, footerTop + 10);
  doc.fontSize(7).font('Helvetica').fillColor(slateGray).text(
    '1. This document serves as an official FitCore Membership Payment Receipt confirming receipt of funds.\n' +
    '2. Memberships are non-transferable and subject to FitCore facility code of conduct and safety regulations.\n' +
    '3. For renewal questions, gym access queries or technical support, contact the front desk at support@fitcore.com.',
    45,
    footerTop + 22,
    { width: doc.page.width - 90, lineGap: 2 }
  );

  doc.fontSize(7).font('Helvetica').fillColor(slateGray).text(
    'FitCore Gym Management System • Generated automatically upon successful transaction verification.',
    45,
    doc.page.height - 30,
    { align: 'center', width: doc.page.width - 90 }
  );

  doc.end();
};

module.exports = {
  generateReceiptPDF,
};
