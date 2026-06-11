import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    profile: {
      update: vi.fn(),
    },
    adminLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock('../config/firebase-admin', () => ({
  adminMessaging: { sendEachForMulticast: vi.fn() },
}));

import { prisma } from '../config/database';

const mockReq = (overrides: any = {}) => ({
  userId: 'admin-1',
  body: {},
  params: {},
  ...overrides,
});

const mockRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

function mockUser(overrides = {}): any {
  return {
    id: 'user-1',
    firebaseUid: 'firebase-uid-1',
    email: 'test@example.com',
    phone: '+201234567890',
    roles: ['SOCIAL'],
    subscriptionPlan: 'FREE' as any,
    subscriptionExpiry: null,
    isVerified: false,
    isActive: true,
    isBanned: false,
    language: 'ar',
    averageRating: null,
    reviewCount: 0,
    isVerifiedSeller: false,
    bio: null,
    tagline: null,
    websiteUrl: null,
    avatarUrl: null,
    lastSeenAt: null,
    isOnline: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    profile: {
      id: 'profile-1',
      displayName: 'Test User',
      status: 'APPROVED',
    },
    ...overrides,
  };
}

describe('updateUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 404 when user not found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const { updateUser } = await import('../modules/admin/admin.controller');
    const req = mockReq({ params: { id: 'nonexistent' } });
    const res = mockRes();

    await updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'NOT_FOUND' })
    );
  });

  it('updates email and phone fields', async () => {
    const existingUser = mockUser();
    const updatedUser = {
      ...existingUser,
      email: 'new@example.com',
      phone: '+201111111111',
    };
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(existingUser)
      .mockResolvedValueOnce(updatedUser);
    vi.mocked(prisma.user.update).mockResolvedValue(updatedUser);
    vi.mocked(prisma.adminLog.create).mockResolvedValue({} as any);

    const { updateUser } = await import('../modules/admin/admin.controller');
    const req = mockReq({
      params: { id: 'user-1' },
      body: { email: 'new@example.com', phone: '+201111111111' },
    });
    const res = mockRes();

    await updateUser(req, res);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          email: 'new@example.com',
          phone: '+201111111111',
        }),
      })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new@example.com',
        phone: '+201111111111',
      })
    );
  });

  it('toggles roles including ADMIN', async () => {
    const existingUser = mockUser({ roles: ['SOCIAL'] });
    const updatedUser = { ...existingUser, roles: ['SOCIAL', 'ADMIN'] };
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(existingUser)
      .mockResolvedValueOnce(updatedUser);
    vi.mocked(prisma.user.update).mockResolvedValue(updatedUser);
    vi.mocked(prisma.adminLog.create).mockResolvedValue({} as any);

    const { updateUser } = await import('../modules/admin/admin.controller');
    const req = mockReq({
      params: { id: 'user-1' },
      body: { roles: ['SOCIAL', 'ADMIN'] },
    });
    const res = mockRes();

    await updateUser(req, res);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          roles: ['SOCIAL', 'ADMIN'],
        }),
      })
    );
  });

  it('toggles isVerified and isActive flags', async () => {
    const existingUser = mockUser({ isVerified: false, isActive: true });
    const updatedUser = { ...existingUser, isVerified: true, isActive: false };
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(existingUser)
      .mockResolvedValueOnce(updatedUser);
    vi.mocked(prisma.user.update).mockResolvedValue(updatedUser);
    vi.mocked(prisma.adminLog.create).mockResolvedValue({} as any);

    const { updateUser } = await import('../modules/admin/admin.controller');
    const req = mockReq({
      params: { id: 'user-1' },
      body: { isVerified: true, isActive: false },
    });
    const res = mockRes();

    await updateUser(req, res);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isVerified: true,
          isActive: false,
        }),
      })
    );
  });

  it('toggles isBanned flag', async () => {
    const existingUser = mockUser({ isBanned: false });
    const updatedUser = { ...existingUser, isBanned: true };
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(existingUser)
      .mockResolvedValueOnce(updatedUser);
    vi.mocked(prisma.user.update).mockResolvedValue(updatedUser);
    vi.mocked(prisma.adminLog.create).mockResolvedValue({} as any);

    const { updateUser } = await import('../modules/admin/admin.controller');
    const req = mockReq({
      params: { id: 'user-1' },
      body: { isBanned: true },
    });
    const res = mockRes();

    await updateUser(req, res);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isBanned: true }),
      })
    );
  });

  it('updates profile fields when profile exists', async () => {
    const existingUser = mockUser();
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(existingUser)
      .mockResolvedValueOnce(existingUser);
    vi.mocked(prisma.user.update).mockResolvedValue(existingUser);
    vi.mocked(prisma.profile.update).mockResolvedValue({} as any);
    vi.mocked(prisma.adminLog.create).mockResolvedValue({} as any);

    const { updateUser } = await import('../modules/admin/admin.controller');
    const req = mockReq({
      params: { id: 'user-1' },
      body: {
        profile: {
          displayName: 'New Name',
          bio: 'New bio',
          tagline: 'New tagline',
          websiteUrl: 'https://example.com',
        },
      },
    });
    const res = mockRes();

    await updateUser(req, res);

    expect(prisma.profile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'profile-1' },
        data: expect.objectContaining({
          displayName: 'New Name',
          bio: 'New bio',
          tagline: 'New tagline',
          websiteUrl: 'https://example.com',
        }),
      })
    );
  });

  it('skips profile update when user has no profile', async () => {
    const existingUser = mockUser({ profile: null });
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(existingUser)
      .mockResolvedValueOnce(existingUser);
    vi.mocked(prisma.user.update).mockResolvedValue(existingUser);
    vi.mocked(prisma.adminLog.create).mockResolvedValue({} as any);

    const { updateUser } = await import('../modules/admin/admin.controller');
    const req = mockReq({
      params: { id: 'user-1' },
      body: { profile: { displayName: 'New Name' } },
    });
    const res = mockRes();

    await updateUser(req, res);

    expect(prisma.profile.update).not.toHaveBeenCalled();
  });

  it('creates an AdminLog entry on successful update', async () => {
    const existingUser = mockUser();
    const updatedUser = { ...existingUser, email: 'updated@example.com' };
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(existingUser)
      .mockResolvedValueOnce(updatedUser);
    vi.mocked(prisma.user.update).mockResolvedValue(updatedUser);
    vi.mocked(prisma.adminLog.create).mockResolvedValue({} as any);

    const { updateUser } = await import('../modules/admin/admin.controller');
    const req = mockReq({
      params: { id: 'user-1' },
      body: { email: 'updated@example.com', isVerified: true },
    });
    const res = mockRes();

    await updateUser(req, res);

    expect(prisma.adminLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          adminId: 'admin-1',
          action: 'UPDATE_USER',
          targetId: 'user-1',
          details: expect.objectContaining({
            updated: expect.arrayContaining(['email', 'isVerified']),
          }),
        }),
      })
    );
  });

  it('returns 500 on unexpected error', async () => {
    vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error('DB error'));

    const { updateUser } = await import('../modules/admin/admin.controller');
    const req = mockReq({ params: { id: 'user-1' } });
    const res = mockRes();

    await updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'INTERNAL' })
    );
  });
});

