const express = require('express');
const router = express.Router();
const jobsController = require('../controllers/jobsController');
const auth = require('../middleware/authMiddleware');

router.get('/jobs', auth, jobsController.listJobs);
router.get('/jobs/:id', auth, jobsController.getJob);
router.post('/jobs', auth, jobsController.createJob);
router.put('/jobs/:id', auth, jobsController.updateJob);
router.post('/jobs/:id/rescreen', auth, jobsController.rescreenJobCandidates);
router.delete('/jobs/:id', auth, jobsController.deleteJob);

module.exports = router;
