const asyncErrorWrapper = require("express-async-handler");
const {
  searchHelper,
  populateHelper,
  questionSortHelper,
  paginationHelper,
} = require("./queryMiddlewareHelpers");

const questionQueryMiddleware = function (model, options) {
  return asyncErrorWrapper(async function (req, res, next) {
    // initial query

    let query = model.find();
    //search

    query = searchHelper("title", query, req);

    //populate
    if (options && options.population) {
      console.log(query)
      query = populateHelper(query, options.population);
    }

    // sort

    query = questionSortHelper(query, req);

    //pagination

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

module.exports = questionQueryMiddleware;
