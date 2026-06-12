import { Request, Response, NextFunction } from 'express';
import * as vendorService from '../services/vendor.service';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

export async function getVendors(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as string;
    const search = req.query.search as string;
    const vendors = await vendorService.getAllVendors({ status, search });
    sendSuccess(res, vendors);
  } catch (err) {
    next(err);
  }
}

export async function getVendor(req: Request, res: Response, next: NextFunction) {
  try {
    const vendor = await vendorService.getVendor(req.params.id);
    sendSuccess(res, vendor);
  } catch (err) {
    next(err);
  }
}

export async function createVendor(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }
    const vendor = await vendorService.createVendor(req.body, userId);
    sendSuccess(res, vendor, 'Vendor created successfully');
  } catch (err) {
    next(err);
  }
}

export async function updateVendor(req: Request, res: Response, next: NextFunction) {
  try {
    const vendor = await vendorService.updateVendor(req.params.id, req.body);
    sendSuccess(res, vendor, 'Vendor updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function assessVendor(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }
    const result = await vendorService.assessVendorRisk(req.params.id, userId, req.body.notes);
    sendSuccess(res, result, 'Vendor risk assessment completed');
  } catch (err) {
    next(err);
  }
}
