/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
declare const __APP_COMMIT__: string;
declare const __APP_DATE__: string;

declare module 'firebase/app' {
  export function initializeApp(config: any, name?: string): any;
  export type FirebaseApp = any;
}
declare module 'firebase/auth' {
  export function getAuth(app?: any): any;
  export function signInWithEmailAndPassword(auth: any, email: string, password: string): Promise<any>;
  export function createUserWithEmailAndPassword(auth: any, email: string, password: string): Promise<any>;
  export function signInWithPopup(auth: any, provider: any): Promise<any>;
  export function onAuthStateChanged(auth: any, nextOrObserver: any, error?: any, completed?: any): any;
  export function signOut(auth: any): Promise<void>;
  export class GoogleAuthProvider {
    static PROVIDER_ID: string;
    constructor();
    setCustomParameters(params: Record<string, string>): void;
    addScope(scope: string): void;
  }
}
declare module 'firebase/firestore' {
  export function getFirestore(app?: any): any;
}
declare module 'firebase/storage' {
  export function getStorage(app?: any, url?: string): any;
}
declare module 'firebase/analytics' {
  export function getAnalytics(app?: any): any;
}
declare module 'firebase/messaging' {
  export function getMessaging(app?: any): any;
  export function getToken(messaging: any, options?: any): Promise<string>;
  export function onMessage(messaging: any, handler: any): any;
}
