const express = require('express');
const router = express.Router();
const geminiService = require('../services/gemini');
const { Session, ErrorLog } = require('../database');

// Start a new scoping session
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

router.post('/start-session', async (req, res) => {
    try {
        const sessionId = Date.now().toString();
        const { clientName, description, platforms, targetUsers, projectName, selectedFeatures, budget } = req.body;

        let finalProjectName = projectName;
        if (!finalProjectName && description) {
            finalProjectName = await geminiService.generateProjectName(description);
        }

        // Generate first question based on the rich context
        const initialContext = `
      Project Name: ${finalProjectName}
      Description: ${description}
      Platforms: ${platforms ? platforms.join(', ') : 'Not specified'}
      Target Users: ${targetUsers ? targetUsers.join(', ') : 'Not specified'}
      Budget: ${budget || 'Not specified'}
      Selected Features: ${selectedFeatures ? selectedFeatures.join(', ') : 'Not specified'}
    `;

        // We pass the context as the "Project Idea" essentially to the question generator
        const firstQuestion = await geminiService.generateNextQuestion(initialContext, []);

        const history = [
            { role: 'user', content: initialContext },
            { role: 'model', content: firstQuestion }
        ];

        await Session.create({
            sessionId,
            clientName: clientName || 'Guest',
            projectName: finalProjectName,
            description,
            platforms,
            targetUsers,
            selectedFeatures,
            budget,
            history,
            answers: [],
            report: null
        });

        res.json({ sessionId, question: firstQuestion, projectName: finalProjectName });
    } catch (error) {
        console.error('Error starting session:', error);
        res.status(500).json({ error: 'Failed to start session' });
    }
});

// Generate suggested features
router.post('/suggest-features', async (req, res) => {
    try {
        const { description, platforms, targetUsers } = req.body;
        const features = await geminiService.suggestFeatures(description, platforms, targetUsers);
        res.json({ features });
    } catch (error) {
        console.error('Error suggesting features:', error);
        res.status(500).json({ error: 'Failed to suggest features' });
    }
});

// Generate project name
router.post('/suggest-name', async (req, res) => {
    try {
        const { description } = req.body;
        const name = await geminiService.generateProjectName(description);
        res.json({ name });
    } catch (error) {
        console.error('Error suggesting name:', error);
        res.status(500).json({ error: 'Failed to suggest name' });
    }
});

// Submit answer and get next question
router.post('/answer', async (req, res) => {
    try {
        const { sessionId, answer } = req.body;

        const session = await Session.findOne({ where: { sessionId } });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const newAnswers = [...session.answers, answer];
        const newHistory = [...session.history, { role: 'user', content: answer }];

        // Determine if we have enough info (simple logic: 4 questions max for now)
        if (newAnswers.length >= 4) {
            // Need the original description context for report generation
            const projectContext = `
                Project: ${session.projectName}
                Description: ${session.description}
                Platforms: ${session.platforms ? session.platforms.join(', ') : ''}
                Users: ${session.targetUsers ? session.targetUsers.join(', ') : ''}
                Features: ${session.selectedFeatures ? session.selectedFeatures.join(', ') : ''}
            `;

            const report = await geminiService.generateReport(projectContext, newAnswers);

            await session.update({
                answers: newAnswers,
                history: newHistory,
                report: report
            });

            return res.json({ completed: true, report });
        }

        const nextQuestion = await geminiService.generateNextQuestion(session.description, newHistory);
        newHistory.push({ role: 'model', content: nextQuestion });

        await session.update({
            answers: newAnswers,
            history: newHistory
        });

        res.json({ completed: false, question: nextQuestion });
    } catch (error) {
        console.error('Error processing answer:', error);
        res.status(500).json({ error: 'Failed to process answer' });
    }
});

// Get Report
router.get('/report/:sessionId', async (req, res) => {
    const session = await Session.findOne({ where: { sessionId: req.params.sessionId } });
    if (!session || !session.report) {
        return res.status(404).json({ error: 'Report not ready or session not found' });
    }
    res.json(session.report);
});

