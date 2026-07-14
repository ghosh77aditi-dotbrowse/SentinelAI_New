const fs = require("fs");
const csv = require("csv-parser");

const ActivityLog = require("../models/activitylogs.model");
const RiskScore = require("../models/risk.model");

const uploadLogs = async (req, res) => {
    try {

        const results = [];

        fs.createReadStream(req.file.path)
            .pipe(csv())

            .on("data", (data) => {

                results.push({

                    companyId: req.user.companyId,

                    // Logged in admin
                    userId: req.user.id,

                    // Employee being analyzed
                    employeeName: data.employeeName,

                    loginTime: data.loginTime,
                    logoutTime: data.logoutTime,
                    ipAddress: data.ipAddress,
                    country: data.country,
                    filesAccessed: Number(data.filesAccessed),
                    emailsSent: Number(data.emailsSent),
                    databaseQueries: Number(data.databaseQueries),
                    usbUsage: Number(data.usbUsage),
                    vpnUsage: Number(data.vpnUsage),
                    sessionDuration: Number(data.sessionDuration),
                    failedLogins: Number(data.failedLogins),
                    dataTransferred: Number(data.dataTransferred),
                    resourceAccess: data.resourceAccess
                });

            })

            .on("end", async () => {

                try {

                    // Save uploaded logs
                    const insertedLogs = await ActivityLog.insertMany(results);

                    const riskScores = [];

                    for (const log of insertedLogs) {

                        let score = 0;
                        const remarks = [];

                        // Rule 1
                        if (log.failedLogins > 3) {
                            score += 40;
                            remarks.push("Multiple failed logins");
                        }

                        // Rule 2
                        if (log.usbUsage === 1) {
                            score += 30;
                            remarks.push("USB device detected");
                        }

                        // Rule 3
                        if (log.dataTransferred > 500) {
                            score += 30;
                            remarks.push("Large data transfer");
                        }

                        let riskLevel = "LOW";

                        if (score >= 90)
                            riskLevel = "CRITICAL";
                        else if (score >= 70)
                            riskLevel = "HIGH";
                        else if (score >= 40)
                            riskLevel = "MEDIUM";

                        riskScores.push({

                            companyId: log.companyId,

                            // Admin who uploaded the CSV
                            userId: log.userId,

                            // Employee under analysis
                            employeeName: log.employeeName,

                            anomalyScore: score,

                            riskScore: score,

                            riskLevel,

                            prediction:
                                score >= 70 ? "ANOMALY" : "NORMAL",

                            remarks: remarks.join(", ")

                        });

                    }

                    if (riskScores.length > 0) {
                        await RiskScore.insertMany(riskScores);
                    }

                    res.status(201).json({

                        message: "Pipeline completed successfully.",

                        logsUploaded: insertedLogs.length,

                        riskScoresGenerated: riskScores.length

                    });

                } catch (error) {

                    res.status(500).json({
                        message: error.message
                    });

                }

            })

            .on("error", (err) => {

                res.status(500).json({
                    message: `CSV parsing failed: ${err.message}`
                });

            });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

const getLogs = async (req, res) => {

    try {

        const logs = await ActivityLog.find({
            companyId: req.user.companyId
        });

        res.status(200).json(logs);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

module.exports = {
    uploadLogs,
    getLogs
};