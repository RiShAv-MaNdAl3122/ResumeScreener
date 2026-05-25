const db = require('../config/db');
const fs = require('fs');
const path = require('path');

const getInitials = (name) => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

exports.listCandidates = async (req, res) => {
    try {
        const userId = req.user.id;
        const { search } = req.query;
        const connection = await db.getConnection();

        let sql = `SELECT 
                sr.id as id,
                c.id as candidate_id,
                c.full_name as name,
                c.email,
                c.avatar_url,
                sr.score,
                sr.semantic_score as semanticScore,
                sr.skill_score as skillScore,
                sr.keyword_bonus as keywordBonus,
                sr.matched_skills as matchedSkills,
                sr.missing_skills as missingSkills,
                sr.strength,
                sr.status,
                j.title as jobTitle,
                j.id as jobId,
                j.department as department,
                res.stored_file_name,
                res.file_name
             FROM candidates c
             JOIN screening_results sr ON sr.candidate_id = c.id
             JOIN jobs j ON sr.job_id = j.id
             LEFT JOIN (
                 SELECT r1.*
                 FROM resumes r1
                 JOIN (
                     SELECT candidate_id, MAX(id) as max_id
                     FROM resumes
                     GROUP BY candidate_id
                 ) r2 ON r1.id = r2.max_id
             ) res ON res.candidate_id = c.id
             WHERE j.user_id = ?`;
        
        const params = [userId];

        if (search && search.trim() !== '') {
            const searchPattern = `%${search.trim()}%`;
            sql += ` AND (LOWER(c.full_name) LIKE LOWER(?) OR LOWER(c.email) LIKE LOWER(?) OR LOWER(j.title) LIKE LOWER(?) OR LOWER(sr.matched_skills) LIKE LOWER(?))`;
            params.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        sql += ` ORDER BY sr.processed_at DESC`;

        const [rows] = await connection.execute(sql, params);

        connection.release();

        const processedRows = rows.map(row => ({
            ...row,
            matchedSkills: typeof row.matchedSkills === 'string' ? JSON.parse(row.matchedSkills) : (row.matchedSkills || []),
            missingSkills: typeof row.missingSkills === 'string' ? JSON.parse(row.missingSkills) : (row.missingSkills || []),
            experience: 'N/A',
            matchType: row.score >= 85 ? 'Exceptional' : (row.score >= 70 ? 'Strong Match' : 'Compatible'),
            photoUrl: row.avatar_url ? `http://localhost:5000/uploads/Candidate-Photos/${row.avatar_url}` : null,
            avatar: getInitials(row.name),
            resumeFile: row.stored_file_name ? {
                stored_file_name: row.stored_file_name,
                file_name: row.file_name
            } : null
        }));

        return res.json({ success: true, data: processedRows });
    } catch (err) {
        console.error('Error listing candidates:', err);
        return res.status(500).json({ success: false, message: 'Failed to list candidates' });
    }
};

exports.getCandidate = async (req, res) => {
    try {
        const { id } = req.params; // This is the screening_id (sr.id)
        const userId = req.user.id;
        const connection = await db.getConnection();

        const [rows] = await connection.execute(
            `SELECT 
                sr.id as id,
                c.id as candidate_id,
                c.full_name as name,
                c.email,
                c.photo_path,
                sr.score,
                sr.semantic_score as semanticScore,
                sr.skill_score as skillScore,
                sr.keyword_bonus as keywordBonus,
                sr.matched_skills as matchedSkills,
                sr.missing_skills as missingSkills,
                sr.strength,
                sr.status,
                sr.similarity,
                sr.skill_match_percentage as skillMatchPercentage,
                sr.explanation,
                j.title as role,
                j.id as jobId
             FROM screening_results sr
             JOIN candidates c ON sr.candidate_id = c.id
             JOIN jobs j ON sr.job_id = j.id
             WHERE sr.id = ? AND j.user_id = ?`,
            [id, userId]
        );

        if (!rows || rows.length === 0) {
            connection.release();
            return res.status(404).json({ success: false, message: 'Candidate screening not found' });
        }

        const candidateData = rows[0];

        // Fetch resume info
        const [resumes] = await connection.execute(
            `SELECT file_name, file_path, original_file_name, stored_file_name FROM resumes WHERE candidate_id = ? ORDER BY id DESC LIMIT 1`,
            [candidateData.candidate_id]
        );
        const resumeFile = resumes && resumes.length > 0 ? resumes[0] : null;

        // Fetch other screenings for this candidate
        const [screenings] = await connection.execute(
            `SELECT sr.id, sr.score, sr.semantic_score as semanticScore, sr.skill_score as skillScore, 
                    sr.keyword_bonus as keywordBonus, sr.matched_skills as matchedSkills, sr.missing_skills as missingSkills, 
                    sr.strength, sr.status, sr.similarity, sr.skill_match_percentage as skillMatchPercentage, 
                    sr.explanation, j.title as jobTitle 
             FROM screening_results sr 
             JOIN jobs j ON sr.job_id = j.id 
             WHERE sr.candidate_id = ? AND j.user_id = ?`,
            [candidateData.candidate_id, userId]
        );

        connection.release();

        const matched = typeof candidateData.matchedSkills === 'string' ? JSON.parse(candidateData.matchedSkills) : (candidateData.matchedSkills || []);
        const missing = typeof candidateData.missingSkills === 'string' ? JSON.parse(candidateData.missingSkills) : (candidateData.missingSkills || []);
        const expl = typeof candidateData.explanation === 'string' ? JSON.parse(candidateData.explanation) : (candidateData.explanation || []);

        const mappedScreenings = screenings.map(scr => ({
            id: scr.id,
            jobTitle: scr.jobTitle,
            score: scr.score,
            badgeLabel: scr.score >= 85 ? 'Exceptional Match' : (scr.score >= 70 ? 'Strong Match' : 'Compatible'),
            semanticScore: scr.semanticScore,
            skillScore: scr.skillScore,
            keywordBonus: scr.keywordBonus,
            similarity: scr.similarity,
            skillMatchPercentage: scr.skillMatchPercentage,
            matchedSkills: typeof scr.matchedSkills === 'string' ? JSON.parse(scr.matchedSkills) : (scr.matchedSkills || []),
            missingSkills: typeof scr.missingSkills === 'string' ? JSON.parse(scr.missingSkills) : (scr.missingSkills || []),
        }));

        const mappedCandidate = {
            id: candidateData.id,
            candidate_id: candidateData.candidate_id,
            name: candidateData.name,
            title: 'Professional Candidate',
            role: candidateData.role,
            email: candidateData.email || 'n/a',
            phone: 'n/a',
            location: 'San Francisco, CA',
            github: 'github.com/candidate',
            experience: 'N/A',
            status: candidateData.status,
            score: candidateData.score,
            semanticScore: candidateData.semanticScore,
            skillScore: candidateData.skillScore,
            keywordBonus: candidateData.keywordBonus,
            similarity: candidateData.similarity,
            skillMatchPercentage: candidateData.skillMatchPercentage,
            explanation: expl,
            matchedSkills: matched,
            missingSkills: missing,
            recruiterNote: `Matched ${matched.length} requirements. Lacks direct ${missing.slice(0, 2).join(', ') || 'none'} experience, but demonstrates strong adjacent credentials.`,
            experienceTimeline: [
                { role: candidateData.role, company: 'Previous Corp', period: '2022 — Present', duration: '2 yrs', description: `Served in role requiring ${matched.slice(0, 3).join(', ')}.` }
            ],
            recommendation: candidateData.score >= 85
                ? 'Strong Candidate: Proceed to Technical Interview Round 1.'
                : (candidateData.score >= 70 ? 'Good Candidate: Recommend for further evaluation.' : 'Moderate Fit: May require domain training.'),
            confidence: Math.round(candidateData.score * 0.98),
            badgeLabel: candidateData.score >= 85 ? 'Top 2% Talent' : (candidateData.score >= 70 ? 'Top 10% Talent' : 'Unranked'),
            photoUrl: candidateData.avatar_url ? `http://localhost:5000/uploads/Candidate-Photos/${candidateData.avatar_url}` : null,
            avatar: getInitials(candidateData.name),
            resumeFile: resumeFile,
            screenings: mappedScreenings,
            emailHistory: []
        };

        return res.json({ success: true, data: mappedCandidate });
    } catch (err) {
        console.error('Error fetching candidate details:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch candidate details' });
    }
};

