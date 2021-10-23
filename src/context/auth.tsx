import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/api";


type User = {
    id: string;
    avatar_url: string;
    name: string;
    login: string;
}

type AuthContextData = {
    user: User | null;
    signInUrl: string;
    signOut: () => void;
}

type AuthResponse = {
    token: string;
    user: {
        id: string;
        avatar_url: string;
        name: string;
        login: string;
    }
}

type AuthProvider = {
    children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextData)

export function AuthProvider(props: AuthProvider) {

    const [user, setUser] = useState<User | null>(null);
    const signInUrl = `https://github.com/login/oauth/authorize?scope=user&client_id=46d008a50239d48bd3b8`;

    async function signIn(githubCode: string) {
        const response = await api.post<AuthResponse>('authenticate', {
            code: githubCode,
        })

        const { token, user } = response.data;
        localStorage.setItem('@verifUser: token', token);
        api.defaults.headers.common.authorization = `Bearer ${token}`;

        setUser(user);
    }

    function signOut() {
        setUser(null);
        localStorage.removeItem('@verifUser: token')
    }

    useEffect(() => {
        const token = localStorage.getItem('@verifUser: token');

        if (token) {
            api.defaults.headers.common.authorization = `Bearer ${token}`;
            api.get<User>('profile').then(response => {
                setUser(response.data)
            })
        }

    })

    useEffect(() => {
        const url = window.location.href;
        const hasGithubCode = url.includes('?code=');

        if (hasGithubCode) {
            const [urlWithoutCode, githubCode] = url.split('?code=');
            window.history.pushState({}, '', urlWithoutCode);

            signIn(githubCode)
        }
    }, []);

    return (
        <AuthContext.Provider value={{ signInUrl, user, signOut }}>
            {props.children}
        </AuthContext.Provider>
    );
}

