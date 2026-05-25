const db = require('../config/db');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

exports.listJobs = async (req, res) => {
    try {
        const userId = req.user.id;
        const connection = await db.getConnection();

        // Retrieve jobs along with candidate counts and average match score
        const [rows] = await connection.execute(
            `SELECT 
                j.id, 
                j.user_id, 
                j.title, 
                j.description, 
                j.department,
                j.status,
                j.created_at, 
                j.version, 
                j.last_modified_by, 
                j.last_modified_at,
                COUNT(sr.id) as candidates,
                IFNULL(ROUND(AVG(sr.score)), 0) as avgScoreRaw
             FROM jobs j
             LEFT JOIN screening_results sr ON sr.job_id = j.id
             WHERE j.user_id = ?
             GROUP BY j.id
             ORDER BY j.created_at DESC`,
            [userId]
        );

        connection.release();

        const formattedJobs = rows.map(job => ({
            id: job.id,
            user_id: job.user_id,
            title: job.title,
            description: job.description,
            department: job.department || 'Engineering',
            status: job.status || 'Active',
            created_at: job.created_at,
            version: job.version,
            candidates: job.candidates || 0,
            avgScore: job.candidates > 0 ? `${job.avgScoreRaw}%` : '--',
            createdAt: new Date(job.created_at),
            updatedAt: job.last_modified_at ? new Date(job.last_modified_at) : new Date(job.created_at)
        }));

        return res.json({ success: true, data: formattedJobs });
    } catch (err) {
        console.error('Error listing jobs:', err);
        return res.status(500).json({ success: false, message: 'Failed to list jobs' });
    }
};

exports.getJob = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const connection = await db.getConnection();

        const [rows] = await connection.execute(
            `SELECT id, user_id, title, description, department, status, created_at, version, last_modified_by, last_modified_at 
             FROM jobs WHERE id = ? AND user_id = ?`,
            [id, userId]
        );
        connection.release();

        if (!rows || rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        const job = rows[0];
        const formattedJob = {
            id: job.id,
            user_id: job.user_id,
            title: job.title,
            description: job.description,
            department: job.department || 'Engineering',
            status: job.status || 'Active',
            created_at: job.created_at,
            version: job.version,
            createdAt: new Date(job.created_at),
            updatedAt: job.last_modified_at ? new Date(job.last_modified_at) : new Date(job.created_at)
        };

        return res.json({ success: true, data: formattedJob });
    } catch (err) {
        console.error('Error fetching job:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch job' });
    }
};

exports.createJob = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, description, department, status } = req.body;
        if (!title || !description) return res.status(400).json({ success: false, message: 'Missing required fields' });

        const jobDept = department || 'Engineering';
        const jobStatus = status || 'Active';

        const connection = await db.getConnection();
        const [result] = await connection.execute(
            `INSERT INTO jobs (user_id, title, description, department, status, created_at, version, last_modified_by, last_modified_at) 
             VALUES (?, ?, ?, ?, ?, NOW(), 1, ?, NOW())`,
            [userId, title, description, jobDept, jobStatus, userId]
        );
        const insertedId = result.insertId;
        connection.release();

        const [newJobRows] = await db.execute(
            `SELECT id, user_id, title, description, department, status, created_at, version, last_modified_by, last_modified_at 
             FROM jobs WHERE id = ?`,
            [insertedId]
        );

        const job = newJobRows[0];
        const formattedJob = {
            id: job.id,
            user_id: job.user_id,
            title: job.title,
            description: job.description,
            department: job.department || 'Engineering',
            status: job.status || 'Active',
            created_at: job.created_at,
            version: job.version,
            createdAt: new Date(job.created_at),
            updatedAt: job.last_modified_at ? new Date(job.last_modified_at) : new Date(job.created_at)
        };

        return res.status(201).json({ success: true, data: formattedJob });
    } catch (err) {
        console.error('Error creating job:', err);
        return res.status(500).json({ success: false, message: 'Failed to create job' });
    }
};

exports.updateJob = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { title, description, department, status } = req.body;

        const connection = await db.getConnection();
        await connection.beginTransaction();

        // Verify ownership first
        const [rows] = await connection.execute('SELECT id, title, description, department, status, version FROM jobs WHERE id = ? AND user_id = ?', [id, userId]);
        if (!rows || rows.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ success: false, message: 'Job not found or access denied' });
        }
        const job = rows[0];

        // Update fields
        const newTitle = title || job.title;
        const newDescription = (typeof description === 'string') ? description : job.description;
        const newDept = department || job.department || 'Engineering';
        const newStatus = status || job.status || 'Active';
        let newVersion = job.version || 1;

        let descriptionChanged = (newDescription.trim() !== (job.description || '').trim());

        if (descriptionChanged) {
            newVersion = newVersion + 1;
        }

        await connection.execute(
            'UPDATE jobs SET title = ?, description = ?, department = ?, status = ?, version = ?, last_modified_by = ?, last_modified_at = NOW() WHERE id = ?',
            [newTitle, newDescription, newDept, newStatus, newVersion, userId, id]
        );

        // If description changed: mark old screenings requires_rescreening = 1 where job_version < newVersion
        let affectedCandidates = 0;
        if (descriptionChanged) {
            await connection.execute(
                'UPDATE screening_results SET requires_rescreening = 1 WHERE job_id = ? AND job_version < ?',
                [id, newVersion]
            );
            
            const [countRows] = await connection.execute(
                'SELECT COUNT(DISTINCT candidate_id) AS cnt FROM screening_results WHERE job_id = ? AND job_version < ?',
                [id, newVersion]
            );
            affectedCandidates = countRows[0]?.cnt || 0;
        }

        await connection.commit();
        connection.release();

        const [updatedRows] = await db.execute(
            `SELECT id, user_id, title, description, department, status, created_at, version, last_modified_by, last_modified_at 
             FROM jobs WHERE id = ?`,
            [id]
        );

        const updatedJob = updatedRows[0];
        const formattedJob = {
            id: updatedJob.id,
            user_id: updatedJob.user_id,
            title: updatedJob.title,
            description: updatedJob.description,
            department: updatedJob.department || 'Engineering',
            status: updatedJob.status || 'Active',
            created_at: updatedJob.created_at,
            version: updatedJob.version,
            createdAt: new Date(updatedJob.created_at),
            updatedAt: updatedJob.last_modified_at ? new Date(updatedJob.last_modified_at) : new Date(updatedJob.created_at)
        };

        return res.json({ success: true, data: formattedJob });
    } catch (err) {
        console.error('Error updating job:', err);
        return res.status(500).json({ success: false, message: 'Failed to update job' });
    }
};

