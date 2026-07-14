const mongoose = require("mongoose");
const User = require("../models/user.model");
const ActivityLog = require("../models/activitylogs.model");
const RiskScore = require("../models/risk.model");


const getAdminSummary = async (req, res) => {
    try {
        const companyId = new mongoose.Types.ObjectId(req.user.companyId); 

        const totalUsers = await User.countDocuments({
            company: companyId 
        });

        const totalLogs = await ActivityLog.countDocuments({ companyId });

        const totalAnomalies = await RiskScore.countDocuments({ companyId });

        const highRiskUsers = await RiskScore.countDocuments({
            companyId,
            riskLevel: { $in: ["HIGH", "CRITICAL"] }
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeUsersToday = await ActivityLog.distinct(
            "userId",
            {
                companyId,
                createdAt: { $gte: today }
            }
        );

        res.status(200).json({
            totalUsers,
            totalLogs,
            totalAnomalies,
            highRiskUsers,
            activeUsersToday: activeUsersToday.length
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getAdminRecentActivities = async (req, res) => {
    try {
        const logs = await ActivityLog.find({
            companyId: req.user.companyId 
        })
            .sort({ createdAt: -1 })
            .limit(10);

        res.status(200).json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getAdminActivityTrend = async (req, res) => {
    try {
        const trend = await ActivityLog.aggregate([
            { $match: { companyId: req.user.companyId } }, 
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalActivities: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json(trend);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getAdminRiskDistribution = async (req, res) => {
    try {
        const distribution = await RiskScore.aggregate([
            { $match: { companyId: req.user.companyId } }, 
            { $group: { _id: "$riskLevel", count: { $sum: 1 } } }
        ]);

        res.status(200).json(distribution);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getAdminUserStatistics = async (req, res) => {
    try {
        const users = await User.find({
            company: req.user.companyId 
        })
            .select("username useremail role"); 
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getAnalystSummary = async (req, res) => {
    try {
        const companyId = req.user.companyId; // FIXED

        const totalAnomalies = await RiskScore.countDocuments({ companyId });

        const criticalAlerts = await RiskScore.countDocuments({
            companyId,
            riskLevel: "CRITICAL"
        });

        const highRiskUsers = await RiskScore.countDocuments({
            companyId,
            riskLevel: { $in: ["HIGH", "CRITICAL"] }
        });

        res.status(200).json({ totalAnomalies, criticalAlerts, highRiskUsers });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getRecentAlerts = async (req, res) => {
    try {
        const alerts = await RiskScore.find({
            companyId: req.user.companyId // FIXED
        })
            .sort({ createdAt: -1 })
            .limit(10);

        res.status(200).json(alerts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getHighRiskUsers = async (req, res) => {
    try {
        const users = await RiskScore.find({
            companyId: req.user.companyId, // FIXED
            riskLevel: { $in: ["HIGH", "CRITICAL"] }
        });

        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getAnomalyTrend = async (req, res) => {
    try {
        const trend = await RiskScore.aggregate([
            { $match: { companyId: req.user.companyId } }, // FIXED
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    anomalies: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json(trend);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getRiskScores = async (req, res) => {
    try {
        const scores = await RiskScore.find({
            companyId: req.user.companyId // FIXED
        });

        res.status(200).json(scores);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};



const getAnalystDashboard = async (req, res) => {
    try {

        const companyId = req.user.companyId;

        // Summary
        const totalAnomalies = await RiskScore.countDocuments({
            companyId
        });

        const criticalAlerts = await RiskScore.countDocuments({
            companyId,
            riskLevel: "CRITICAL"
        });

        // High Risk Users
        const users = await RiskScore.find({
            companyId,
            riskLevel: { $in: ["HIGH", "CRITICAL"] }
        })
            .select("employeeName riskScore riskLevel userId")
            .sort({ riskScore: -1 })
            .limit(5);

        // Recent Activities
        const recentActivities = await ActivityLog.find({
            companyId
        })
            .sort({ createdAt: -1 })
            .limit(5);

        // Activity Trend
        const activityTrend = await ActivityLog.aggregate([
            { $match: { companyId } },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    },
                    totalActivities: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: {
                    _id: 1
                }
            }
        ]);

        // Risk Distribution
        const riskDistribution = await RiskScore.aggregate([
            { $match: { companyId } },
            {
                $group: {
                    _id: "$riskLevel",
                    count: {
                        $sum: 1
                    }
                }
            }
        ]);

        res.status(200).json({

            summary: {
                totalAnomalies,
                criticalAlerts,
                highRiskUsers: users.length
            },

            users,

            recentActivities,

            activityTrend,

            riskDistribution

        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }
};


const getAdminDashboard = async (req, res) => {
    try {

        const companyId = req.user.companyId;

        // Summary
        const totalUsers = await User.countDocuments({
            company: companyId
        });

        const totalLogs = await ActivityLog.countDocuments({
            companyId
        });

        const totalAnomalies = await RiskScore.countDocuments({
            companyId
        });

        const highRiskUsers = await RiskScore.countDocuments({
            companyId,
            riskLevel: { $in: ["HIGH", "CRITICAL"] }
        });

        

        // Recent Activities
        const recentActivities = await ActivityLog.find({
    companyId
})
.sort({ createdAt: -1 })
.limit(10);
const allRisk = await RiskScore.find({ companyId });

console.log(allRisk);

        // Risk Distribution
const riskDistribution = await RiskScore.aggregate([
    {
         $match: {
        companyId: new mongoose.Types.ObjectId(companyId)
    }
    },
    {
        $group: {
            _id: "$riskLevel",
            count: { $sum: 1 }
        }
    }
]);

// Detection Categories
const detectionCategories = [
    {
        type: "Failed Login",
        count: await ActivityLog.countDocuments({
            companyId,
            failedLogins: { $gt: 3 }
        })
    },
    {
        type: "USB Usage",
        count: await ActivityLog.countDocuments({
            companyId,
            usbUsage: 1
        })
    },
    {
        type: "Large Data Transfer",
        count: await ActivityLog.countDocuments({
            companyId,
            dataTransferred: { $gt: 500 }
        })
    }
];

        

        // Activity Trend
        const allLogs = await ActivityLog.find({ companyId });

console.log(allLogs.length);
        const activityTrend = await ActivityLog.aggregate([
    {
        $match: {
            companyId: new mongoose.Types.ObjectId(companyId)
        }
    },
    {
        $group: {
            _id: {
                $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$createdAt"
                }
            },
            totalActivities: {
                $sum: 1
            }
        }
    },
    {
        $sort: {
            _id: 1
        }
    }
]);

        // Users
        const users = await RiskScore.find({
            companyId
        })
        .select("employeeName riskScore riskLevel userId")
        .sort({ riskScore: -1 })
        .limit(5);


        console.log("Company ID:", companyId);

console.log("Risk Distribution:", riskDistribution);

console.log("Activity Trend:", activityTrend);

console.log("Detection Categories:", detectionCategories);

console.log("Recent Activities:", recentActivities.length);

        res.json({

            summary: {
                totalUsers,
                totalLogs,
                totalAnomalies,
                highRiskUsers
            },

            recentActivities,

            activityTrend,

            riskDistribution,

            detectionCategories,

            users

        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }
};

module.exports = {
    getAdminSummary,
    getAdminRecentActivities,
    getAdminActivityTrend,
    getAdminRiskDistribution,
    getAdminUserStatistics,

    getAnalystSummary,
    getRecentAlerts,
    getHighRiskUsers,
    getAnomalyTrend,
    getRiskScores,
    getAnalystDashboard,

    getAdminDashboard
};

