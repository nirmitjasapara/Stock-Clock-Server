const knex = require("knex");
const app = require("../src/app");
const helpers = require("./test-helpers");
const xss = require("xss");

describe("Stocks Endpoints", function() {
  let db;

  const { testUsers, testStocks } = helpers.makeStocksFixtures();

  const serializeStock = stock => ({
    id: stock.id,
    symbol: xss(stock.symbol),
    modified: xss(stock.modified),
    user_id: stock.user_id
  });

  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DATABASE_URL
    });
    app.set("db", db);
  });

  after("disconnect from db", () => db.destroy());

  before("cleanup", () => helpers.cleanTables(db));

  afterEach("cleanup", () => helpers.cleanTables(db));

  beforeEach("insert stocks", () =>
    helpers.seedStocksTable(db, testUsers, testStocks)
  );

  describe(`GET /api/stocks`, () => {
    context(`Given no stocks`, () => {
      it(`responds with 200 and an empty list`, () => {
        const testUser = testUsers[0];
        return supertest(app)
          .get("/api/stocks")
          .set("Authorization", helpers.makeAuthHeader(testUser))
          .expect(200, []);
      });
    });

    context("Given there are stocks in the database", () => {
      it("responds with 200 and all of the stocks", () => {
        const testUser = testUsers[1];
        return supertest(app)
          .get("/api/stocks")
          .set("Authorization", helpers.makeAuthHeader(testUser))
          .expect(
            200,
            helpers.makeExpectedStocks(testStocks, testUser).map(serializeStock)
          );
      });
    });
  });

  describe(`POST /api/stocks/`, () => {
    it(`creates a stock, responding with 201 and the new stock`, function() {
      this.retries(3);
      const testUser = testUsers[0];
      const newStock = {
        symbol: "aapl"
      };
      return supertest(app)
        .post("/api/stocks")
        .set("Authorization", helpers.makeAuthHeader(testUser))
        .send(newStock)
        .expect(201)
        .expect(res => {
          expect(res.body).to.have.property("id");
          expect(res.body.symbol).to.eql(serializeStock(newStock).symbol);
          expect(res.body.user_id).to.eql(testUser.id);
        })
        .expect(res =>
          db
            .from("stocks")
            .select("*")
            .where({ id: res.body.id })
            .first()
            .then(row => {
              expect(row.symbol).to.eql(newStock.symbol);
              expect(row.user_id).to.eql(testUser.id);
            })
        );
    });
  });
});