// Submit Contact Details and Send Email
router.post('/submit-contact', async (req, res) => {
    try {
        const { sessionId, contact } = req.body;
        const session = await Session.findOne({ where: { sessionId } });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        await session.update({
            contactName: contact.name,
            contactCompany: contact.company,
            contactJobTitle: contact.jobTitle,
            contactEmail: contact.email,
            contactPhone: contact.phone
        });

        // Email Notification
        try {
            const config = require('../../config.json');
            if (config.sendgridApiKey && config.notificationEmail) {
                const sgMail = require('@sendgrid/mail');
                sgMail.setApiKey(config.sendgridApiKey);

                const emailContent = `
                    <h1>New Project Lead Captured</h1>
                    <h2>Contact Details</h2>
                    <p><strong>Name:</strong> ${contact.name}</p>
                    <p><strong>Company:</strong> ${contact.company}</p>
                    <p><strong>Job Title:</strong> ${contact.jobTitle}</p>
                    <p><strong>Email:</strong> ${contact.email}</p>
                    <p><strong>Phone:</strong> ${contact.phone}</p>

                    <hr />

                    <h2>Project Scope</h2>
                    <p><strong>Project Name:</strong> ${session.projectName}</p>
                    <p><strong>Budget:</strong> ${session.budget || 'Not specified'}</p>
                    <p><strong>Platforms:</strong> ${session.platforms ? session.platforms.join(', ') : 'None'}</p>
                    <p><strong>Target Users:</strong> ${session.targetUsers ? session.targetUsers.join(', ') : 'None'}</p>
                    <p><strong>Selected Features:</strong> ${session.selectedFeatures ? session.selectedFeatures.join(', ') : 'None'}</p>
                    
                    <h3>Description</h3>
                    <p>${session.description}</p>

                    <hr />
                    <h3>Generated Report</h3>
                    <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #cc0000;">
                        ${session.report ? session.report.replace(/\n/g, '<br>') : 'No report generated.'}
                    </div>
                `;

                const msg = {
                    to: config.notificationEmail,
                    from: config.senderEmail || 'info@rectanglered.com',
                    subject: `New Lead: ${contact.company} - ${session.projectName}`,
                    html: emailContent,
                };

                await sgMail.send(msg);
                console.log('Notification email sent successfully');
                await ErrorLog.create({
                    level: 'info',
                    message: `New Lead Email Sent: ${contact.email} - ${session.projectName}`,
                    timestamp: new Date()
                });
            } else {
                console.warn('Email config missing, skipping notification.');
            }
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
            // Don't fail the request just because email failed, user data is saved
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error submitting contact:', error);
        res.status(500).json({ error: 'Failed to submit contact details' });
    }
});

// Get All Sessions (Admin) - Restricted Access
router.get('/sessions', async (req, res) => {
    try {
        const allowedIps = ['90.255.245.96', '90.255.245.39', '127.0.0.1', '::1'];
        // IIS/Proxy sets X-Forwarded-For, but app.set('trust proxy', 1) in app.js makes req.ip correct.
        const ip = req.ip || req.connection.remoteAddress;

        // Normalize IPv6 mapped IPv4
        // Normalize IPv6 mapped IPv4
        const normalizedIp = ip.startsWith('::ffff:') ? ip.substring(7) : ip;

        console.log(`[Admin Access] Request from IP: ${normalizedIp} (Raw: ${ip})`);

        // Check if IP is allowed
        if (!allowedIps.includes(normalizedIp) && normalizedIp !== '::1') {
            console.warn(`[Admin Access] BLOCKED: ${normalizedIp}`);
            return res.status(403).json({ error: `Access denied: Unauthorized IP address (${normalizedIp})` });
        }

        const sessions = await Session.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.json(sessions);
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

// Submit Follow-up Message
router.post('/submit-message', async (req, res) => {
    try {
        const { sessionId, message } = req.body;
        const session = await Session.findOne({ where: { sessionId } });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const config = require('../../config.json');
        if (config.sendgridApiKey && config.notificationEmail) {
            const sgMail = require('@sendgrid/mail');
            sgMail.setApiKey(config.sendgridApiKey);

            const emailContent = `
                <h1>New Message from Client</h1>
                <p><strong>Client:</strong> ${session.contactName} (${session.contactCompany})</p>
                <p><strong>Email:</strong> ${session.contactEmail}</p>
                <p><strong>Project:</strong> ${session.projectName}</p>
                <hr />
                <h3>Message:</h3>
                <p style="white-space: pre-wrap;">${message}</p>
            `;

            const msg = {
                to: config.notificationEmail,
                from: config.senderEmail || 'info@rectanglered.com',
                subject: `Follow-up Message: ${session.contactCompany}`,
                html: emailContent,
            };

            await sgMail.send(msg);
            await ErrorLog.create({
                level: 'info',
                message: `Follow-up Message Email Sent: ${session.contactEmail} - ${session.projectName}`,
                timestamp: new Date()
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error sending message:', error);
        await ErrorLog.create({
            level: 'error',
            message: `Failed to send follow-up message: ${error.message}`,
            stack: error.stack
        });
        res.status(500).json({ error: 'Failed to submit message' });
    }
});

// Admin: Test Email
router.post('/admin/test-email', async (req, res) => {
    try {
        const { email } = req.body;
        const config = require('../../config.json');

        if (!config.sendgridApiKey) {
            throw new Error('SendGrid API Key not configured');
        }

        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(config.sendgridApiKey);

        const msg = {
            to: email,
            from: config.senderEmail || 'info@rectanglered.com',
            subject: 'Test Email from AI Scoper Admin',
            text: 'This is a test email to verify your SendGrid configuration is working correctly.',
            html: '<strong>Success!</strong> Your email configuration is working.'
        };

        await sgMail.send(msg);
        await ErrorLog.create({
            level: 'info',
            message: `Admin Test Email Sent: ${email}`,
            timestamp: new Date()
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Test email failed:', error);
        await ErrorLog.create({
            level: 'error',
            message: `Test email failed: ${error.message}`,
            stack: error.stack
        });
        res.status(500).json({ error: error.message });
    }
});

// Admin: Get Errors
router.get('/admin/errors', async (req, res) => {
    try {
        const errors = await ErrorLog.findAll({
            order: [['createdAt', 'DESC']],
            limit: 50
        });
        res.json(errors);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch errors' });
    }
});

module.exports = router;
