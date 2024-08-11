import { IUser } from "@/app/authentification/interfaces";
import { getPrisma } from "@/app/backend/prismadb";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials";
import { retrieveUserServerSide, sanitizeUser } from "../../users/[slug]/server-users";

const VERSION = "0.1.0"

async function authenticateJWTAndGet(username: string, password: string) {
    let user
    try {
        user = await getPrisma().user.findUnique({
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
        })
    } catch (ex) {
        console.log("Login failed:")
        console.log(ex)
    }

    if (user != undefined && user.password == password) {
        return sanitizeUser(user)
    } else {
        return undefined
    }
}


const prodivers: any[] = [
    CredentialsProvider({
        // The name to display on the sign in form (e.g. 'Sign in with...')
        name: 'Credentials',
        // The credentials is used to generate a suitable form on the sign in page.
        // You can specify whatever fields you are expecting to be submitted.
        // e.g. domain, username, password, 2FA token, etc.
        // You can pass any HTML attribute to the <input> tag through the object.
        credentials: {
            username: { label: "Username", type: "text" },
            password: { label: "Password", type: "password" }
        },
        async authorize(credentials: any, req: any): Promise<any> {
            const { username, password } = credentials as {
                username: string,
                password: string,
            };

            return await authenticateJWTAndGet(username, password)
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
            // Persist the OAuth access_token and or the user id to the token right after signin
            if (user) {
                //token.accessToken = account.access_token;
                token.user = user
            } else {
                const registeredUser: IUser | undefined = await retrieveUserServerSide(token.user?.id)
                if (registeredUser == undefined) {
                    return undefined // user no longer exists
                } else {
                    token.user = registeredUser
                }
            }

            return token;
        },

        async session({ session, token, user }: any) {
            // Send properties to the client, like an access_token and user id from a provider.
            //session.accessToken = token.accessToken;
            session.user = token.user
            session.version = VERSION
            return session
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
}