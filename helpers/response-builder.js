const msgEnum = require("../enum/msg.enum");

class ResponseBuilder {
  constructor(data) {
    this.data = data;
    this.success = true;
    this.message = msgEnum.SUCCESS;
  }

  withMessage(msg) {
    this.message = msg;
  }

  withCode(statusCode) {
    this.success = statusCode && statusCode < 400;
  }

  withPagination({ total, page, limit }) {
    this.page = page;
    this.total = total;
    this.limit = limit;
  }

  build() {
    const response = {
      success: this.success,
      message: this.message,
      data: this.data,
    };

    if (this.page) {
      response.pagination = {
        page: this.page,
        limit: this.limit,
        total: this.total,
      };
    }

    return response;
  }
}

module.exports = ResponseBuilder;
