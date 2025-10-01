import prisma from "@/lib/PrismaClient/db";
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcryptjs from "bcryptjs";
// import { rollNumberSchema } from "@/types/common";

// configurations for the NextAuth
const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        // We use a generic 'identifier' field for both roll number and email
        identifier: {
          label: "Roll No / Email",
          type: "text",
          placeholder: "123108031 or name@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const identifier = credentials?.identifier?.trim();
        const password = credentials?.password?.trim();

        if (!identifier || !password) {
          throw new Error("Identifier and Password are required");
        }

        let user;
        try {
          // Check if the identifier looks like an email address
          if (identifier.includes("@")) {
            // Find user by email
            user = await prisma.user.findUnique({
              where: { email: identifier },
            });
          } else {
            // Otherwise, assume it's a roll number
            const rollNumber = parseInt(identifier, 10);
            if (isNaN(rollNumber)) {
              throw new Error("Invalid Roll Number format");
            }
            user = await prisma.user.findUnique({
              where: { roll_number: rollNumber },
            });
          }
        } catch (error) {
          console.log("Error while signing in: ", error);
          throw new Error("Something went wrong");
        }

        if (!user) {
          throw new Error("User not found, please register");
        }

        const validPassword = await bcryptjs.compare(password, user.password);

        if (!validPassword) {
          throw new Error("Invalid Password");
        }

        // Return a user object in the expected format
        return {
          id: user.id,
          rollNo: user.roll_number ? String(user.roll_number) : "", // Handle null roll_number
          email: user.email || null, // Add email to the user object
          name: user.name || null,
          image: user.imageURL || null,
          position: user.position || null,
          branch: user.branch || null,
          clubDept: user.club_dept || null,
          joinedAt: user.joined || null,
          batch: user.batch || null,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // async redirect({ url }) {
    //   // url = baseUrl + "/"; // Adjusted to use correct baseUrl
    //   return url;
    // },
    async session({ session, token }) {
      if (token && token.user) {
        session.user = {
          id: token.user.id,
          token: token,
          info: token.user,
        };
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        token.user = {
          ...token.user,
          ...session.user,
        };
        token.picture = token.user.image;
      }
      if (user) {
        token.user = user;
        token.picture = user.image;
      }
      return token;
    },
  },
};

export default authOptions;
