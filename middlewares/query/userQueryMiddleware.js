const asyncErrorWrapper = require("express-async-handler");
const { searchHelper, paginationHelper } = require("./queryMiddlewareHelpers");

const userQueryMiddleware = function (model, options) {
  return asyncErrorWrapper(async (req, res, next) => {
    let query = model.find();

    // SEARCH BY NAME
    query = searchHelper("name", query, req);

    const total = await model.countDocuments();
    const paginationResult = await paginationHelper(total, query, req);

    query = paginationResult.query;
    const { pagination } = paginationResult;

    const queryResults = await query;

    res.queryResults = {
      success: true,
      count: queryResults.length,
      pagination,
      data: queryResults,
    };
    next();
  });
};

module.exports = { userQueryMiddleware };
