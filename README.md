# Stock Clock Server

### Users Endpoints

### POST `/api/auth/login`

```js
// req.body
{
  user_name: String,
  password: String
}

// res.body
{
  authToken: String
}
```

### POST `/api/auth/register`

```js
// req.body
{
  user_name: String,
  full_name: String,
  password: String
}

// res.body
{
  user_name: String,
  full_name: String,
  password: String,
  date_created: Timestamp
}
```

### GET `/api/stocks/`

Returns all the Stocks the User has subscribed to. Requires an AuthToken for the UserID.

```js
// req.header
Authorization: Bearer ${token}

// res.body
[
  id: ID,
  symbol: String,
  modified: DateTime,
  user_id: UserId
]
```

### POST `/api/stocks/`

Creates a new stock. Requires the symbol of the company with an AuthToken for the UserID.

```js
// req.body
{
  symbol: String
}

// req.header
Authorization: Bearer ${token}

// res.body
{
  id: ID,
  symbol: String,
  modified: DateTime,
  user_id: UserId
}
```

### DELETE `/api/stocks/:id`

```js
// req.params
{
  id: ID
}
// res.body
[
  status: 204
]
```

## Scripts

Start the application `npm start`

Start nodemon for the application `npm run dev`

Run the tests `npm test`

## Create local

- `pg_ctl -D /usr/local/var/postgres start` if not started yet (Mac)
- `createuser -Pw --interactive` if user has not yet been created

1. `createdb -U user_name stockdb`
2. `npm run migrate`

## Setup for running tests

- `pg_ctl -D /usr/local/var/postgres start` if not started yet (Mac)
- `createuser -Pw --interactive` if user has not yet been created

2. `createdb -U user_name stockdb-test`
3. `npm run migrate:test`

## Tear Down

1. `npm run migrate -- 0`
2. `dropdb db_name`
3. `pg_ctl stop`

## Heroku

1. `heroku create`
2. `heroku addons:create heroku-postgresql:hobby-dev`
3. `heroku config:set JWT_SECRET=paste-your-token-here`
4. `npm run deploy`

- Set scale to free: `heroku ps:scale web=1`
- If problems with verification: `heroku config:set PGSSLMODE=no-verify.`

## Technology Stack

### Backend

- **Express** for handling API requests
- **Node** for interacting with the file system
- **Knex.js** for interfacing with the **PostgreSQL** database
- **Postgrator** for database migration
- **Mocha**, **Chai**, **Supertest** for endpoints testing
- **JSON Web Token**, **bcryptjs** for user authentication / authorization
- **Xss** for cross-site scripting protection
- **Winston**, **Morgan** for logging and errors
