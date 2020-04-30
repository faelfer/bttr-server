const app = require('../../server')
const { setupDB } = require('../utils/test-setup')
const supertest = require('supertest')
const request = supertest(app)
const User = require('../models/User');

setupDB('endpoint-testing')

it('Should save user to database', async done => {
    const res = await request.post('/api/users')
    .send({
		"email": "testing@gmail.com",
        "username": "testing",
        "password": "testing"
    })

    const user = await User.findOne({ email: 'testing@gmail.com' })
    expect(user.username).toBeTruthy()
    expect(user.email).toBeTruthy()
    done()
  })

it('Gets the test endpoint', async done => {
    // Sends GET Request to /test endpoint
    const response = await request.get('/api/test')
  
    // ...
    expect(response.status).toBe(200)
    expect(response.body.message).toBe('pass!')
    done()
  })