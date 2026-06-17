const express      = require('express');
const router       = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize    = require('../middleware/authorize');
const { listarLogs } = require('../controllers/auditController');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/', listarLogs);

module.exports = router;
