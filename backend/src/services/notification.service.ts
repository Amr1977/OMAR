import { prisma } from '../config/database';
import { getIO } from './socket';
import { adminMessaging } from '../config/firebase-admin';

interface NotificationPayload {
  userId: string;
  type: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  data?: any;
}

const sendPushNotification = async (userId: string, payload: NotificationPayload) => {
  try {
    const tokens = await prisma.pushToken.findMany({ where: { userId }, select: { token: true } });
    if (tokens.length === 0) return;

    const registrationTokens = tokens.map(t => t.token);
    const message = {
      notification: {
        title: payload.titleAr,
        body: payload.bodyAr,
      },
      data: {
        type: payload.type,
        ...(payload.data ? Object.fromEntries(
          Object.entries(payload.data).map(([k, v]) => [k, String(v)])
        ) : {}),
      },
      tokens: registrationTokens,
    };

    const response = await adminMessaging.sendEachForMulticast(message);
    const invalidTokens: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error?.code === 'messaging/invalid-registration-token') {
        invalidTokens.push(registrationTokens[idx]);
      }
    });
    if (invalidTokens.length > 0) {
      await prisma.pushToken.deleteMany({ where: { token: { in: invalidTokens } } });
    }
  } catch (error) {
    console.error('Send push notification error:', error);
  }
};

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

    const io = getIO();
    if (io) {
      io.to(`user:${payload.userId}`).emit('new_notification', notification);
    }

    sendPushNotification(payload.userId, payload);

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
  }
};

export const notifyContactRequest = async (receiverId: string, senderName: string, senderId?: string) => {
  return createNotification({
    userId: receiverId,
    type: 'contact_request',
    titleAr: 'طلب تواصل جديد',
    titleEn: 'New Contact Request',
    bodyAr: `لديك طلب تواصل جديد من ${senderName}`,
    bodyEn: `You have a new contact request from ${senderName}`,
    data: { senderName, senderId },
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
    data: { receiverName },
  });
};

export const notifyNewMessage = async (userId: string, senderName: string, conversationId: string) => {
  return createNotification({
    userId,
    type: 'new_message',
    titleAr: 'رسالة جديدة',
    titleEn: 'New Message',
    bodyAr: `رسالة جديدة من ${senderName}`,
    bodyEn: `New message from ${senderName}`,
    data: { senderName, conversationId },
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

export const notifyProfileView = async (profileOwnerId: string, viewerName: string) => {
  return createNotification({
    userId: profileOwnerId,
    type: 'profile_view',
    titleAr: 'تمت مشاهدة ملفك',
    titleEn: 'Profile Viewed',
    bodyAr: `تمت مشاهدة ملفك الشخصي بواسطة ${viewerName}`,
    bodyEn: `Your profile was viewed by ${viewerName}`,
    data: { viewerName },
  });
};

export const notifyPostLike = async (postOwnerId: string, likerName: string, postId: string) => {
  return createNotification({
    userId: postOwnerId,
    type: 'post_like',
    titleAr: 'إعجاب بمنشورك',
    titleEn: 'Post Liked',
    bodyAr: `أعجب ${likerName} بمنشورك`,
    bodyEn: `${likerName} liked your post`,
    data: { likerName, postId },
  });
};

export const notifyPostComment = async (postOwnerId: string, commenterName: string, postId: string) => {
  return createNotification({
    userId: postOwnerId,
    type: 'post_comment',
    titleAr: 'تعليق على منشورك',
    titleEn: 'New Comment',
    bodyAr: `علق ${commenterName} على منشورك`,
    bodyEn: `${commenterName} commented on your post`,
    data: { commenterName, postId },
  });
};

export const notifyNewFollower = async (followedUserId: string, followerName: string) => {
  return createNotification({
    userId: followedUserId,
    type: 'new_follower',
    titleAr: 'متابع جديد',
    titleEn: 'New Follower',
    bodyAr: `بدأ ${followerName} بمتابعتك`,
    bodyEn: `${followerName} started following you`,
    data: { followerName },
  });
};

export const notifyNewOrder = async (storeOwnerId: string, buyerEmail: string, orderId: string, total: number) => {
  return createNotification({
    userId: storeOwnerId,
    type: 'new_order',
    titleAr: 'طلب جديد',
    titleEn: 'New Order',
    bodyAr: `لديك طلب جديد بقيمة ${total} جنيه من ${buyerEmail}`,
    bodyEn: `New order for ${total} EGP from ${buyerEmail}`,
    data: { orderId, total, buyerEmail },
  });
};

export const notifyOrderStatusChanged = async (buyerId: string, storeName: string, orderId: string, status: string) => {
  const statusAr: Record<string, string> = { CONFIRMED: 'مؤكد', SHIPPED: 'تم الشحن', DELIVERED: 'تم التوصيل', CANCELLED: 'ملغي' };
  const statusEn: Record<string, string> = { CONFIRMED: 'confirmed', SHIPPED: 'shipped', DELIVERED: 'delivered', CANCELLED: 'cancelled' };
  return createNotification({
    userId: buyerId,
    type: 'order_status',
    titleAr: 'تحديث حالة الطلب',
    titleEn: 'Order Update',
    bodyAr: `تم تغيير حالة طلبك من متجر ${storeName} إلى: ${statusAr[status] || status}`,
    bodyEn: `Your order from ${storeName} has been ${statusEn[status] || status}`,
    data: { orderId, status },
  });
};
