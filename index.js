// index.js: keeno-rest-starter main entry point

("use strict");

// Load all necessary modules
const path = require("path");
const system = require("zyx-system");
const { loadEncryptKey } = require("zyx-env");
const { loadServerConfig, loadTenantConfigs } = require("zyx-base");
const { RestServer, systemRouter, UserRouter } = require("zyx-rest");
const {
  createDB,
  closeDB,
  createLog,
  closeLog,
  UserModel,
} = require("zyx-mongodb");
// const { createEmailer, closeEmailer } = require("zyx-nodemailer");

(async () => {
  try {
    // if not in production then load encryption key from file
    if (!system.isProduction) {
      process.env.ENCRYPT_KEY = loadEncryptKey("./_secret.key");
    }

    // load server and tenant configuration files
    const serverConfig = loadServerConfig();
    const tenantConfigs = loadTenantConfigs();

    // if in debug; log encrypt key, server and tenant configurations
    if (system.isDebugging) {
      console.debug("ENCRYPT_KEY", process.env.ENCRYPT_KEY);
      console.debug("serverConfig", serverConfig);
      console.debug("tenantConfigs", tenantConfigs);
    }

    // instanciate the rest server
    let server = new RestServer(serverConfig, tenantConfigs);

    // define all services for server and tenants
    await server.service("db", createDB, closeDB, "both");
    await server.service("log", createLog, closeLog, "both");
    // await server.service("emailer", createEmailer, closeEmailer, "tenants");

    // assign all models to each tenant
    await server.model("user", UserModel);

    // assign all routers
    server.router("/api/system", new systemRouter());
    server.router("/api/user", new UserRouter());

    // start listening for requests
    server.listen(() => {
      console.log(`Server is listening on port ${serverConfig.port}`);
      require("./test/api-user-routes.test.js");
    });
  } catch (err) {
    // halt program if any error
    system.fatal(err.message);
  }
})();
