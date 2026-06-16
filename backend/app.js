require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors    = require('cors');

const authRoutes = require('./src/routes/auth');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin:      process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));

app.use(express.json());

app.use(session({
    secret:            process.env.SESSION_SECRET || 'troca_antes_de_usar',
    resave:            false,
    saveUninitialized: false,
    cookie: {
          httpOnly: true,
          sameSite: 'strict',
          maxAge:   1000 * 60 * 60 * 8,
    },
}));

app.use('/auth', authRoutes);

app.get('/', (req, res) => res.json({ status: 'GIRA API online', versao: '0.1.0' }));

app.listen(PORT, () => {
    console.log('GIRA API rodando em http://localhost:' + PORT);
});