exports.deleteJob = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const connection = await db.getConnection();
        
        // Verify ownership
        const [rows] = await connection.execute('SELECT id FROM jobs WHERE id = ? AND user_id = ?', [id, userId]);
        if (!rows || rows.length === 0) {
            connection.release();
            return res.status(404).json({ success: false, message: 'Job not found or access denied' });
        }

        await connection.execute('DELETE FROM jobs WHERE id = ?', [id]);
        connection.release();
        return res.json({ success: true, message: 'Job deleted' });
    } catch (err) {
        console.error('Error deleting job:', err);
        return res.status(500).json({ success: false, message: 'Failed to delete job' });
    }
};

exports.rescreenJobCandidates = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const connection = await db.getConnection();
        
        // 1. Verify job ownership and get current description and version
        const [jobs] = await connection.execute(
            'SELECT id, description, version, title FROM jobs WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        
        if (!jobs || jobs.length === 0) {
            connection.release();
            return res.status(404).json({ success: false, message: 'Job not found or access denied' });
        }
        
        const job = jobs[0];
        
        // 2. Fetch all candidates and their resumes screened for this job
        const [candidatesToRescreen] = await connection.execute(
            `SELECT sr.id as screening_id, sr.candidate_id, r.file_path, r.file_name, r.stored_file_name, c.full_name as candidate_name
             FROM screening_results sr
             JOIN resumes r ON sr.candidate_id = r.candidate_id
             JOIN candidates c ON sr.candidate_id = c.id
             WHERE sr.job_id = ?`,
            [id]
        );
        
        connection.release();
        
        if (candidatesToRescreen.length === 0) {
            return res.json({ success: true, message: 'No candidates to rescreen.', rescreenedCount: 0 });
        }
        
        console.log(`Re-screening ${candidatesToRescreen.length} candidates for job: ${job.title}`);
        
        const pythonApiUrl = process.env.PYTHON_API || 'http://127.0.0.1:8000/analyze';
        
        // 3. For each candidate, call the FastAPI analyzer and update their screening score
        let rescreenedCount = 0;
        for (const candidate of candidatesToRescreen) {
            let fullPath = candidate.file_path;
            
            // Check if file path is absolute, if not make it absolute relative to backend root
            if (!path.isAbsolute(fullPath)) {
                fullPath = path.join(__dirname, '..', fullPath);
            }
            
            if (!fs.existsSync(fullPath)) {
                console.warn(`File not found for candidate ${candidate.candidate_name}: ${fullPath}`);
                continue;
            }
            
            try {
                // Call Python AI
                const form = new FormData();
                form.append('resume', fs.createReadStream(fullPath));
                form.append('jd', job.description || '');
                
                const response = await axios.post(pythonApiUrl, form, { headers: form.getHeaders() });
                const aiResponse = response.data;
                
                const score = aiResponse.score || 0;
                const semanticScore = aiResponse.score_breakdown?.semantic_score || 0;
                const skillScore = aiResponse.score_breakdown?.skill_score || 0;
                const keywordBonus = aiResponse.score_breakdown?.keyword_bonus || 0;
                const resumeStrength = aiResponse.resume_strength || 'Unknown';
                const similarity = aiResponse.similarity || 0;
                const skillMatchPercentage = aiResponse.skill_match_percentage || 0;
                const explanation = aiResponse.explanation || [];
                
                // Update screening result in DB
                const conn = await db.getConnection();
                await conn.execute(
                    `UPDATE screening_results SET
                        score = ?,
                        semantic_score = ?,
                        skill_score = ?,
                        keyword_bonus = ?,
                        matched_skills = ?,
                        missing_skills = ?,
                        strength = ?,
                        similarity = ?,
                        skill_match_percentage = ?,
                        explanation = ?,
                        processed_at = NOW(),
                        job_version = ?,
                        requires_rescreening = 0
                     WHERE id = ?`,
                    [
                        score,
                        semanticScore,
                        skillScore,
                        keywordBonus,
                        JSON.stringify(aiResponse.matched_skills || []),
                        JSON.stringify(aiResponse.missing_skills || []),
                        resumeStrength,
                        similarity,
                        skillMatchPercentage,
                        JSON.stringify(explanation),
                        job.version,
                        candidate.screening_id
                    ]
                );
                conn.release();
                rescreenedCount++;
            } catch (err) {
                console.error(`Failed to rescreen candidate ${candidate.candidate_name}:`, err.message);
            }
        }
        
        return res.json({
            success: true,
            message: `Successfully re-screened ${rescreenedCount} candidate(s).`,
            rescreenedCount
        });
    } catch (err) {
        console.error('Error in rescreenJobCandidates:', err);
        return res.status(500).json({ success: false, message: 'Failed to rescreen candidates' });
    }
};
