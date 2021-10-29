class APIFeatures {
    constructor(query, reqQuery) {
        this.query = query;
        this.reqQuery = reqQuery;
    }

    filter() {
        // Basic filtering
        const queryObj = { ...this.reqQuery };
        const excludedFields = ['page', 'limit', 'sort', 'fields'];

        excludedFields.forEach((fieldName) => delete queryObj[fieldName]);

        // Advanced filtering
        // allow "gte", "gt", "lte", "lt"
        let queryStr = JSON.stringify(queryObj).replace(
            /\b(gte|gt|lte|lt)\b/,
            (match) => `${match}`
        );

        console.log(queryStr);

        this.query = this.query.find(JSON.parse(queryStr));

        return this;
    }

    sort() {
        if (this.reqQuery.sort) {
            const sortBy = this.reqQuery.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt');
        }

        return this;
    }

    limitFields() {
        if (this.reqQuery.fields) {
            let fields = this.reqQuery.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');
        }

        return this;
    }

    pagination() {
        const page = this.reqQuery.page * 1 || 1;
        const limit = this.reqQuery.limit * 1 || 50;
        const skip = (page - 1) * limit;

        // const totalRecords = await Tour.countDocuments();
        // const totalPages =
        //     Math.floor(totalRecords / limit) +
        //     (totalRecords % limit > 0 ? 1 : 0);

        // if (page > totalPages) throw new Error('This page does not exist!');

        this.query = this.query.skip(skip).limit(limit);

        return this;
    }
}

module.exports = APIFeatures;
