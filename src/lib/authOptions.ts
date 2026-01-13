// src/lib/authOptions.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import axios from "axios";
import prisma from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        userType: { label: "User Type", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.userType) return null;

        // HRM User Flow (no password)
        if (credentials.userType === "hrm") {
          // Validate via HRM API (implement your proxy)
          const hrmUser = await verifyHrmUser(
            credentials.email,
            credentials.password
          );

          if (!hrmUser) return null;

          // Upsert HRM user
          const user = await prisma.user.upsert({
            where: { email: hrmUser.email },
            update: {
              name: hrmUser.facilityName,
              facilityCode: hrmUser.facilityCode,
              facilityName: hrmUser.facilityName,
              facilityType: hrmUser.facilityType,
              division: hrmUser.division,
              district: hrmUser.district,
              upazila: hrmUser.upazila,
              role: "SUBMITTER",
            },
            create: {
              email: hrmUser.email,
              name: hrmUser.facilityName,
              facilityCode: hrmUser.facilityCode,
              facilityName: hrmUser.facilityName,
              facilityType: hrmUser.facilityType,
              division: hrmUser.division,
              district: hrmUser.district,
              upazila: hrmUser.upazila,
              role: "SUBMITTER",
            },
          });
          console.log(hrmUser);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            facilityCode: user.facilityCode,
            facilityName: user.facilityName,
            facilityType: user.facilityType,
            division: user.division,
            district: user.district,
            upazila: user.upazila,
          };
        }

        // Local Exporter Flow
        if (credentials.userType === "local") {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user || user.role !== "EXPORTER") return null;
          if (!user.password) return null;

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isValid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            facilityCode: user.facilityCode,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.facilityCode = user.facilityCode;
        token.facilityName = user.facilityName;
        token.facilityType = user.facilityType;
        token.division = user.division;
        token.district = user.district;
        token.upazila = user.upazila;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "SUBMITTER" | "EXPORTER";
        session.user.facilityCode = token.facilityCode as string;
        session.user.facilityName = token.facilityName as string;
        session.user.facilityType = token.facilityType as string;
        session.user.division = token.division as string;
        session.user.district = token.district as string;
        session.user.upazila = token.upazila as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth",
  },
};

async function verifyHrmUser(email: string, password: string) {
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/hrm/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: email, password }),
    });

    if (!res.ok) throw new Error("HRM auth failed");
    return await res.json();
  } catch (error) {
    console.error("HRM verification error:", error);
    return null;
  }
}
