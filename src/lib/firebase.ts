const isFirebaseConfigured = false;

export { isFirebaseConfigured };

// Fallback password authentication using localStorage so the app works on Netlify without Firebase.
export const localAuth = {
  signUp: async (email: string, pass: string) => {
    const users = JSON.parse(localStorage.getItem('local_users') || '{}');
    if (!users['samdonckels@gmail.com']) {
      users['samdonckels@gmail.com'] = 'Doing4ever!';
    }
    if (users[email]) {
      throw new Error('User already exists!');
    }
    users[email] = pass;
    localStorage.setItem('local_users', JSON.stringify(users));
    return { email };
  },
  signIn: async (email: string, pass: string) => {
    const users = JSON.parse(localStorage.getItem('local_users') || '{}');
    if (!users['samdonckels@gmail.com']) {
      users['samdonckels@gmail.com'] = 'Doing4ever!';
      localStorage.setItem('local_users', JSON.stringify(users));
    }
    if (!users[email] || users[email] !== pass) {
      throw new Error('Invalid email or password.');
    }
    return { email };
  }
};
