import express from 'express';
import {
  checkToken,
  userDeleteCurrent,
  userGet,
  userListGet,
  userPost,
  userPutCurrent,
} from '../controllers/userController';
import passport from '../../passport';
import {body, param, query} from 'express-validator';

const router = express.Router();

// TODO: add validation

router
  .route('/')
  .get(userListGet)
  .post(
    body('user_name').notEmpty().isString().escape(),
    body('email').notEmpty().isString().escape(),
    body('password').notEmpty().isString().escape(),
    userPost
  )
  .put(
    passport.authenticate('jwt', {session: false}),
    body('user_name').isString().escape(),
    userPutCurrent
  )
  .delete(passport.authenticate('jwt', {session: false}), userDeleteCurrent);

router.get(
  '/token',
  passport.authenticate('jwt', {session: false}),
  checkToken
);

router.route('/:id').get(userGet);

export default router;
