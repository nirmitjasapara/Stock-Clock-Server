const knex = require("knex");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const helpers = require("./test-helpers");

describe("Auth Endpoints", function() {
  let db;

  const { testUsers } = helpers.makeStocksFixtures();
  const testUser = testUsers[0];

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

  describe(`POST /api/auth/login`, () => {
    beforeEach("insert users", () => helpers.seedUsers(db, testUsers));

    const requiredFields = ["user_name", "password"];

    requiredFields.forEach(field => {
      const loginAttemptBody = {
        user_name: testUser.user_name,
        password: testUser.password
      };

      it(`responds with 400 required error when '${field}' is missing`, () => {
        delete loginAttemptBody[field];

        return supertest(app)
          .post("/api/auth/login")
          .send(loginAttemptBody)
          .expect(400, {
            error: `Missing '${field}' in request body`
          });
      });
    });

    it(`responds 400 'invalid user_name or password' when bad user_name`, () => {
      const userInvalidUser = { user_name: "user-not", password: "existy" };
      return supertest(app)
        .post("/api/auth/login")
        .send(userInvalidUser)
        .expect(400, { error: `Incorrect User Name or password` });
    });

    it(`responds 400 'invalid user_name or password' when bad password`, () => {
      const userInvalidPass = {
        user_name: testUser.user_name,
        password: "incorrect"
      };
      return supertest(app)
        .post("/api/auth/login")
        .send(userInvalidPass)
        .expect(400, { error: `Incorrect User Name or password` });
    });

    it(`responds 200 and JWT auth token using secret when valid credentials`, () => {
      const userValidCreds = {
        user_name: testUser.user_name,
        password: testUser.password
      };
      const expectedToken = jwt.sign(
        { user_id: testUser.id },
        process.env.JWT_SECRET,
        {
          subject: testUser.user_name,
          algorithm: "HS256"
        }
      );
      return supertest(app)
        .post("/api/auth/login")
        .send(userValidCreds)
        .expect(200, {
          authToken: expectedToken
        });
    });
  });
  describe(`POST /api/auth/register`, () => {
    context(`Happy path`, () => {
      it(`responds 201, serialized user, storing bcryped password`, () => {
        const newUser = {
          user_name: "test user_name",
          password: "11AAaa!!",
          full_name: "test full_name"
        };
        return supertest(app)
          .post("/api/auth/register")
          .send(newUser)
          .expect(201)
          .expect(res => {
            expect(res.body).to.have.property("id");
            expect(res.body.user_name).to.eql(newUser.user_name);
            expect(res.body.full_name).to.eql(newUser.full_name);
          })
          .expect(res =>
            db
              .from("users")
              .select("*")
              .where({ id: res.body.id })
              .first()
              .then(row => {
                expect(row.user_name).to.eql(newUser.user_name);
                expect(row.full_name).to.eql(newUser.full_name);
                return bcrypt.compare(newUser.password, row.password);
              })
              .then(compareMatch => {
                expect(compareMatch).to.be.true;
              })
          );
      });
    });
  });
});