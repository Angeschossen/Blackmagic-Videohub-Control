import { IUser } from "@/app/authentification/interfaces";
import { getPrisma } from "@/app/backend/prismadb";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials";
import { retrieveUserServerSide, sanitizeUser } from "../../users/[[...slug]]/server-users";

const VERSION = "0.1.0"

async function authUserWithPassword(username: string, password: string): Promise<IUser | undefined> {
    return await getPrisma().user.findUnique({
        where: {
            username: username,
        },
        include: {
            role: {
                include: {
                    permissions: true,
                }
            }
        }
    }).then(user => {
        if (user != undefined && user.password === password) {
            return sanitizeUser(user);
        } else {
            return undefined;
        }
    });
}


const prodivers: any[] = [
    CredentialsProvider({
        name: 'Credentials',
        credentials: {
            username: { label: "Username", type: "text" },
            password: { label: "Password", type: "password" }
        },
        async authorize(credentials, _req): Promise<any> {
            const { username, password } = credentials as {
                username: string,
                password: string,
            };

            return await authUserWithPassword(username, password)
        }
    })
];

export const authOptions: NextAuthOptions = {
    providers: prodivers,
    session: {
        strategy: "jwt"
    },
    adapter: PrismaAdapter(getPrisma()),
    callbacks: {
async jwt({ token, user, account, profile, isNewUser }: any) {
    if (user != undefined) {
        token.user = user; // Der Benuter ist bereits authentifiziert.
    } else {
        const registeredUser: IUser | undefined = await retrieveUserServerSide(token.user?.id);
        if (registeredUser == undefined) {
            return undefined; // Der Benutzer existiert nicht mehr.
        } else {
            token.user = registeredUser; // Dem Token werden die Informationen angehängt.
        }
    }

    return token;
},

        async session({ session, token, user }: any) {
            // Send properties to the client, like an access_token and user id from a provider.
            session.user = token.user;
            session.version = VERSION;
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
}