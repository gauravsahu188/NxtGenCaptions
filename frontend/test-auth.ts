import { config } from "dotenv";
config({ path: ".env.local" });
import { NextRequest } from "next/server";
import { handlers } from "./src/auth";

async function test() {
  try {
    const req = new NextRequest("http://localhost:3000/api/auth/providers");
    process.env.AUTH_SECRET = "my_super_secret_for_next_auth_needs_to_be_32_chars";
    process.env.AUTH_TRUST_HOST = "true";
    
    const res = await handlers.GET(req);
    console.log("Status:", res.status);
    console.log("Body:", await res.text());
  } catch (e: any) {
    console.error("Crash:", e.stack || e);
  }
}
test();
