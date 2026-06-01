import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase';
import { api } from './api';
import { useAuthStore } from '../stores/authStore';

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

export const signInWithGoogle = async (role?: string) => {
  const result = await signInWithPopup(auth, provider);
  const firebaseUser = result.user;

  const res: any = await api.post('/auth/register', {
    firebaseUid: firebaseUser.uid,
    email: firebaseUser.email,
    role: role || 'GROOM',
  });

  const userData = await api.auth.getMe();
  localStorage.setItem('auth_token', res.accessToken);
  useAuthStore.getState().login(res.accessToken, userData);

  return userData;
};