exports.updateCandidateStatus = async (req, res) => {
    try {
        const { id } = req.params; // This is the screening_id (sr.id)
        const { status } = req.body;
        const userId = req.user.id;

        if (!status) return res.status(400).json({ success: false, message: 'Status is required' });

        const connection = await db.getConnection();

        // Verify ownership first
        const [rows] = await connection.execute(
            `SELECT sr.id FROM screening_results sr
             JOIN jobs j ON sr.job_id = j.id
             WHERE sr.id = ? AND j.user_id = ?`,
            [id, userId]
        );

        if (!rows || rows.length === 0) {
            connection.release();
            return res.status(404).json({ success: false, message: 'Candidate screening not found or access denied' });
        }

        await connection.execute(
            `UPDATE screening_results SET status = ? WHERE id = ?`,
            [status, id]
        );

        connection.release();
        return res.json({ success: true, message: 'Status updated successfully' });
    } catch (err) {
        console.error('Error updating candidate status:', err);
        return res.status(500).json({ success: false, message: 'Failed to update candidate status' });
    }
};

exports.deleteCandidate = async (req, res) => {
    try {
        const { candidateId } = req.params;
        const userId = req.user.id;
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // 1. Verify candidate has screenings belonging to the user
            const [screenings] = await connection.execute(
                `SELECT sr.id, sr.job_id, c.avatar_url, r.file_path
                 FROM screening_results sr
                 JOIN jobs j ON sr.job_id = j.id
                 JOIN candidates c ON sr.candidate_id = c.id
                 LEFT JOIN resumes r ON r.candidate_id = c.id
                 WHERE sr.candidate_id = ? AND j.user_id = ?`,
                [candidateId, userId]
            );

            if (!screenings || screenings.length === 0) {
                // Check if candidate exists without screenings
                const [candRows] = await connection.execute(
                    'SELECT avatar_url FROM candidates WHERE id = ?',
                    [candidateId]
                );
                if (candRows.length === 0) {
                    connection.release();
                    return res.status(404).json({ success: false, message: 'Candidate not found' });
                }
            }

            // 2. Delete actual files from disk
            const avatarUrl = screenings?.[0]?.avatar_url || (candRows && candRows[0]?.avatar_url);
            if (avatarUrl) {
                const fullPhotoPath = path.join(__dirname, '../uploads/Candidate-Photos', avatarUrl);
                if (fs.existsSync(fullPhotoPath)) {
                    fs.unlinkSync(fullPhotoPath);
                }
            }

            const [resumes] = await connection.execute(
                'SELECT file_path FROM resumes WHERE candidate_id = ?',
                [candidateId]
            );
            for (const resume of resumes) {
                if (resume.file_path) {
                    if (fs.existsSync(resume.file_path)) {
                        fs.unlinkSync(resume.file_path);
                    } else {
                        const relPath = path.join(__dirname, '..', resume.file_path);
                        if (fs.existsSync(relPath)) {
                            fs.unlinkSync(relPath);
                        }
                    }
                }
            }

            // 3. Delete database records
            await connection.execute(
                'DELETE sr FROM screening_results sr JOIN jobs j ON sr.job_id = j.id WHERE sr.candidate_id = ? AND j.user_id = ?',
                [candidateId, userId]
            );

            await connection.execute(
                'DELETE FROM resumes WHERE candidate_id = ?',
                [candidateId]
            );

            await connection.execute(
                'DELETE FROM candidates WHERE id = ?',
                [candidateId]
            );

            await connection.commit();
            return res.json({ success: true, message: 'Candidate and all associated data deleted successfully' });
        } catch (txErr) {
            await connection.rollback();
            throw txErr;
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error('Error deleting candidate:', err);
        return res.status(500).json({ success: false, message: 'Failed to delete candidate' });
    }
};

