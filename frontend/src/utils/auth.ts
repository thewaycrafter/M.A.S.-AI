// Auth utility functions
export const getToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
};

export const getUser = (): any | null => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

export const isAuthenticated = (): boolean => {
    return !!getToken();
};

export const logout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/auth/login';
};

export const requireAuth = (callback: () => void) => {
    if (!isAuthenticated()) {
        window.location.href = '/auth/login';
        return;
    }
    callback();
};

export const checkRole = (requiredRoles: string[]): boolean => {
    const user = getUser();
    if (!user) return false;
    return requiredRoles.includes(user.role);
};
