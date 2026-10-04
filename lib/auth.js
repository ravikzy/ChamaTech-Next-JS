import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { Pool } from "pg";


export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "client",
        input: false, 
      },
      phone: {
        type: "string",
        required: false,

      },
    },
  },
  plugins: [
    admin({
      defaultRole: "client",
      adminRoles: ["admin"],
    }),
  ],
  databaseHooks: {
    user: {
      create: {

        before: async (user) => {
          const permitidosNoCadastro = ["client", "technician"];
          if (!permitidosNoCadastro.includes(user.role)) {
            return { data: { ...user, role: "client" } };
          }
          return { data: user };
        },

        after: async (user) => {
          const { query } = await import("@/lib/db");
          if (user.role === "client") {
            await query(
              `insert into clients (user_id) values ($1) on conflict do nothing`,
              [user.id]
            );
          } else if (user.role === "technician") {
            await query(
              `insert into technicians (user_id, is_available, is_verified) values ($1, false, false) on conflict do nothing`,
              [user.id]
            );
          }
        },
      },
    },
  },
});
