// Replace t with actual table name.
const stocksService = {
    getAll(knex) {
      return knex.select('*').from('stocks')
    },
  
    insert(knex, newData) {
      return knex
        .insert(newData)
        .into('stocks')
        .returning('*')
        .then(rows => {
          return rows[0]
        })
    },
  
    getByUser(knex, user_id) {
      return knex
        .from('stocks')
        .select('*')
        .where('user_id', user_id)
    },
  
    delete(knex, id, user_id) {
      return knex('stocks')
        .where({ id, user_id })
        .delete()
    }
  }
  
  module.exports = stocksService