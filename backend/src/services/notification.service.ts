import { prisma } from '../config/database';

interface NotificationPayload {
  userId: string;
  type: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  data?: any;
}

export const createNotification = async (payload: NotificationPayload) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        titleAr: payload.titleAr,
        titleEn: payload.titleEn,
        bodyAr: payload.bodyAr,
        bodyEn: payload.bodyEn,
        data: payload.data || {},
      },
    });
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
  }
};

export const notifyContactRequest = async (receiverId: string, senderName: string) => {
  return createNotification({
    userId: receiverId,
    type: 'contact_request',
    titleAr: 'طلب تواصل جديد',
    titleEn: 'New Contact Request',
    bodyAr: `لديك طلب تواصل جديد من ${senderName}`,
    bodyEn: `You have a new contact request from ${senderName}`,
  });
};

export const notifyRequestAccepted = async (senderId: string, receiverName: string) => {
  return createNotification({
    userId: senderId,
    type: 'request_accepted',
    titleAr: 'تم قبول طلب التواصل',
    titleEn: 'Contact Request Accepted',
    bodyAr: `تم قبول طلب التواصل من ${receiverName}`,
    bodyEn: `Your contact request was accepted by ${receiverName}`,
  });
};

export const notifyNewMessage = async (userId: string, senderName: string) => {
  return createNotification({
    userId,
    type: 'new_message',
    titleAr: 'رسالة جديدة',
    titleEn: 'New Message',
    bodyAr: `رسالة جديدة من ${senderName}`,
    bodyEn: `New message from ${senderName}`,
  });
};

export const notifyProfileApproved = async (userId: string) => {
  return createNotification({
    userId,
    type: 'profile_approved',
    titleAr: 'تم اعتماد الملف الشخصي',
    titleEn: 'Profile Approved',
    bodyAr: 'تم اعتماد ملفك الشخصي وأصبح متاحاً للعرض',
    bodyEn: 'Your profile has been approved and is now visible',
  });
};

export const notifyProfileRejected = async (userId: string, reason: string) => {
  return createNotification({
    userId,
    type: 'profile_rejected',
    titleAr: 'لم يتم اعتماد الملف الشخصي',
    titleEn: 'Profile Not Approved',
    bodyAr: `لم يتم اعتماد ملفك الشخصي: ${reason}`,
    bodyEn: `Your profile was not approved: ${reason}`,
  });
};
