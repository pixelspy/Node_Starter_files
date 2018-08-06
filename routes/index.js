const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');
const { catchErrors } = require('../handlers/errorHandlers');

// Do work here
router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/stores/page/:page', catchErrors(storeController.getStores));
router.get('/add', authController.isLoggedIn, storeController.addStore);
// user goes first through the middleware isLoggedIn (which checks if user is logged in)
// and then user goes to addStore !

router.post('/add',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.createStore)
);
router.post('/add/:id',
storeController.upload,
catchErrors(storeController.resize),
catchErrors(storeController.updateStore)
);

router.get('/stores/:id/edit', catchErrors(storeController.editStore));

router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));

router.get('/tags', catchErrors(storeController.getStoreByTag));
router.get('/tags/:tag', catchErrors(storeController.getStoreByTag));

////////////////////// AUTH
router.get('/login', userController.loginForm);
router.post('/login', authController.login);
router.get('/register', userController.registerForm);

router.post('/register',
// validate the registration data
  userController.validateRegister,
  // register the user
  userController.register,
  // we need to log them
  authController.login,  //once user is registered, they are logged in
);

router.get('/logout', authController.logout);

router.get('/account', authController.isLoggedIn, userController.account);
router.post('/account', catchErrors(userController.updateAccount));
router.post('/account/forgot', catchErrors(authController.forgot));
router.get('/account/reset/:token', catchErrors(authController.reset));
router.post('/account/reset/:token',
  authController.confirmedPasswords,
  catchErrors(authController.update)
);
router.get('/map', storeController.mapPage);
router.get('/hearts', authController.isLoggedIn, catchErrors(storeController.getHearts));
router.post('/reviews/:id', authController.isLoggedIn, catchErrors(reviewController.addReview))

router.get('/top', catchErrors(storeController.getTopStores));
/*
  API
*/

router.get('/api/v1/search', catchErrors(storeController.searchStores));
router.get('/api/v1/stores/near', catchErrors(storeController.mapStores));
router.post('/api/v1/stores/:id/heart', catchErrors(storeController.heartStore));


module.exports = router;
