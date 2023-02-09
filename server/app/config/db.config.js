module.exports = {
    HOST: "localhost",
    USER: "dev",
    PASSWORD: "password123",
    DB: "postgres",
    dialect: "postgres",
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
};