exports.deleteScreeningResult = async (req, res) => {
    try {
        const { screeningId } = req.params;
        const userId = req.user.id;
        const connection = await db.getConnection();

        const [rows] = await connection.execute(
            `SELECT sr.id, sr.candidate_id, c.avatar_url, r.file_path
             FROM screening_results sr
             JOIN jobs j ON sr.job_id = j.id
             JOIN candidates c ON sr.candidate_id = c.id
             LEFT JOIN resumes r ON r.candidate_id = c.id
             WHERE sr.id = ? AND j.user_id = ?`,
            [screeningId, userId]
        );

        if (!rows || rows.length === 0) {
            connection.release();
            return res.status(404).json({ success: false, message: 'Screening result not found or access denied' });
        }

        const screening = rows[0];
        const candidateId = screening.candidate_id;

        try {
            await connection.beginTransaction();

            // Delete the screening result record
            await connection.execute(
                'DELETE FROM screening_results WHERE id = ?',
                [screeningId]
            );

            // If last screening result, clean up candidate
            const [otherScreenings] = await connection.execute(
                'SELECT id FROM screening_results WHERE candidate_id = ?',
                [candidateId]
            );

            if (!otherScreenings || otherScreenings.length === 0) {
                if (screening.avatar_url) {
                    const fullPhotoPath = path.join(__dirname, '../uploads/Candidate-Photos', screening.avatar_url);
                    if (fs.existsSync(fullPhotoPath)) fs.unlinkSync(fullPhotoPath);
                }
                if (screening.file_path) {
                    if (fs.existsSync(screening.file_path)) {
                        fs.unlinkSync(screening.file_path);
                    } else {
                        const relPath = path.join(__dirname, '..', screening.file_path);
                        if (fs.existsSync(relPath)) fs.unlinkSync(relPath);
                    }
                }

                await connection.execute(
                    'DELETE FROM resumes WHERE candidate_id = ?',
                    [candidateId]
                );

                await connection.execute(
                    'DELETE FROM candidates WHERE id = ?',
                    [candidateId]
                );
            }

            await connection.commit();
            return res.json({ success: true, message: 'Screening result removed successfully' });
        } catch (txErr) {
            await connection.rollback();
            throw txErr;
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error('Error removing screening result:', err);
        return res.status(500).json({ success: false, message: 'Failed to remove screening result' });
    }
};


