const express      = require('express');
const router       = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize    = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { criarUsuarioSchema } = require('../validators/index');
const { listarUsuarios, criarUsuario, alterarAtivo } = require('../controllers/usuarioController');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/',          listarUsuarios);
router.post('/',         validate(criarUsuarioSchema), criarUsuario);
router.put('/:id/ativo', alterarAtivo);

module.exports = router;
