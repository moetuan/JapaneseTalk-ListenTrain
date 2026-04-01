const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  sentences: [
    {
      jp: {
        type: String,
        required: true,
      },
      cn: {
        type: String,
        required: true,
      },
    },
  ],
  tags: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;