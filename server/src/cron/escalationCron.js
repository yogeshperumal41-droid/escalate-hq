const cron = require('node-cron');
const Complaint = require('../models/Complaint');
const Brand = require('../models/Brand');
const Branch = require('../models/Branch');
const { sendEscalationAlertEmail } = require('../config/mailer');

/**
 * Worker function to check and auto-escalate complaints older than 48 hours
 */
const runEscalationJob = async () => {
  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    // Find complaints that are still 'Open' and older than 48 hours
    const overdueComplaints = await Complaint.find({
      status: 'Open',
      createdAt: { $lte: fortyEightHoursAgo },
    })
      .populate('brandId')
      .populate('branchId');

    console.log(`[Cron] SLA Sentinel Check: Found ${overdueComplaints.length} overdue open complaints.`);

    let escalatedCount = 0;
    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    for (const complaint of overdueComplaints) {
      complaint.status = 'Escalated';
      complaint.escalatedAt = new Date();

      complaint.timeline.push({
        action: 'Auto-Escalated (48-Hour SLA Breach)',
        actor: 'EscalateHQ SLA Sentinel Cron',
        notes: 'Corporate grievance resolution SLA (48 hours) breached without brand response. Status escalated to public high-alert.',
        timestamp: new Date(),
      });

      await complaint.save();
      escalatedCount++;

      // Dispatch escalation email
      if (complaint.brandId && complaint.branchId) {
        const resolveUrl = `${clientBaseUrl}/complaints/${complaint._id}?token=${complaint.resolveToken}&action=resolve`;
        sendEscalationAlertEmail({
          brand: complaint.brandId,
          branch: complaint.branchId,
          complaint,
          resolveUrl,
        }).catch((e) => console.error(`[Cron Email Error] ${e.message}`));
      }
    }

    console.log(`[Cron] Completed SLA escalation. Updated ${escalatedCount} complaints to 'Escalated'.`);
    return {
      success: true,
      scannedAt: new Date(),
      overdueFound: overdueComplaints.length,
      escalatedCount,
    };
  } catch (error) {
    console.error(`[Cron Error] Escalation job failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Initialize hourly cron job
 */
const initEscalationCron = () => {
  // Runs at minute 0 of every hour: '0 * * * *'
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Running scheduled hourly 48h SLA check...');
    await runEscalationJob();
  });

  console.log('[Cron] SLA auto-escalation cron scheduled (Hourly interval: 0 * * * *)');
};

module.exports = {
  initEscalationCron,
  runEscalationJob,
};
