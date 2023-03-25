import bcrypt from 'bcryptjs';
import {NextFunction, Response, Request} from 'express';
import {validationResult} from 'express-validator';
import CustomError from '../../classes/CustomError';
import DBMessageResponse from '../../interfaces/DBMessageResponse';
import {User} from '../../interfaces/User';
import userModel from '../models/userModel';
// TODO: create the following functions:
// - userGet - get user by id
// - userListGet - get all users
// - userPost - create new user. Remember to hash password
// - userPutCurrent - update current user
// - userDeleteCurrent - delete current user
// - checkToken - check if current user token is valid: return data from req.user. No need for database query

const salt = bcrypt.genSaltSync(12);
const userGet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const message = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      throw new CustomError(message, 400);
    }

    const user = await userModel
      .findById(req.params.id)
      .select('-password -role');
    if (!user) {
      next(new CustomError('User not found', 404));
    }
    res.json(user);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

const userListGet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await userModel.find().select('-password -role');
    if (!users) {
      next(new CustomError('Users not found', 404));
      return;
    }
    res.json(users);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

const userPost = async (
  req: Request<{}, {}, User>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const message = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      throw new CustomError(message, 400);
    }

    req.body.password = bcrypt.hashSync(req.body.password, salt);
    const createUser = await userModel.create(req.body);
    const {password, role, ...userData} = createUser.toJSON();
    const output: DBMessageResponse = {
      message: 'User created',
      data: userData,
    };
    res.json(output);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

const userPutCurrent = async (
  req: Request<{}, {}, User>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const message = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      throw new CustomError(message, 400);
    }

    const currentUser = req.user as User;
    const user = req.body;

    if (user.password) {
      user.password = bcrypt.hashSync(user.password, salt);
    }

    const updatedUser = await userModel
      .findByIdAndUpdate(currentUser._id, user, {new: true})
      .select('-password -role');

    if (!updatedUser) {
      next(new CustomError('User not found', 404));
      return;
    }

    const output: DBMessageResponse = {
      message: 'User updated',
      data: updatedUser,
    };
    res.json(output);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

const userDeleteCurrent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const message = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      throw new CustomError(message, 400);
    }

    const currentUser = req.user as User;
    const deletedUser = await userModel
      .findByIdAndDelete(currentUser._id)
      .select('-password -role');
    if (!deletedUser) {
      next(new CustomError('User not found', 404));
      return;
    }

    const output: DBMessageResponse = {
      message: 'User deleted',
      data: deletedUser,
    };
    res.json(output);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

const checkToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      throw new CustomError(messages, 400);
    }

    const user = req.user as User;
    const userObj = {
      _id: user._id,
      user_name: user.user_name,
      email: user.email,
    };
    res.json(userObj);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

export {
  userGet,
  userListGet,
  userPost,
  userPutCurrent,
  userDeleteCurrent,
  checkToken,
};
