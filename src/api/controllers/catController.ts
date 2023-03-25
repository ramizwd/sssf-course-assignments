import {validationResult} from 'express-validator';
import {NextFunction, Request, Response} from 'express';
import CustomError from '../../classes/CustomError';
import catModel from '../models/catModel';
import {User} from '../../interfaces/User';
import DBMessageResponse from '../../interfaces/DBMessageResponse';
import rectangleBounds from '../../utils/rectangleBounds';
import {Cat} from '../../interfaces/Cat';

// TODO: create following functions:
// - catGetByUser - get all cats by current user id
// - catGetByBoundingBox - get all cats by bounding box coordinates (getJSON)
// - catPutAdmin - only admin can change cat owner
// - catDeleteAdmin - only admin can delete cat
// - catDelete - only owner can delete cat
// - catPut - only owner can update cat
// - catGet - get cat by id
// - catListGet - get all cats
// - catPost - create new cat

const catGetByUser = async (
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
    const cats = await catModel
      .find({owner: currentUser._id})
      .populate('owner', 'user_name email');

    if (!cats) {
      next(new CustomError('Cats not found', 404));
      return;
    }
    res.json(cats);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

const catGetByBoundingBox = async (
  req: Request<{}, {}, {}, {topRight: string; bottomLeft: string}>,
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

    const {topRight, bottomLeft} = req.query;
    const [trLat, trLng] = topRight.split(',');
    const [blLat, blLng] = bottomLeft.split(',');
    const bounds = rectangleBounds(
      {lat: trLat, lng: trLng},
      {lat: blLat, lng: blLng}
    );

    const catsList = await catModel.find({
      location: {
        $geoWithin: {$geometry: bounds},
      },
    });

    if (!catsList) {
      next(new CustomError('Cats not found', 404));
      return;
    }

    res.json(catsList);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

const catPutAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const message = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      throw new CustomError(message, 400);
    }

    const currUser = req.user as User;
    if (currUser.role !== 'admin') {
      throw new CustomError('Admin only', 401);
    }

    const cat = await catModel
      .findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      })
      .select('-__v');

    if (!cat) {
      next(new CustomError('Cat not found', 404));
      return;
    }

    const output: DBMessageResponse = {
      message: 'Cat owner updated',
      data: cat,
    };
    res.json(output);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

const catDeleteAdmin = async (
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

    const currUser = req.user as User;
    if (currUser.role !== 'admin') {
      throw new CustomError('Admin only', 401);
    }

    const cat = await catModel.findByIdAndDelete(req.params.id);
    if (!cat) {
      next(new CustomError('Cat not found', 404));
      return;
    }
    const output: DBMessageResponse = {
      message: 'Cat deleted',
      data: cat,
    };
    res.json(output);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

const catDelete = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const message = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      throw new CustomError(message, 400);
    }

    const cat = await catModel.findById(req.params.id);

    if (!cat) {
      next(new CustomError('Cat not found', 404));
      return;
    }

    const currUser = req.user as User;
    if (cat?.owner._id.toString() !== currUser._id.toString()) {
      next(new CustomError('Unauthorized access', 401));
      return;
    }

    const deleteCat = await catModel
      .findByIdAndDelete(req.params.id)
      .select('-__v');
    if (!deleteCat) {
      next(new CustomError('Cat not found', 404));
      return;
    }

    const output: DBMessageResponse = {
      message: 'Cat deleted',
      data: deleteCat,
    };
    res.json(output);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

const catPut = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const message = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      throw new CustomError(message, 400);
    }

    const cat = await catModel.findById(req.params.id);

    if (!cat) {
      next(new CustomError('Cat not found', 404));
      return;
    }

    const currUser = req.user as User;
    if (cat?.owner._id.toString() !== currUser._id.toString()) {
      next(new CustomError('Unauthorized access', 401));
      return;
    }

    const updatedCat = await catModel
      .findByIdAndUpdate(req.params.id, req.body, {new: true})
      .select('-__v');

    if (!updatedCat) {
      next(new CustomError('Cat not found', 404));
      return;
    }

    const output: DBMessageResponse = {
      message: 'Cat updated',
      data: updatedCat,
    };
    res.json(output);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

const catGet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const message = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      throw new CustomError(message, 400);
    }

    const cat = await catModel
      .findById(req.params.id)
      .populate('owner', 'user_name email');
    if (!cat) {
      next(new CustomError('Cat not found', 404));
      return;
    }

    res.json(cat);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

const catListGet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const message = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      throw new CustomError(message, 400);
    }

    const catList = await catModel.find().populate('owner', 'user_name email');

    if (!catList) {
      next(new CustomError('Cats not found', 404));
      return;
    }

    res.json(catList);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

const catPost = async (
  req: Request<{}, {}, Cat>,
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

    const user = req.user as User;
    req.body.filename = <string>req.file?.filename;
    req.body.location = res.locals.coords;
    req.body.owner = user._id;

    const cat = await catModel.create(req.body);
    const output: DBMessageResponse = {
      message: 'Cat created',
      data: cat,
    };
    res.json(output);
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
};

export {
  catGetByUser,
  catDeleteAdmin,
  catDelete,
  catPut,
  catGet,
  catListGet,
  catPost,
  catPutAdmin,
  catGetByBoundingBox,
};
