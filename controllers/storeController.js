const mongoose = require('mongoose');
const Store = mongoose.model('Store');

exports.homePage = (req, res) => {
  // console.log(req.name);
  // req.flash('error', 'Something happenned');
  res.render('index');
};


exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store'});
};


exports.createStore = async (req, res) => { // for the await
  // res.json(req.body);
  const store = new Store(req.body);
  await store.save(); // await until the save() has passed you can continue
  req.flash('success', `Successfully Created. ${store.name} Care to leave a review?`);

  res.redirect('/');
};
