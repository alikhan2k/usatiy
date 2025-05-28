const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const db = new sqlite3.Database('./votes.db', (err) => {
    if (err) {
        return console.error('Ошибка подключения к базе данных:', err.message);
    }
    console.log('Успешное подключение к базе данных.');
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Основная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Инициализация таблиц базы данных
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS votes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            option TEXT,
            ip TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS options (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT
        )
    `);
});

// Получить все варианты
app.get('/api/options', (req, res) => {
    db.all('SELECT * FROM options', (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Ошибка при получении вариантов.');
        }
        res.json(rows);
    });
});

// Добавить вариант
app.post('/api/options', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).send('Поле name обязательно.');

    db.run('INSERT INTO options (name) VALUES (?)', [name], function (err) {
        if (err) {
            console.error(err);
            return res.status(500).send('Ошибка при добавлении варианта.');
        }
        res.json({ id: this.lastID });
    });
});

// Удалить вариант
app.delete('/api/options/:id', (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM options WHERE id = ?', [id], function (err) {
        if (err) {
            console.error(err);
            return res.status(500).send('Ошибка при удалении варианта.');
        }
        res.sendStatus(200);
    });
});

// Проголосовать
app.post('/api/vote', (req, res) => {
    const { optionId } = req.body;
    const ip = req.ip;

    if (!optionId) return res.status(400).send('optionId обязателен.');

    db.get('SELECT timestamp FROM votes WHERE ip = ? ORDER BY timestamp DESC LIMIT 1', [ip], (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Ошибка при проверке предыдущего голоса.');
        }

        const now = new Date();
        if (row) {
            const lastVote = new Date(row.timestamp);
            const diff = (now - lastVote) / (1000 * 60); // в минутах
            if (diff < 10) {
                return res.status(429).send('Можно голосовать только раз в 10 минут.');
            }
        }

        db.get('SELECT name FROM options WHERE id = ?', [optionId], (err, option) => {
            if (err || !option) {
                return res.status(400).send('Вариант не найден.');
            }

            db.run('INSERT INTO votes (option, ip) VALUES (?, ?)', [option.name, ip], function (err) {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Ошибка при голосовании.');
                }
                res.sendStatus(200);
            });
        });
    });
});

// Получить результаты голосования
app.get('/api/results', (req, res) => {
    db.all('SELECT option, COUNT(*) as count FROM votes GROUP BY option', (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Ошибка при получении результатов.');
        }
        res.json(rows);
    });
});

// Получить всю историю голосов
app.get('/api/votes', (req, res) => {
    db.all('SELECT * FROM votes ORDER BY timestamp DESC', (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Ошибка при получении истории голосов.');
        }
        res.json(rows);
    });
});

// Сбросить все голоса
app.delete('/api/votes', (req, res) => {
    db.run('DELETE FROM votes', (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Ошибка при удалении голосов.');
        }
        res.sendStatus(200);
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
