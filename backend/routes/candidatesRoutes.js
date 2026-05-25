const express = require('express');
const router = express.Router();
const candidatesController = require('../controllers/candidatesController');
const auth = require('../middleware/authMiddleware');

router.get('/candidates', auth, candidatesController.listCandidates);
router.get('/candidates/:id', auth, candidatesController.getCandidate);
router.put('/candidates/:id/status', auth, candidatesController.updateCandidateStatus);
router.delete('/candidates/:candidateId', auth, candidatesController.deleteCandidate);
router.delete('/candidates/screening/:screeningId', auth, candidatesController.deleteScreeningResult);

module.exports = router;
