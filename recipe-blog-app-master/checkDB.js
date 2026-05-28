const mongoose = require('mongoose');
const Recipe = require('./server/models/Recipe');
mongoose.connect('mongodb://localhost:27017/recipe_blog').then(async () => {
  const r = await Recipe.find({ $or: [ {'likes.0': { $exists: true }}, {'comments.0': { $exists: true }} ]});
  console.log('Recipes with likes/comments:', r.length);
  console.log(r.map(x => ({ name: x.name, likes: x.likes.length, comments: x.comments.length })));
  
  const all = await Recipe.find({});
  console.log('Total Recipes:', all.length);
  process.exit(0);
});
