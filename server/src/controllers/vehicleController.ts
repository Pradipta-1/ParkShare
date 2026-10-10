import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbStore } from '../store/dbStore.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { Vehicle } from '../models/types.js';

export const getVehicles = (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const vehicles = dbStore.vehicles.filter((v) => v.userId === user.id);
  res.json({ success: true, count: vehicles.length, data: vehicles });
};

export const addVehicle = (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const { numberPlate, brand, model, color, type = 'Car', isDefault = false } = req.body;

  if (!numberPlate || !brand || !model) {
    res.status(400).json({ success: false, message: 'Number plate, brand and model are required' });
    return;
  }

  if (isDefault) {
    dbStore.vehicles
      .filter((v) => v.userId === user.id)
      .forEach((v) => {
        v.isDefault = false;
      });
  }

  const newVehicle: Vehicle = {
    id: `veh_${uuidv4().substring(0, 8)}`,
    userId: user.id,
    numberPlate: numberPlate.toUpperCase(),
    brand,
    model,
    color: color || 'Silver',
    type,
    isDefault,
  };

  dbStore.vehicles.push(newVehicle);

  res.status(201).json({
    success: true,
    message: 'Vehicle added to your garage',
    data: newVehicle,
  });
};

export const deleteVehicle = (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const index = dbStore.vehicles.findIndex((v) => v.id === id);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'Vehicle not found' });
    return;
  }

  dbStore.vehicles.splice(index, 1);
  res.json({ success: true, message: 'Vehicle removed from garage' });
};
