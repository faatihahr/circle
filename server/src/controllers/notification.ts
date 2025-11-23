import type { Request, Response } from 'express';
import prisma from '../connection/client.js';

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  const userId = parseInt(req.user?.userId || '0');
  const { page = '1', limit = '20' } = req.query;

  const pageNum = parseInt(page.toString(), 10);
  const limitNum = parseInt(limit.toString(), 10);
  const offset = (pageNum - 1) * limitNum;

  const notifications = await prisma.notifications.findMany({
    where: { user_id: userId },
    include: {
      user: { select: { username: true, name: true, profilePicture: true } }
    },
    orderBy: { created_at: 'desc' },
    skip: offset,
    take: limitNum
  });

  const total = await prisma.notifications.count({
    where: { user_id: userId }
  });

  const unreadCount = await prisma.notifications.count({
    where: { user_id: userId, is_read: false }
  });

  res.json({
    code: 200,
    status: "success",
    message: "Notifications fetched successfully",
    data: {
      notifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      },
      unreadCount
    }
  });
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  const userId = parseInt(req.user?.userId || '0');
  const { id } = req.params;

  if (!id || isNaN(Number(id))) {
    const idError = new Error('Invalid notification id');
    (idError as any).status = 400;
    throw idError;
  }

  const notification = await prisma.notifications.findUnique({
    where: { id: parseInt(id) }
  });

  if (!notification) {
    const notFoundError = new Error('Notification not found');
    (notFoundError as any).status = 404;
    throw notFoundError;
  }

  if (notification.user_id !== userId) {
    const authError = new Error('Not authorized');
    (authError as any).status = 403;
    throw authError;
  }

  await prisma.notifications.update({
    where: { id: parseInt(id) },
    data: { is_read: true }
  });

  res.json({
    code: 200,
    status: "success",
    message: "Notification marked as read"
  });
};

export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  const userId = parseInt(req.user?.userId || '0');

  await prisma.notifications.updateMany({
    where: { user_id: userId, is_read: false },
    data: { is_read: true }
  });

  res.json({
    code: 200,
    status: "success",
    message: "All notifications marked as read"
  });
};

export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  const userId = parseInt(req.user?.userId || '0');
  const { id } = req.params;

  if (!id || isNaN(Number(id))) {
    const idError = new Error('Invalid notification id');
    (idError as any).status = 400;
    throw idError;
  }

  const notification = await prisma.notifications.findUnique({
    where: { id: parseInt(id) }
  });

  if (!notification) {
    const notFoundError = new Error('Notification not found');
    (notFoundError as any).status = 404;
    throw notFoundError;
  }

  if (notification.user_id !== userId) {
    const authError = new Error('Not authorized');
    (authError as any).status = 403;
    throw authError;
  }

  await prisma.notifications.delete({
    where: { id: parseInt(id) }
  });

  res.json({
    code: 200,
    status: "success",
    message: "Notification deleted successfully"
  });
};
