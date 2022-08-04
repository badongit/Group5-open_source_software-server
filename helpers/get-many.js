const getMany = async (model, rawQuery, populates) => {
  let query;

  const reqQuery = { ...rawQuery };

  const removeFields = ["keyword", "startIndex", "limit", "sort", "select"];
  removeFields.forEach((field) => delete reqQuery[field]);

  let queryStr = JSON.stringify(reqQuery);
  queryStr = queryStr.replace(
    /\b(eq|gt|gte|lt|lte|in|nin|ne)\b/g,
    (match) => `$${match}`
  );

  const conditions = { ...JSON.parse(queryStr) };

  if (rawQuery.keyword) {
    conditions.$text = { $search: rawQuery.keyword };
  }

  query = model.find(conditions);

  if (rawQuery.select) {
    const fields = rawQuery.select.split(",").join(" ");

    query = query.select(fields);
  }

  if (rawQuery.sort) {
    const sortBy = rawQuery.sort.split(",").join(" ");

    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  const limit = +rawQuery.limit || +process.env.LIMIT;
  const startIndex = +rawQuery.startIndex || +process.env.START;
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

  return { data: results, pagination };
};

module.exports = getMany;
