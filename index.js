const sqlite = require('sqlite')
const Promise = require('bluebird')

const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

const app = express()
const port = 3001
const dbPromise = sqlite.open('./database.sqlite', { Promise })

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

async function run(stmt, ...args) {
	log(args)
	const db = await dbPromise
	return await db.run(stmt, ...args)
}

function log(...args) {
	console.log(...args)
}

app.route('/issue')
	.get(async (req, res) => {
		try {
			const db = await dbPromise
			const issues = await db.all('SELECT * FROM issues')
			res.send(issues)
			log('FETCHED issues')
		} catch (e) {
			console.error('GET /issue', e)
			console.error(req.body)
		}
	})
	.post(async (req, res) => {
		const { title, description, status } = req.body
		try {
			const { stmt: { lastID } } = await run('INSERT INTO issues (title, description, status) VALUES (?, ?, ?)',
				title, description, status)
			res.send({
				id: lastID,
				title,
				description,
				status
			}).status(201)
			log('CREATED issue', id)
		} catch (e) {
			console.error('POST /issue', e)
			console.error(req.body)
		}
	})
	.put(async (req, res) => {
		const { id, title, description, status } = req.body
		try {
			await run('UPDATE issues SET title=?, description=?, status=? WHERE id=?',
				title, description, status, +id)
			res.sendStatus(200)
			log('UPDATED issue', id)
		} catch (e) {
			console.error('PUT /issue', e)
			console.error(req.body)
		}
	})

app.route('/issue/:id').delete(async (req, res) => {
	try {
		const id = +req.params.id
		await run('DELETE FROM issues WHERE id=?', id)
		log('DELETED issue', id)
		res.sendStatus(200)
	} catch (e) {
		console.error('DELETE /issue', e)
		console.error(req.body)
	}
})

app.listen(port, () => console.log(`Backend: http://localhost:${port}/`))
