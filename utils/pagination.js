const paginate = async (model, options = {}) => {
  const page = parseInt(options.req?.query?.page) || 1;
  const limit = parseInt(options.req?.query?.limit) || 10;
  const offset = (page - 1) * limit;

  const queryOptions = { ...options };
  delete queryOptions.req;

  const { count, rows } = await model.findAndCountAll({
    ...queryOptions,
    limit,
    offset
  });

  return {
    data: rows,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit)
  };
};

module.exports = { paginate };