const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

const candidatePhotosDir = path.join(__dirname, '../uploads/Candidate-Photos');

// ---------------------------------------------------------------------------
// Helper: save base64 photo to disk, return relative path or null
// ---------------------------------------------------------------------------
function savePhoto(base64String) {
    if (!base64String) return null;
    try {
        const buffer = Buffer.from(base64String, 'base64');
        const filename = `${uuidv4()}.jpg`;
        const fullPath = path.join(candidatePhotosDir, filename);
        fs.writeFileSync(fullPath, buffer);
        return filename;
    } catch (err) {
        console.error('Failed to save candidate photo:', err.message);
        return null;
    }
}

// ---------------------------------------------------------------------------
// POST /api/screen  — analyze resume via Python AI
// ---------------------------------------------------------------------------
exports.screenResume = async (req, res) => {
    try {
        // Step 1: Receive resume file
        const file = req.file;
        if (!file) {
            return res.status(400).json({ success: false, message: 'Missing resume file' });
        }

        // Step 2: Validate jobId and fetch Job description
        const { jobId } = req.body;
        if (!jobId) {
            fs.unlinkSync(file.path);
            return res.status(400).json({ success: false, message: 'Missing jobId' });
        }

        const connection = await db.getConnection();
        let jobRecord;
        try {
            const [jobs] = await connection.execute(
                'SELECT id, title, description, version FROM jobs WHERE id = ? AND user_id = ?',
                [jobId, req.user.id]
            );
            if (!jobs || jobs.length === 0) {
                fs.unlinkSync(file.path);
                connection.release();
                return res.status(404).json({ success: false, message: 'Job not found or not owned by user' });
            }
            jobRecord = jobs[0];
        } catch (err) {
            fs.unlinkSync(file.path);
            console.error('DB error fetching job:', err);
            connection.release();
            return res.status(500).json({ success: false, message: 'Database error fetching job' });
        }

        // Step 3: File metadata
        const filePath = file.path;
        const originalName = file.originalname;
        const storedName = file.filename;
        const fileGuid = file.fileGuid;

        // Parse candidate name from original file name (fallback)
        let candidateName = 'Unknown Candidate';
        if (originalName) {
            const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
            const cleanName = nameWithoutExt.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
            const ignoreWords = ['resume', 'cv', 'cover', 'letter', 'hiring', 'job', 'screener'];
            const words = cleanName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1));
            const filteredWords = words.filter(w => !ignoreWords.includes(w.toLowerCase()));
            if (filteredWords.length > 0) candidateName = filteredWords.join(' ');
        }

        // Step 4: Call Python AI
        const form = new FormData();
        form.append('resume', fs.createReadStream(filePath));
        form.append('jd', jobRecord.description || '');

        connection.release();

        let aiResponse;
        try {
            const pythonApiUrl = process.env.PYTHON_API || 'http://127.0.0.1:8000/analyze';
            const response = await axios.post(pythonApiUrl, form, { headers: form.getHeaders() });
            aiResponse = response.data;
        } catch (error) {
            console.error('Python API failure:', error.message);
            return res.status(500).json({ success: false, message: 'Failed to connect to the Python AI service.' });
        }

        // Step 5: Save photo if provided by AI
        const photoPath = savePhoto(aiResponse.candidate_photo || null);

        // Step 6: Parse metrics
        const score = aiResponse.score || 0;
        const semanticScore = aiResponse.score_breakdown?.semantic_score || 0;
        const skillScore = aiResponse.score_breakdown?.skill_score || 0;
        const keywordBonus = aiResponse.score_breakdown?.keyword_bonus || 0;
        const resumeStrength = aiResponse.resume_strength || 'Unknown';
        const similarity = aiResponse.similarity || 0;
        const skillMatchPercentage = aiResponse.skill_match_percentage || 0;
        const resolvedCandidateName = aiResponse.candidate_name || candidateName;
        const resolvedCandidateEmail = aiResponse.candidate_email || null;
        const resolvedCandidatePhone = aiResponse.candidate_phone || null;
        const resolvedCandidateExperience = aiResponse.experience_years || null;
        const resolvedCandidateEducation = aiResponse.education || null;

        return res.status(200).json({
            success: true,
            message: 'Resume analyzed successfully',
            data: {
                job_id: jobRecord.id,
                candidate_name: resolvedCandidateName,
                candidate_email: resolvedCandidateEmail,
                candidate_phone: resolvedCandidatePhone,
                experience_years: resolvedCandidateExperience,
                education: resolvedCandidateEducation,
                photo_path: photoPath,
                file_name: originalName,
                file_path: filePath,
                file_guid: fileGuid,
                stored_file_name: storedName,
                score,
                strength: resumeStrength,
                matched_skills: aiResponse.matched_skills || [],
                missing_skills: aiResponse.missing_skills || [],
                semantic_score: semanticScore,
                skill_score: skillScore,
                keyword_bonus: keywordBonus,
                similarity,
                skill_match_percentage: skillMatchPercentage,
                explanation: aiResponse.explanation || []
            }
        });

    } catch (error) {
        console.error('Unexpected server error:', error);
        return res.status(500).json({ success: false, message: 'Meaningful error: An unexpected exception occurred.' });
    }
};

