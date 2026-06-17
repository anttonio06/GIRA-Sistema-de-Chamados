const express      = require('express');
const router       = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize    = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { criarChamadoSchema, atualizarChamadoSchema } = require('../validators/index');
const {
    criarChamado, listarChamados, buscarChamado,
    atualizarChamado, cancelarChamado,
} = require('../controllers/chamadoController');

router.use(authenticate);

router.post('/',    authorize('solicitante', 'admin'), validate(criarChamadoSchema), criarChamado);
router.get('/',     listarChamados);
router.get('/:id',  buscarChamado);
router.put('/:id',  authorize('tecnico', 'admin'), validate(atualizarChamadoSchema), atualizarChamado);
router.delete('/:id', authorize('solicitante'), cancelarChamado);

module.exports = router;
