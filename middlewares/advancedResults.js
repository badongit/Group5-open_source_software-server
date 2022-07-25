const configuration = require("../configs/configuration");
const errorEnum = require("../enum/error.enum");
const ErrorResponse = require("../helpers/error-response");
const asyncHandle = require("../middlewares/asyncHandle");

const advancedResults = (model, populates) =>
  asyncHandle(async function (req, res, next) {
    let query;

    const reqQuery = { ...req.query };

    const removeFields = ["keyword", "startIndex", "limit", "sort", "select"];
    removeFields.forEach((field) => delete reqQuery[field]);

    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(
      /\b(eq|gt|gte|lt|lte|in|nin|ne)\b/g,
      (match) => `$${match}`
    );

    const conditions = { ...JSON.parse(queryStr) };

    if (req.query.keyword) {
      conditions.$text = { $search: req.query.keyword };
    }

    query = model.find(conditions);

    if (req.query.select) {
      const fields = req.query.select.split(",").join(" ");

      query = query.select(fields);
    }

    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");

      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    const limit = +req.query.limit || +process.env.LIMIT;
    const startIndex = +req.query.startIndex || +process.env.START;
    const endIndex = startIndex + limit;
    const total = await model.countDocuments(conditions);

    query = query.skip(startIndex).limit(limit).lean();

    if (populates?.length) {
      populates.forEach((populate) => {
        query = query.populate(populate);
      });
    }

    const results = await query;

    const pagination = { total };

    if (endIndex < total) {
      pagination.next = {
        startIndex: endIndex,
        limit,
      };
    }

    res.advancedResults = {
      data: results,
      pagination,
    };

    next();
  });

module.exports = advancedResults;
