import { auth } from './firebase';
import { linkWithCredential, EmailAuthProvider } from 'firebase/auth';

const test = () => {
  linkWithCredential(auth.currentUser!, EmailAuthProvider.credential('test@test.com', 'password'));
};