describe('createUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when firebaseUid is missing', async () => {
    const { createUser } = await import('../modules/admin/admin.controller');
    const req = mockReq({ body: {} });
    const res = mockRes();

    await createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'VALIDATION' })
    );
  });

  it('returns 409 when firebaseUid already exists', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser());

    const { createUser } = await import('../modules/admin/admin.controller');
    const req = mockReq({
      body: { firebaseUid: 'firebase-uid-1' },
    });
    const res = mockRes();

    await createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'CONFLICT' })
    );
  });

  it('creates a user with default values', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const createdUser = mockUser({
      firebaseUid: 'new-firebase-uid',
      email: 'new@example.com',
      roles: ['SOCIAL'],
      subscriptionPlan: 'FREE',
      isVerified: false,
    });
    vi.mocked(prisma.user.create).mockResolvedValue(createdUser as any);
    vi.mocked(prisma.adminLog.create).mockResolvedValue({} as any);

    const { createUser } = await import('../modules/admin/admin.controller');
    const req = mockReq({
      body: {
        firebaseUid: 'new-firebase-uid',
        email: 'new@example.com',
      },
    });
    const res = mockRes();

    await createUser(req, res);

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          firebaseUid: 'new-firebase-uid',
          email: 'new@example.com',
          roles: ['SOCIAL'],
          subscriptionPlan: 'FREE',
          isVerified: false,
        }),
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('creates a user with custom roles and subscription', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const createdUser = mockUser({
      firebaseUid: 'another-uid',
      email: 'admin@example.com',
      roles: ['SOCIAL', 'ADMIN'],
      subscriptionPlan: 'PREMIUM',
      isVerified: true,
    });
    vi.mocked(prisma.user.create).mockResolvedValue(createdUser as any);
    vi.mocked(prisma.adminLog.create).mockResolvedValue({} as any);

    const { createUser } = await import('../modules/admin/admin.controller');
    const req = mockReq({
      body: {
        firebaseUid: 'another-uid',
        email: 'admin@example.com',
        phone: '+201234567890',
        roles: ['SOCIAL', 'ADMIN'],
        subscriptionPlan: 'PREMIUM',
        isVerified: true,
      },
    });
    const res = mockRes();

    await createUser(req, res);

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          firebaseUid: 'another-uid',
          roles: ['SOCIAL', 'ADMIN'],
          subscriptionPlan: 'PREMIUM',
          isVerified: true,
        }),
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('creates an AdminLog entry on successful creation', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const newUser = mockUser({ firebaseUid: 'log-test-uid' });
    vi.mocked(prisma.user.create).mockResolvedValue(newUser as any);
    vi.mocked(prisma.adminLog.create).mockResolvedValue({} as any);

    const { createUser } = await import('../modules/admin/admin.controller');
    const req = mockReq({
      body: { firebaseUid: 'log-test-uid' },
    });
    const res = mockRes();

    await createUser(req, res);

    expect(prisma.adminLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          adminId: 'admin-1',
          action: 'CREATE_USER',
          targetId: 'user-1',
        }),
      })
    );
  });

  it('returns 500 on unexpected error', async () => {
    vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error('DB error'));

    const { createUser } = await import('../modules/admin/admin.controller');
    const req = mockReq({
      body: { firebaseUid: 'error-uid' },
    });
    const res = mockRes();

    await createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'INTERNAL' })
    );
  });
});
