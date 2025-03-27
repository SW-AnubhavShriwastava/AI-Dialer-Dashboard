import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { db } from "@/lib/db"
import bcrypt, { compare } from "bcrypt"
import { User, UserRole, UserStatus } from "@prisma/client"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email
          },
          include: {
            employeeProfile: true
          }
        })

        if (!user) {
          return null
        }

        // Check if user is active
        if (user.status !== UserStatus.ACTIVE) {
          throw new Error("Account is not active")
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || "",
          username: user.username,
          role: user.role,
          status: user.status,
          employeeProfile: user.employeeProfile
        }
      }
    })
  ],
  callbacks: {
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.email = token.email as string
        session.user.username = token.username as string
        session.user.role = token.role as UserRole
        session.user.status = token.status as UserStatus
        session.user.employeeProfile = token.employeeProfile as any
      }

      return session
    },
    async jwt({ token, user }) {
      const dbUser = await db.user.findFirst({
        where: {
          email: token.email!,
        },
        include: {
          employeeProfile: true
        }
      })

      if (!dbUser) {
        if (user) {
          token.id = user?.id
          token.username = (user as any).username
          token.role = (user as any).role
          token.status = (user as any).status
          token.employeeProfile = (user as any).employeeProfile
        }
        return token
      }

      return {
        id: dbUser.id,
        name: dbUser.name || "",
        email: dbUser.email,
        username: dbUser.username,
        role: dbUser.role,
        status: dbUser.status,
        employeeProfile: dbUser.employeeProfile
      }
    }
  }
}

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function createUser(data: {
  name: string
  email: string
  username: string
  password: string
}) {
  const hashedPassword = await hashPassword(data.password)

  const user = await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      username: data.username,
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: new Date(),
    },
  })

  // Create admin settings
  await db.adminSettings.create({
    data: {
      adminId: user.id,
      planType: "FREE",
      availableCredits: 100,
      features: {},
    },
  })

  return user
} 