// ---------------------------------------------------------------------------
// POST /api/screen/check-duplicate  — check if candidate already in DB
// ---------------------------------------------------------------------------
exports.checkDuplicate = async (req, res) => {
    try {
        const { candidateEmail, candidateName } = req.body;

        if (!candidateEmail) {
            // No email → cannot deduplicate, treat as new
            return res.json({ status: 'new' });
        }

        const connection = await db.getConnection();

        try {
            const [rows] = await connection.execute(
                'SELECT id, full_name FROM candidates WHERE email = ? LIMIT 1',
                [candidateEmail]
            );

            if (!rows || rows.length === 0) {
                return res.json({ status: 'new' });
            }

            const existing = rows[0];
            const normalizedExisting = existing.full_name?.trim().toLowerCase();
            const normalizedNew = candidateName?.trim().toLowerCase();

            if (normalizedExisting === normalizedNew) {
                return res.json({
                    status: 'duplicate',
                    candidate_id: existing.id,
                    same_name: true
                });
            } else {
                return res.json({
                    status: 'name_conflict',
                    candidate_id: existing.id,
                    old_name: existing.full_name,
                    new_name: candidateName
                });
            }
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error('Error in checkDuplicate:', err);
        return res.status(500).json({ success: false, message: 'Database error during duplicate check' });
    }
};

// ---------------------------------------------------------------------------
// POST /api/screen/submit  — persist candidate + screening result to DB
// ---------------------------------------------------------------------------
exports.submitScreening = async (req, res) => {
    try {
        const {
            jobId,
            candidateName,
            candidateEmail,
            candidatePhone,
            experienceYears,
            education,
            candidateId,       // provided when duplicate/conflict resolved
            resolvedName,      // final name after conflict resolution
            photoPath,
            fileName,
            filePath,
            fileGuid,
            storedFileName,
            score,
            semanticScore,
            skillScore,
            keywordBonus,
            matchedSkills,
            missingSkills,
            strength,
            similarity,
            skillMatchPercentage,
            explanation
        } = req.body;

        if (!jobId || !candidateName) {
            return res.status(400).json({ success: false, message: 'Job ID and Candidate Name are required' });
        }

        const connection = await db.getConnection();

        // Validate job ownership
        let jobRecord;
        try {
            const [jobs] = await connection.execute(
                'SELECT id, version FROM jobs WHERE id = ? AND user_id = ?',
                [jobId, req.user.id]
            );
            if (!jobs || jobs.length === 0) {
                connection.release();
                return res.status(404).json({ success: false, message: 'Job not found or not owned by user' });
            }
            jobRecord = jobs[0];
        } catch (err) {
            console.error('DB error fetching job:', err);
            connection.release();
            return res.status(500).json({ success: false, message: 'Database error fetching job' });
        }

        const email = candidateEmail || (candidateName.toLowerCase().replace(/\s+/g, '.') + '@example.com');
        const finalName = resolvedName || candidateName;
        const jobVersion = jobRecord.version || 1;

        let resolvedCandidateId;
        let screeningId;

        try {
            await connection.beginTransaction();

            if (candidateId) {
                // ── Existing candidate: update name, photo, phone, experience, education ──────────────────
                resolvedCandidateId = candidateId;

                if (photoPath) {
                    // Delete old photo file if different
                    const [existing] = await connection.execute(
                        'SELECT avatar_url FROM candidates WHERE id = ?',
                        [candidateId]
                    );
                    const oldPhoto = existing?.[0]?.avatar_url;
                    if (oldPhoto && oldPhoto !== photoPath) {
                        const oldFullPath = path.join(candidatePhotosDir, oldPhoto);
                        if (fs.existsSync(oldFullPath)) fs.unlinkSync(oldFullPath);
                    }
                    await connection.execute(
                        'UPDATE candidates SET full_name = ?, avatar_url = ?, department = ? WHERE id = ?',
                        [finalName, photoPath, jobRecord.department || 'Engineering', candidateId]
                    );
                } else {
                    await connection.execute(
                        'UPDATE candidates SET full_name = ?, department = ? WHERE id = ?',
                        [finalName, jobRecord.department || 'Engineering', candidateId]
                    );
                }

                // Upsert resume record
                const [existingResumes] = await connection.execute(
                    'SELECT id FROM resumes WHERE candidate_id = ? LIMIT 1',
                    [candidateId]
                );
                if (existingResumes.length > 0) {
                    await connection.execute(
                        'UPDATE resumes SET file_name = ?, file_path = ?, file_guid = ?, original_file_name = ?, stored_file_name = ? WHERE candidate_id = ?',
                        [fileName, filePath, fileGuid || '', fileName, storedFileName || '', candidateId]
                    );
                } else if (filePath) {
                    await connection.execute(
                        'INSERT INTO resumes (candidate_id, file_name, file_path, file_guid, original_file_name, stored_file_name) VALUES (?, ?, ?, ?, ?, ?)',
                        [candidateId, fileName, filePath, fileGuid || '', fileName, storedFileName || '']
                    );
                }

                // Upsert screening result for this job
                const [existingScreenings] = await connection.execute(
                    'SELECT id FROM screening_results WHERE candidate_id = ? AND job_id = ? LIMIT 1',
                    [candidateId, jobId]
                );
                if (existingScreenings.length > 0) {
                    await connection.execute(
                        `UPDATE screening_results SET
                            score = ?, semantic_score = ?, skill_score = ?, keyword_bonus = ?,
                            matched_skills = ?, missing_skills = ?, strength = ?, similarity = ?,
                            skill_match_percentage = ?, explanation = ?, processed_at = NOW(),
                            job_version = ?, requires_rescreening = 0
                         WHERE candidate_id = ? AND job_id = ?`,
                        [
                            score || 0, semanticScore || 0, skillScore || 0, keywordBonus || 0,
                            JSON.stringify(matchedSkills || []), JSON.stringify(missingSkills || []),
                            strength || 'Unknown', similarity || 0, skillMatchPercentage || 0,
                            JSON.stringify(explanation || []), jobVersion,
                            candidateId, jobId
                        ]
                    );
                    screeningId = existingScreenings[0].id;
                } else {
                    const [screeningResult] = await connection.execute(
                        `INSERT INTO screening_results
                         (candidate_id, job_id, score, semantic_score, skill_score, keyword_bonus,
                          matched_skills, missing_skills, strength, similarity, skill_match_percentage,
                          explanation, processed_at, job_version, requires_rescreening)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, 0)`,
                        [
                            candidateId, jobId, score || 0, semanticScore || 0, skillScore || 0, keywordBonus || 0,
                            JSON.stringify(matchedSkills || []), JSON.stringify(missingSkills || []),
                            strength || 'Unknown', similarity || 0, skillMatchPercentage || 0,
                            JSON.stringify(explanation || []), jobVersion
                        ]
                    );
                    screeningId = screeningResult.insertId;
                }

            } else {
                // ── New candidate ─────────────────────────────────────────────────
                const [candidateResult] = await connection.execute(
                    'INSERT INTO candidates (full_name, email, avatar_url, department) VALUES (?, ?, ?, ?)',
                    [finalName, email, photoPath || null, jobRecord.department || 'Engineering']
                );
                resolvedCandidateId = candidateResult.insertId;

                if (filePath) {
                    await connection.execute(
                        'INSERT INTO resumes (candidate_id, file_name, file_path, file_guid, original_file_name, stored_file_name) VALUES (?, ?, ?, ?, ?, ?)',
                        [resolvedCandidateId, fileName, filePath, fileGuid || '', fileName, storedFileName || '']
                    );
                }

                const [screeningResult] = await connection.execute(
                    `INSERT INTO screening_results
                     (candidate_id, job_id, score, semantic_score, skill_score, keyword_bonus,
                      matched_skills, missing_skills, strength, similarity, skill_match_percentage,
                      explanation, processed_at, job_version, requires_rescreening)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, 0)`,
                    [
                        resolvedCandidateId, jobId, score || 0, semanticScore || 0, skillScore || 0, keywordBonus || 0,
                        JSON.stringify(matchedSkills || []), JSON.stringify(missingSkills || []),
                        strength || 'Unknown', similarity || 0, skillMatchPercentage || 0,
                        JSON.stringify(explanation || []), jobVersion
                    ]
                );
                screeningId = screeningResult.insertId;
            }

            await connection.commit();
        } catch (dbError) {
            await connection.rollback();
            console.error('MySQL transaction failure:', dbError);
            return res.status(500).json({ success: false, message: 'MySQL database transaction failure during saving.' });
        } finally {
            connection.release();
        }

        return res.status(200).json({
            success: true,
            message: 'Candidate and screening result applied to database successfully',
            data: {
                id: screeningId,
                candidate_id: resolvedCandidateId
            }
        });

    } catch (err) {
        console.error('Unexpected error in submitScreening:', err);
        return res.status(500).json({ success: false, message: 'Unexpected server error during submit' });
    }
};
