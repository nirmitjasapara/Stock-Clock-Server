const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function makeUsersArray() {
  return [
    {
      id: 1,
      user_name: "test-user-1",
      full_name: "Test user 1",
      password: "password",
      date_created: new Date("2029-01-22T16:28:32.615Z")
    },
    {
      id: 2,
      user_name: "test-user-2",
      full_name: "Test user 2",
      password: "password",
      date_created: new Date("2029-01-22T16:28:32.615Z")
    },
    {
      id: 3,
      user_name: "test-user-3",
      full_name: "Test user 3",
      password: "password",
      date_created: new Date("2029-01-22T16:28:32.615Z")
    },
    {
      id: 4,
      user_name: "test-user-4",
      full_name: "Test user 4",
      password: "password",
      date_created: new Date("2029-01-22T16:28:32.615Z")
    }
  ];
}

function makeStocksArray(users) {
  return [
    {
      id: 1,
      symbol: "IBM",
      modified: "2021-05-22T18:46:21.072Z",
      user_id: users[1].id
    },
    {
      id: 2,
      symbol: "AAPL",
      modified: "2021-05-22T18:46:21.072Z",
      user_id: users[1].id
    },
    {
      id: 3,
      symbol: "MSFT",
      modified: "2021-05-22T18:46:21.072Z",
      user_id: users[2].id
    },
    {
      id: 4,
      symbol: "NFLX",
      modified: "2021-05-22T18:46:21.072Z",
      user_id: users[3].id
    }
  ];
}

function makeStocksFixtures() {
  const testUsers = makeUsersArray();
  const testStocks = makeStocksArray(testUsers);
  return { testUsers, testStocks };
}
function makeExpectedStocks(stocks, testUser) {
  return stocks.filter(s => testUser.id === s.user_id);
}

function cleanTables(db) {
  return db.transaction(trx =>
    trx
      .raw(
        `TRUNCATE
        stocks,
        users
      `
      )
      .then(() =>
        Promise.all([
          trx.raw(`ALTER SEQUENCE stocks_id_seq minvalue 0 START WITH 1`),
          trx.raw(`ALTER SEQUENCE users_id_seq minvalue 0 START WITH 1`),
          trx.raw(`SELECT setval('stocks_id_seq', 0)`),
          trx.raw(`SELECT setval('users_id_seq', 0)`)
        ])
      )
  );
}

function seedUsers(db, users) {
  const preppedUsers = users.map(user => ({
    ...user,
    password: bcrypt.hashSync(user.password, 1)
  }));
  return db
    .into("users")
    .insert(preppedUsers)
    .then(() =>
      // update the auto sequence to stay in sync
      db.raw(`SELECT setval('users_id_seq', ?)`, [users[users.length - 1].id])
    );
}

function seedStocksTable(db, users, stocks) {
  // use a transaction to group the queries and auto rollback on any failure
  return db.transaction(async trx => {
    await seedUsers(trx, users);
    await trx.into("stocks").insert(stocks);
    // update the auto sequence to match the forced id values
    await trx.raw(`SELECT setval('stocks_id_seq', ?)`, [
      stocks[stocks.length - 1].id
    ]);
  });
}

function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
  const token = jwt.sign({ user_id: user.id }, secret, {
    subject: user.user_name,
    algorithm: "HS256"
  });
  return `Bearer ${token}`;
}

module.exports = {
  makeUsersArray,
  makeStocksArray,

  makeStocksFixtures,
  makeExpectedStocks,
  cleanTables,
  seedStocksTable,
  makeAuthHeader,
  seedUsers
};
