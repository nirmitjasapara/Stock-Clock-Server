const path = require('path')
const express = require('express')
const xss = require('xss')
const { requireAuth } = require('../middleware/jwt-auth')
const StocksService = require('./stocks-service')

const stocksRouter = express.Router()
const jsonParser = express.json()

const serialize = stocks => ({
  id: stocks.id,
  symbol: xss(stocks.symbol),
  modified: stocks.modified,
  user_id: stocks.user_id
})

stocksRouter
  .route('/')
  .get(requireAuth, (req, res, next) => {
    StocksService.getByUser(
      req.app.get('db'), 
      req.user.id)
      .then(data => {
        res.json(data.map(serialize))
      })
      .catch(next)
  })
  .post(requireAuth, jsonParser, (req, res, next) => {
    const { symbol, modified } = req.body
    const newData = { symbol }

    for (const [key, value] of Object.entries(newData))
      if (value == null)
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        })

    newData.modified = modified;
    newData.user_id = req.user.id

    console.log(JSON.stringify(newData));
    StocksService.insert(
      req.app.get('db'),
      newData
    )
      .then(data => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${data.id}`))
          .json(serialize(data))
      })
      .catch(next)
  })

stocksRouter
  .route('/:_id')
  .delete(requireAuth, (req, res, next) => {
    StocksService.delete(
      req.app.get('db'),
      req.params._id,
      req.user.id
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })

module.exports = stocksRouter