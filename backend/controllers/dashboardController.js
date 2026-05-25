const db = require('../config/db');

const getInitials = (name) => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const connection = await db.getConnection();

        // 1. Active Jobs
        const [activeJobsRow] = await connection.execute(
            "SELECT COUNT(*) as count FROM jobs WHERE status = 'Active' AND user_id = ?",
            [userId]
        );
        const activeJobs = activeJobsRow[0].count;

        // 2. Resumes Processed
        const [resumesProcessedRow] = await connection.execute(
            "SELECT COUNT(*) as count FROM screening_results sr JOIN jobs j ON sr.job_id = j.id WHERE j.user_id = ?",
            [userId]
        );
        const resumesProcessed = resumesProcessedRow[0].count;

        // 3. Avg Match Score
        const [avgScoreRow] = await connection.execute(
            "SELECT AVG(sr.score) as avg_score FROM screening_results sr JOIN jobs j ON sr.job_id = j.id WHERE j.user_id = ?",
            [userId]
        );
        const avgMatchScore = avgScoreRow[0].avg_score ? Math.round(avgScoreRow[0].avg_score) : 0;

        // 4. Shortlisted
        const [shortlistedRow] = await connection.execute(
            "SELECT COUNT(*) as count FROM screening_results sr JOIN jobs j ON sr.job_id = j.id WHERE sr.status = 'Shortlisted' AND j.user_id = ?",
            [userId]
        );
        const shortlisted = shortlistedRow[0].count;

        // 5. Recent Activity
        // We select the latest 5 candidate screenings or status updates
        const [activities] = await connection.execute(
            `SELECT 
                sr.processed_at as timestamp, 
                c.full_name as candidate_name, 
                j.title as job_title, 
                sr.score, 
                sr.status 
             FROM screening_results sr 
             JOIN candidates c ON sr.candidate_id = c.id 
             JOIN jobs j ON sr.job_id = j.id 
             WHERE j.user_id = ? 
             ORDER BY sr.processed_at DESC 
             LIMIT 10`,
            [userId]
        );

        // Map to activity formats
        const recentActivity = activities.map(act => {
            let message = '';
            if (act.status === 'Shortlisted') {
                message = `${act.candidate_name} shortlisted for ${act.job_title}`;
            } else if (act.status === 'Rejected') {
                message = `${act.candidate_name} rejected for ${act.job_title}`;
            } else {
                message = `${act.candidate_name} processed for ${act.job_title} with score ${Math.round(act.score)}%`;
            }
            return {
                timestamp: act.timestamp,
                message: message
            };
        });

        // 6. Score Distribution
        const [scoreDistRow] = await connection.execute(
            `SELECT 
                SUM(CASE WHEN sr.score < 70 THEN 1 ELSE 0 END) as under70,
                SUM(CASE WHEN sr.score >= 70 AND sr.score < 80 THEN 1 ELSE 0 END) as between70and79,
                SUM(CASE WHEN sr.score >= 80 AND sr.score < 90 THEN 1 ELSE 0 END) as between80and89,
                SUM(CASE WHEN sr.score >= 90 THEN 1 ELSE 0 END) as above90
             FROM screening_results sr
             JOIN jobs j ON sr.job_id = j.id
             WHERE j.user_id = ?`,
            [userId]
        );

        const scoreDistribution = {
            under70: parseInt(scoreDistRow[0].under70) || 0,
            between70and79: parseInt(scoreDistRow[0].between70and79) || 0,
            between80and89: parseInt(scoreDistRow[0].between80and89) || 0,
            above90: parseInt(scoreDistRow[0].above90) || 0
        };

        // 7. Top Candidates
        const [topCandidates] = await connection.execute(
            `SELECT 
                c.id as candidate_id,
                c.full_name as name,
                c.avatar_url,
                AVG(sr.score) as score,
                GROUP_CONCAT(DISTINCT j.title ORDER BY sr.processed_at DESC SEPARATOR ', ') as jobTitle,
                GROUP_CONCAT(sr.matched_skills SEPARATOR '||') as allMatchedSkills,
                (SELECT sr2.id FROM screening_results sr2 JOIN jobs j2 ON sr2.job_id = j2.id WHERE sr2.candidate_id = c.id AND j2.user_id = ? ORDER BY sr2.score DESC, sr2.processed_at DESC LIMIT 1) as id,
                (SELECT sr3.strength FROM screening_results sr3 JOIN jobs j3 ON sr3.job_id = j3.id WHERE sr3.candidate_id = c.id AND j3.user_id = ? ORDER BY sr3.score DESC, sr3.processed_at DESC LIMIT 1) as strength
             FROM screening_results sr
             JOIN candidates c ON sr.candidate_id = c.id
             JOIN jobs j ON sr.job_id = j.id
             WHERE j.user_id = ?
             GROUP BY c.id
             ORDER BY score DESC
             LIMIT 5`,
            [userId, userId, userId]
        );

        // Process JSON skills column
        const processedTopCandidates = topCandidates.map(cand => {
            const allSkills = new Set();
            if (cand.allMatchedSkills) {
                const parts = cand.allMatchedSkills.split('||');
                parts.forEach(p => {
                    try {
                        const parsed = JSON.parse(p);
                        if (Array.isArray(parsed)) {
                            parsed.forEach(s => allSkills.add(s));
                        }
                    } catch (e) {}
                });
            }
            return {
                ...cand,
                matchedSkills: Array.from(allSkills),
                photoUrl: cand.avatar_url ? `http://localhost:5000/uploads/Candidate-Photos/${cand.avatar_url}` : null,
                avatar: getInitials(cand.name)
            };
        });

        connection.release();

        return res.json({
            success: true,
            data: {
                metrics: {
                    activeJobs,
                    resumesProcessed,
                    avgMatchScore,
                    shortlisted
                },
                recentActivity,
                scoreDistribution,
                topCandidates: processedTopCandidates
            }
        });

    } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
    }
};
