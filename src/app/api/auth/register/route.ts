import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { slugify } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, orgName } = await req.json();

    if (!name || !email || !password || !orgName) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashed,
      },
    });

    // Create org with unique slug
    let slug = slugify(orgName);
    const existing_slug = await db.organization.findUnique({ where: { slug } });
    if (existing_slug) slug = `${slug}-${Date.now()}`;

    const org = await db.organization.create({
      data: {
        name: orgName,
        slug,
        memberships: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
    });

    return NextResponse.json({ userId: user.id, orgId: org.id }, { status: 201 });
  } catch (err) {
    console.error("[REGISTER]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
